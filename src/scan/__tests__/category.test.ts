import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { Account, Category } from '../../types';
import { extractAmount } from '../amount';
import { extractDate, extractMerchant, inferAccountId, matchCategoryByName } from '../category';
import { normText } from '../normalize';
import { scanResultToPreset } from '../preset';
import type { ScanResult } from '../types';

const dir = (p: string) => fileURLToPath(new URL(`../__fixtures__/${p}`, import.meta.url));
const pick = (raw: string) => extractAmount(normText(raw));

/** 分类 id 一律随机且跨设备不同，测试里也必须用「只有名字」的构造方式 */
const cat = (id: string, name: string, type: 'expense' | 'income', hidden = false): Category => ({
  id, name, emoji: 'x', type, hidden,
});

const CATEGORIES: Category[] = [
  cat('c-food', '餐饮', 'expense'),
  cat('c-traffic', '交通', 'expense'),
  cat('c-shop', '购物', 'expense'),
  cat('c-live', '居住', 'expense'),
  cat('c-play', '娱乐', 'expense'),
  cat('c-comm', '通讯', 'expense'),
  cat('c-salary', '工资', 'income'),
  cat('c-invest', '理财收益', 'income'),
  cat('c-other', '其他', 'expense', true),
];

const ACCOUNTS: Account[] = [
  { id: 'a-wallet', name: '微信零钱', emoji: 'x', type: 'asset', initialBalance: 0, createdAt: '', bookId: 'b1', kind: 'fund', subtype: 'cash', includeInNet: true, canSelect: true },
  { id: 'a-cmb', name: '招商银行储蓄卡', emoji: 'x', type: 'asset', initialBalance: 0, createdAt: '', bookId: 'b1', kind: 'fund', subtype: 'debit_card', includeInNet: true, canSelect: true },
  { id: 'a-huabei', name: '花呗', emoji: 'x', type: 'liability', initialBalance: 0, createdAt: '', bookId: 'b1', kind: 'payable', subtype: 'huabei', includeInNet: true, canSelect: true },
  { id: 'a-other-book', name: '余额宝', emoji: 'x', type: 'asset', initialBalance: 0, createdAt: '', bookId: 'b2', kind: 'recharge', subtype: 'yuebao', includeInNet: true, canSelect: true },
  { id: 'a-hidden', name: '公积金', emoji: 'x', type: 'asset', initialBalance: 0, createdAt: '', bookId: 'b1', kind: 'fund', subtype: 'fund', includeInNet: false, canSelect: false },
];

describe('matchCategoryByName', () => {
  it('命中值必须是传入分类的 id（绝不凭空造 id）', () => {
    for (const text of ['美团外卖', '滴滴出行', '中国移动话费', '工资', '余额宝收益']) {
      const got = matchCategoryByName(CATEGORIES, text, text === '工资' || text.includes('收益') ? 'income' : 'expense');
      if (got) expect(CATEGORIES.map((c) => c.id)).toContain(got.id);
    }
  });

  it('tier1 优先于规则表命中用户自建分类', () => {
    const mine = [cat('x1', '咖啡', 'expense'), ...CATEGORIES];
    expect(matchCategoryByName(mine, '星巴克咖啡', 'expense')!.id).toBe('x1');
    // 长名优先：同时出现时取更具体的那个
    const mine2 = [cat('x1', '咖啡', 'expense'), cat('x2', '星巴克咖啡', 'expense'), ...CATEGORIES];
    expect(matchCategoryByName(mine2, '星巴克咖啡', 'expense')!.id).toBe('x2');
  });

  it('tier2 关键词规则映射到默认分类名', () => {
    expect(matchCategoryByName(CATEGORIES, '滴滴出行车费', 'expense')!.id).toBe('c-traffic');
    expect(matchCategoryByName(CATEGORIES, '中国移动 话费充值', 'expense')!.id).toBe('c-comm');
    expect(matchCategoryByName(CATEGORIES, '上海房租', 'expense')!.id).toBe('c-live');
    expect(matchCategoryByName(CATEGORIES, '9月工资到账', 'income')!.id).toBe('c-salary');
  });

  it('严格区分收支类型：支出文本不会命中收入分类', () => {
    expect(matchCategoryByName(CATEGORIES, '美团外卖', 'income')).toBeNull();
    expect(matchCategoryByName(CATEGORIES, '9月工资', 'expense')).toBeNull();
  });

  it('tier0 优先采纳账单自带分类（支付宝标「交通出行」而非按商户猜成旅行）', () => {
    const ctrip = normText(readFileSync(dir('alipay-ctrip-autodeduct.txt'), 'utf8')).full;
    expect(matchCategoryByName(CATEGORIES, ctrip, 'expense')!.id).toBe('c-traffic');
    const flash = normText(readFileSync(dir('alipay-taobao-flashbuy.txt'), 'utf8')).full;
    expect(matchCategoryByName(CATEGORIES, flash, 'expense')!.id).toBe('c-food');
  });

  it('自带分类词表外时退回名称/规则匹配', () => {
    expect(matchCategoryByName(CATEGORIES, '账单分类 神秘类目\n滴滴出行', 'expense')!.id).toBe('c-traffic');
  });

  it('OCR 把标签与值拆成两行、且值带垃圾尾字符时仍能命中', () => {
    const scrambled = normText(readFileSync(dir('ocr-scrambled-columns.txt'), 'utf8')).full;
    expect(matchCategoryByName(CATEGORIES, scrambled, 'expense')!.id).toBe('c-traffic');
  });

  it('隐藏分类不参与匹配', () => {
    expect(matchCategoryByName([cat('h', '其他', 'expense', true)], '其他支出', 'expense')).toBeNull();
  });

  it('无命中返回 null', () => {
    expect(matchCategoryByName(CATEGORIES, '某某无名小铺', 'expense')).toBeNull();
    expect(matchCategoryByName([], '美团', 'expense')).toBeNull();
  });
});

describe('extractDate', () => {
  const now = new Date(2026, 8, 24, 12); // 2026-09-24

  it('完整年月日', () => {
    expect(extractDate('支付时间 2026-09-21 19:04:33', now)).toBe('2026-09-21');
    expect(extractDate('2026年9月1日 14:02', now)).toBe('2026-09-01');
    expect(extractDate('2026/09/21', now)).toBe('2026-09-21');
    expect(extractDate('流水 20260921ABC', now)).toBe('2026-09-21');
  });

  it('月日与相对日期', () => {
    expect(extractDate('9月21日 微信支付', now)).toBe('2026-09-21');
    expect(extractDate('昨天 实付款 ¥12.00', now)).toBe('2026-09-23');
    expect(extractDate('前天 消费', now)).toBe('2026-09-22');
    expect(extractDate('09-21 19:04', now)).toBe('2026-09-21');
  });

  it('永不返回未来日期', () => {
    for (const text of ['2027-03-01', '12月31日', '2026-10-05 交易时间', '20260930']) {
      expect(extractDate(text, now) <= '2026-09-24', text).toBe(true);
    }
  });

  it('识别不到则回退今天', () => {
    expect(extractDate('星巴克咖啡 支付成功', now)).toBe('2026-09-24');
    expect(extractDate('', now)).toBe('2026-09-24');
  });

  it('拒绝 2月31日 这类被 Date 滚动的假日期', () => {
    expect(extractDate('2026年2月31日', now)).toBe('2026-09-24');
  });
});

describe('extractMerchant', () => {
  it('取标签后的值（全角括号已由 normText 折叠成半角）', () => {
    const lines = normText('支付成功\n商户名称 星巴克咖啡（望京店）\n¥28.50').lines;
    expect(extractMerchant(lines, 2)).toBe('星巴克咖啡(望京店)');
  });

  it('状态词不会被当成商户名', () => {
    const lines = normText('支付成功\n¥28.50').lines;
    expect(extractMerchant(lines, 1)).toBe('');
  });

  it('「付款方式」不能被当成商户标签（付款方 是它的子串）', () => {
    const lines = normText('支付成功\n¥28.50\n付款方式 余额宝').lines;
    expect(extractMerchant(lines, 1)).not.toContain('余额宝');
    expect(extractMerchant(lines, 1)).toBe('');
  });

  it('标签后必须紧跟分隔符，长标签优先', () => {
    const lines = normText('商户名称 罗技数码\n¥199.00').lines;
    expect(extractMerchant(lines, 1)).toBe('罗技数码');
  });

  it('空文本返回空串', () => {
    expect(extractMerchant([], 0)).toBe('');
  });
});

describe('inferAccountId', () => {
  it('账户名直接命中', () => {
    expect(inferAccountId(ACCOUNTS, '付款方式 微信零钱', 'b1')).toBe('a-wallet');
  });

  it('别名映射：零钱 / 储蓄卡 / 花呗', () => {
    expect(inferAccountId(ACCOUNTS, '支付方式 零钱(1003)', 'b1')).toBe('a-wallet');
    expect(inferAccountId(ACCOUNTS, '付款方式 招商银行储蓄卡 9988', 'b1')).toBe('a-cmb');
    expect(inferAccountId(ACCOUNTS, '支付渠道 花呗', 'b1')).toBe('a-huabei');
  });

  it('不得跨账本、不得命中不可选账户', () => {
    expect(inferAccountId(ACCOUNTS, '付款方式 余额宝 转出', 'b1')).toBe('');
    expect(inferAccountId(ACCOUNTS, '付款方式 公积金', 'b1')).toBe('');
    expect(inferAccountId(ACCOUNTS, '付款方式 余额宝', 'b2')).toBe('a-other-book');
  });

  it('没有付款方式上下文时不猜账户：页眉品牌词不算出资账户', () => {
    const withAlipay: Account[] = [...ACCOUNTS, { ...ACCOUNTS[0], id: 'a-alipay', name: '支付宝' }];
    expect(inferAccountId(withAlipay, '7:42\n支付宝\n支付成功\n¥28.50', 'b1')).toBe('');
    expect(inferAccountId(withAlipay, '付款方式 支付宝\n¥28.50', 'b1')).toBe('a-alipay');
  });

  it('命中不到返回空串，交给表单默认值', () => {
    expect(inferAccountId(ACCOUNTS, '付款方式 现金', 'b1')).toBe('');
  });
});

describe('scanResultToPreset', () => {
  const ctx = { categories: CATEGORIES, accounts: ACCOUNTS, activeBookId: 'b1', now: new Date(2026, 8, 24, 12) };
  const fromFixture = (file: string, over: Partial<ScanResult> = {}): ScanResult => {
    const n = normText(readFileSync(dir(file), 'utf8'));
    return { ok: true, engine: 'text', text: n.full, amount: pick(n.full)!, ms: 0, ...over };
  };

  it('preset 形状：id / createdAt 留空，bookId 取当前账本', () => {
    const p = scanResultToPreset(fromFixture('alipay-pay-success.txt'), ctx);
    expect(p.id).toBe('');
    expect(p.createdAt).toBe('');
    expect(p.bookId).toBe('b1');
    expect(p.amount).toBe(28.5);
    expect(p.type).toBe('expense');
  });

  it('分类 id 必属于传入分类', () => {
    const p = scanResultToPreset(fromFixture('wechat-pay-voucher.txt'), ctx);
    expect(p.categoryId).toBe('c-food');
    expect(CATEGORIES.map((c) => c.id)).toContain(p.categoryId);
  });

  it('账户推断不得越账本', () => {
    const p = scanResultToPreset(fromFixture('alipay-pay-success.txt'), ctx);
    expect(['', 'a-wallet', 'a-cmb', 'a-huabei']).toContain(p.accountId);
  });

  it('收入截图带 income 与工资分类', () => {
    const p = scanResultToPreset(fromFixture('cmb-salary-income.txt'), ctx);
    expect(p.type).toBe('income');
    expect(p.categoryId).toBe('c-salary');
    expect(p.amount).toBe(8900);
  });

  it('日期取截图日期且不超前', () => {
    expect(scanResultToPreset(fromFixture('wechat-pay-voucher.txt'), ctx).date).toBe('2026-09-21');
    expect(scanResultToPreset(fromFixture('unsigned-plain.txt'), ctx).date).toBe('2026-09-24');
  });

  it('模型商户名未出现在原文时按幻觉丢弃', () => {
    const p = scanResultToPreset(fromFixture('alipay-pay-success.txt', { merchant: '不存在的商户' }), ctx);
    expect(p.note).not.toContain('不存在的商户');
  });

  it('金额为 0 时不阻断（UI 让用户手输）', () => {
    const p = scanResultToPreset({ ok: true, engine: 'text', text: '一张没有数字的图', ms: 0 }, ctx);
    expect(p.amount).toBe(0);
    expect(p.categoryId).toBe('');
  });
});
