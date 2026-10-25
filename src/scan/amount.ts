import { round2 } from '../utils';
import { CONFIDENCE_GATE } from './types';
import type { AmountCandidate, AmountGuess, AmountKind, OcrWord } from './types';

/** 支付截图里绝大多数数字不是金额，本模块的工作是「排除」而非「挑选」。 */

export const MAX_AMOUNT = 2_000_000;

/** 数字候选：千分位 / 小数 / 纯整数三条路 */
const NUM_RE = /\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+\.\d+|\d+/g;

/** 强锚点：几乎只伴随真实应付金额出现 */
export const STRONG_ANCHORS = [
  '实付款', '实付金额', '支付金额', '付款金额', '扣款金额', '交易金额', '账单金额', '订单金额',
  '合计金额', '应付金额', '待付金额', '收款金额', '入账金额', '到账金额', '退款金额', '转出金额',
  '转入金额', '提现金额', '充值金额', '支付成功', '付款成功', '交易成功', '扣款成功', '退款成功',
  '实付', '总计', '合计', '小计', '金额',
  // 繁体账单（港澳 / 台系 App）不会自动简化，需并列收录
  '實付款', '支付金額', '付款金額', '交易金額', '退款金額', '金額', '總計', '合計',
];

/** 中锚点：常见于说明性文字，权重减半 */
export const MID_ANCHORS = [
  '扣款', '支出', '收入', '入账', '到账', '转出', '转入', '提现', '充值', '退款', '收款', '付款', '支付',
  '轉出', '轉入', '提現',
];

/** 硬否决标签：其右侧的数字一律不是金额（单号/卡号/手机号） */
const HARD_LABELS =
  '订单号|交易单号|商家订单号|商户订单号|支付流水号|流水号|银行卡号|卡号|尾号|手机号|验证码|身份证号|邮编|编号';

/** 软否决标签：其后 10 字符内的数字属于干扰项（余额/积分/原价/红包抵扣…） */
const SOFT_LABELS =
  '积分|数量|件数|份数|次数|评分|余额|可用|累计|已省|已减|优惠|折扣|原价|单价|运费|汇率|利率|年化|版本|步数|热量|服务费|手续费|红包|立减|抵扣|返还|返利|餘額|積分|優惠|原價|運費|數量';

/** 紧跟数字的量词/单位：这些数字是计数不是金额（「9月支出」「共 15笔」） */
const UNIT_SUFFIX = /[月日年点笔件次个位秒人份折倍]/;

/**
 * 真实金额后面只会跟「元 / 万 / 行尾 / 标点」，不会直接粘一个汉字。
 * 「立即领取20积分」这类粘连是账单里最常见的假金额来源。
 */
const isCjk = (c: string | undefined) => !!c && c >= '一' && c <= '鿿';
const gluedCjk = (c: string | undefined) => isCjk(c) && c !== '元' && c !== '万' && c !== '圆';

/** 独立否决形态：长连号、日期、时间、手机号、8 位紧凑日期 */
const VETO_PATTERNS: RegExp[] = [
  /\d{13,}/g,
  /\d{4}[-/.年]\d{1,2}([-/.月]\d{1,2}日?)?/g,
  /\d{1,2}:\d{2}(:\d{2})?/g,
  /1[3-9]\d{9}/g,
  /20\d{6}/g,
];

interface Span {
  a: number;
  b: number;
}

const isDigit = (c: string | undefined) => !!c && c >= '0' && c <= '9';

/**
 * 关键词与数字一律在「去空白行」上匹配：OCR 会把「订 单 号」「1.28 万」拆开，
 * 但数字之间不会因此粘连成假值（金额本身不含空格，千分位用的是逗号）。
 */
const squeeze = (line: string) => (line.includes(' ') ? line.replace(/\s+/g, '') : line);

function maskAll(line: string): Span[] {
  const spans: Span[] = [];
  for (const re of VETO_PATTERNS) {
    for (const m of line.matchAll(re)) spans.push({ a: m.index!, b: m.index! + m[0].length });
  }
  for (const m of line.matchAll(new RegExp(HARD_LABELS, 'g'))) spans.push({ a: m.index, b: line.length });
  for (const m of line.matchAll(new RegExp(`(?:${SOFT_LABELS})[^\\d]{0,6}`, 'g'))) {
    spans.push({ a: m.index, b: Math.min(line.length, m.index + m[0].length + 10) });
  }
  return spans;
}

const covered = (spans: Span[], a: number, b: number) => spans.some((s) => a < s.b && b > s.a);

function matchAnchor(text: string): { word: string; score: number } {
  for (const w of STRONG_ANCHORS) if (text.includes(w)) return { word: w, score: 10 };
  for (const w of MID_ANCHORS) if (text.includes(w)) return { word: w, score: 7 };
  return { word: '', score: 0 };
}

/**
 * 锚点优先取候选左侧；账单版式里状态词常在金额**上下两行**
 * （支付宝详情页「商户 / -412.00 / 自动扣款成功」在下方，支付成功页在上方），故双向回退。
 */
function findAnchor(lines: string[], li: number, col: number): { word: string; score: number } {
  const back = squeeze(lines[li]).slice(Math.max(0, col - 14), col);
  const own = matchAnchor(back);
  if (own.word) return own;
  const short = (s: string) => s && s.length <= 16 && !/\d/.test(s);
  const prev = li > 0 ? squeeze(lines[li - 1]) : '';
  if (short(prev)) {
    const hit = matchAnchor(prev);
    if (hit.word) return hit;
  }
  const next = li + 1 < lines.length ? squeeze(lines[li + 1]) : '';
  if (short(next)) {
    const hit = matchAnchor(next);
    if (hit.word) return hit;
  }
  return { word: '', score: 0 };
}

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((x, y) => x - y);
  return s[Math.floor(s.length / 2)] || 0;
}

function classifyKind(full: string, line: string, anchor: string, minus: boolean): AmountKind {
  const ctx = squeeze(line) + squeeze(full);
  // 减号是账单详情页的硬约定：-17.00 一定是从自己账户流出，「对方已收钱」说的是对方
  if (minus) return 'expense';
  const income = /退款|已全额退款|收款成功|收款金额|入账金额|到账金额|退货|收入/.test(ctx);
  const paid = /实付|付款金额|支付金额|交易金额|扣款|支出|消费|支付成功|付款成功/.test(ctx);
  if (income && !/实付|付款金额|支付金额|交易金额|扣款/.test(line + anchor)) return 'income';
  if (!income && !paid && /转出|转入|提现|充值|零钱通|余额宝/.test(ctx)) return 'transfer';
  return 'expense';
}

export interface AmountInput {
  lines: string[];
  full?: string;
  /** OCR 词框（本地 OCR 路才有）：提供字号与位置先验 */
  words?: OcrWord[];
}

/**
 * 从一组文本行里挑出「这笔支付的金额」。
 * 返回 null 表示一个可用数字都没抓到（UI 应留空让用户手输，而非硬猜）。
 */
export function extractAmount(input: AmountInput): AmountGuess | null {
  const { lines, words } = input;
  const full = input.full ?? lines.join('\n');
  if (!lines.length) return null;

  const wordList = words?.length ? words : null;
  const wordMap = wordList
    ? new Map<string, OcrWord[]>()
    : null;
  if (wordList && wordMap) {
    for (const w of wordList) {
      const key = w.text.replace(/[,，\s]/g, '');
      if (!key) continue;
      const arr = wordMap.get(key);
      if (arr) arr.push(w);
      else wordMap.set(key, [w]);
    }
  }
  const medH = wordList ? median(wordList.map((w) => w.box.h)) : 0;
  const pageH = wordList ? Math.max(...wordList.map((w) => w.box.y + w.box.h), 1) : 1;
  const lastLine = Math.max(6, Math.floor(lines.length * 0.25));

  const kept: AmountCandidate[] = [];
  let hadOutOfRange = false;

  lines.forEach((src, li) => {
    const line = squeeze(src);
    const masks = maskAll(line);
    for (const m of line.matchAll(NUM_RE)) {
      const raw = m[0];
      const a = m.index;
      const b = a + raw.length;
      // 只接受「完整数字段」：两侧紧邻仍是数字说明是长连号（订单号/卡号）的一部分
      if (isDigit(line[a - 1]) || isDigit(line[b])) continue;
      const frac = raw.split('.')[1];
      if (frac && frac.length > 2) continue;
      const nextCh = line[b];
      const prevCh = line[a - 1];
      if (nextCh === '%') continue;
      // 括号内是卡号尾号 / 账户别名编号，不是金额
      if ((prevCh === '(' || prevCh === '（') && (nextCh === ')' || nextCh === '）')) continue;
      // 品牌与型号 token：7-Eleven、5G、15 Pro
      if (nextCh === '-' && /[A-Za-z]/.test(line[b + 1] ?? '')) continue;
      if (nextCh && /[A-Za-z]/.test(nextCh)) continue;
      if (nextCh && UNIT_SUFFIX.test(nextCh)) continue;
      // 金额后面只会跟「元/万/标点/行尾」，直接粘汉字的是计数（立即领取20积分）
      if (nextCh && isCjk(nextCh) && nextCh !== '元' && nextCh !== '万' && nextCh !== '圆') continue;
      const wan = nextCh === '万';
      // 账单详情页的主金额一律带减号（-412.00），这是比任何关键词都可靠的信号
      const minus = prevCh === '-';
      let value = Number(raw.replace(/,/g, ''));
      if (wan) value *= 10000;
      if (!Number.isFinite(value) || value <= 0) continue;

      const { word: anchor, score: anchorScore } = findAnchor(lines, li, a);
      const currency = line.slice(Math.max(0, a - 2), a).includes('¥') || line[b + (wan ? 1 : 0)] === '元';
      const cents2 = !!frac && frac.length === 2;
      let fontRatio = 0;
      let high = false;
      if (wordMap && medH > 0) {
        const hit = wordMap.get(raw.replace(/,/g, '')) ?? wordMap.get(raw);
        if (hit?.length) {
          const w = hit[0];
          fontRatio = w.box.h / medH;
          const yRel = w.box.y / pageH;
          high = yRel >= 0.06 && yRel <= 0.5;
        }
      }
      const topArea = wordList ? high : li <= lastLine;

      let score = anchorScore + (currency ? 4 : 0) + (cents2 ? 3 : 0) + (wan ? 2 : 0) + (minus ? 6 : 0);
      if (fontRatio >= 1.5) score += 6;
      else if (fontRatio >= 1.2) score += 3;
      if (topArea) score += 3;
      // 账单金额恒带货币记号（¥ / 两位小数 / 减号 / 万）。一个光秃秃的整数多半是
      // 未读角标、楼层号、张数 —— 真实截图评测里「1」曾压过 ¥28.50。
      if (!currency && !cents2 && !minus && !wan) score -= 6;

      const cand: AmountCandidate = {
        value: round2(value), raw, line: li, col: a, score, anchor, wan, minus, currency, cents2, fontRatio, topArea,
      };
      if (covered(masks, a, b)) continue;
      if (cand.value > MAX_AMOUNT) {
        hadOutOfRange = true;
        continue;
      }
      kept.push(cand);
    }
  });

  if (!kept.length) return null;
  kept.sort((x, y) => y.score - x.score || x.line - y.line || x.col - y.col);
  const top = kept[0];
  const ambiguous = kept.length > 1 && kept[1].score === top.score && kept[1].value !== top.value;

  // 置信度用「证据叠加」而非分数线性映射：每项含义可解释，便于按误判样本单独调权
  let confidence = 0.35;
  if (STRONG_ANCHORS.includes(top.anchor)) confidence += 0.3;
  else if (MID_ANCHORS.includes(top.anchor)) confidence += 0.18;
  if (top.currency) confidence += 0.15;
  if (top.minus) confidence += 0.15;
  if (top.cents2) confidence += 0.1;
  if ((top.fontRatio ?? 0) >= 1.2) confidence += 0.15;
  if (top.topArea) confidence += 0.05;
  // 并列最高分 = 两个数字证据相当，压到闸门以下强制用户点选
  if (ambiguous) confidence = Math.min(confidence, CONFIDENCE_GATE - 0.05);
  confidence = Math.max(0, Math.min(0.95, Math.round(confidence * 100) / 100));

  const flags: string[] = [];
  if (top.wan) flags.push('wan');
  if (hadOutOfRange) flags.push('had-out-of-range');

  return {
    value: top.value,
    kind: classifyKind(full, lines[top.line], top.anchor, !!top.minus),
    confidence,
    // 微信账单常见同值重复行，折叠后只给不同数值，避免 UI 出现三个一样的 chip
    candidates: dedupeByValue(kept).slice(0, 3),
    ambiguous,
    flags,
    anchor: top.anchor,
  };
}

function dedupeByValue(list: AmountCandidate[]): AmountCandidate[] {
  const seen = new Set<number>();
  const out: AmountCandidate[] = [];
  for (const c of list) {
    if (seen.has(c.value)) continue;
    seen.add(c.value);
    out.push(c);
  }
  return out;
}
