import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { extractAmount } from '../amount';
import { extractDate } from '../category';
import { normText } from '../normalize';

const dir = (p: string) => fileURLToPath(new URL(`../__fixtures__/${p}`, import.meta.url));

/** 一步到底：原始文本 → 金额猜测（provider 下游走的是同一条链） */
const pick = (raw: string) => extractAmount(normText(raw));

interface Case {
  file: string;
  amount: number;
  kind: 'expense' | 'income' | 'transfer';
  /** 截图里的交易日期，用于验证日期抽取 */
  date?: string;
  minConfidence: number;
  mustNotBe: number[];
}

/** 固定「今天」，让相对日期（昨天）可断言 */
const NOW = new Date(2026, 8, 25, 14, 0);

/** 真实付款截图人工转写的文本，覆盖单号 / 余额 / 积分 / 千分位 / 繁体 / OCR 断字等干扰形态 */
const cases: Case[] = JSON.parse(readFileSync(dir('expected.json'), 'utf8'));

describe('extractAmount · 真实截图 fixture', () => {
  it('fixture 数量满足验收下限', () => {
    expect(cases.length).toBeGreaterThanOrEqual(20);
  });

  it.each(cases)('$file → $amount ($kind)', (c) => {
    const n = normText(readFileSync(dir(c.file), 'utf8'));
    const got = extractAmount(n);
    expect(got, `${c.file} 未抓到任何金额候选`).not.toBeNull();
    expect(got!.value).toBe(c.amount);
    expect(got!.kind).toBe(c.kind);
    expect(got!.confidence).toBeGreaterThanOrEqual(c.minConfidence);
    if (c.date) expect(extractDate(n.full, NOW)).toBe(c.date);
    // 假阳性零容忍：余额 / 积分 / 单号里的数字不得出现在候选前三名
    for (const bad of c.mustNotBe) {
      expect(got!.candidates.map((x) => x.value), `${c.file} 混入干扰数字 ${bad}`).not.toContain(bad);
    }
  });
});

describe('extractAmount · 否决规则', () => {
  it('拒绝 19 位订单号及其片段', () => {
    expect(pick('订单号 2026092122001456781099887766\n实付款 ¥12.00')!.value).toBe(12);
  });

  it('拒绝手机号', () => {
    expect(pick('联系 13812345678\n实付款 ¥9.90')!.value).toBe(9.9);
  });

  it('拒绝日期与时间', () => {
    expect(pick('2026-09-21 14:32:05\n实付款 ¥6.00')!.value).toBe(6);
  });

  it('拒绝百分比与三位小数', () => {
    expect(pick('年化 3.456%\n实付款 ¥1,000.00')!.value).toBe(1000);
  });

  it('拒绝余额与积分邻接数字', () => {
    expect(pick('余额 88,888.00 积分 660\n实付款 ¥20.00')!.value).toBe(20);
  });

  it('三位以上小数一律不采信', () => {
    expect(pick('实付款 12.345')).toBeNull();
  });
});

describe('extractAmount · 边界', () => {
  it('空文本返回 null', () => {
    expect(pick('')).toBeNull();
    expect(pick('\n\n')).toBeNull();
  });

  it('零不作为金额', () => {
    expect(pick('实付款 ¥0.00')).toBeNull();
  });

  it('超上限被拒', () => {
    expect(pick('实付款 ¥9,999,999.00')).toBeNull();
  });

  it('「万」换算并打旗标', () => {
    const got = pick('实付款 1.28万元');
    expect(got!.value).toBe(12800);
    expect(got!.flags).toContain('wan');
  });

  it('千分位正确解析', () => {
    expect(pick('实付款 ¥1,234,567.89')!.value).toBe(1234567.89);
  });

  it('并列最高分时标记 ambiguous 且压低置信度', () => {
    // 真实版式：两行各带一个强锚点金额（同页出现两个「实付」）
    const got = pick('实付款 ¥12.00\n实付 ¥13.00');
    expect(got!.ambiguous).toBe(true);
    expect(got!.confidence).toBeLessThan(0.6);
  });

  it('数字后紧跟汉字的是计数，不是金额', () => {
    expect(pick('支付奖励 立即领取41积分\n-412.00\n自动扣款成功')!.value).toBe(412);
    expect(pick('获得积分 660\n实付款 ¥20.00')!.value).toBe(20);
  });

  it('无锚点无符号时置信度不足，交由 UI 选择候选', () => {
    const got = pick('某某商户\n25.5\n谢谢惠顾');
    expect(got!.confidence).toBeLessThan(0.6);
    expect(got!.candidates[0].value).toBe(25.5);
  });
});

describe('extractAmount · 收支方向', () => {
  const kindOf = (raw: string) => pick(raw)!.kind;

  it('默认支出', () => {
    expect(kindOf('支付成功\n¥28.50')).toBe('expense');
  });
  it('退款为收入', () => {
    expect(kindOf('退款金额 ¥45.90')).toBe('income');
  });
  it('入账为收入', () => {
    expect(kindOf('入账金额 8,900.00')).toBe('income');
  });
  it('提现为转账', () => {
    expect(kindOf('零钱提现\n提现金额 ¥500.00')).toBe('transfer');
  });
});

describe('normText', () => {
  it('全角数字与标点转半角', () => {
    expect(normText('實付金額 ￥１，２３４．５０元').full).toContain('1,234.50');
  });

  it('保留标签与数值之间的空格（商户名靠它切分），只折叠空白串', () => {
    expect(normText('商户名称  星巴克咖啡').lines[0]).toBe('商户名称 星巴克咖啡');
  });

  it('丢弃分隔线噪声与空行', () => {
    expect(normText('支付成功\n----\n\n¥1.00').lines).toEqual(['支付成功', '¥1.00']);
  });
});
