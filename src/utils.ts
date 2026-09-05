import type { Account, Category, Txn, TxnType } from './types';

export const round2 = (n: number) => Math.round(n * 100) / 100;

export const pad = (n: number) => String(n).padStart(2, '0');

export function fmtISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 解析 YYYY-MM-DD 为本地时间（正午，规避时区偏移问题） */
export function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12);
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** 本周周一 */
export function startOfWeek(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return addDays(x, -((x.getDay() + 6) % 7));
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export function sameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function fmtMonthLabel(d: Date): string {
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
}

export function fmtYearLabel(d: Date): string {
  return `${d.getFullYear()}年`;
}

/** 该年该月的 YYYY-MM 键 */
export function ymKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

/** 周期规则：推进一个周期（保持「日」不变，自动处理大小月，如 1/31 → 2/28） */
export function stepFreq(d: Date, freq: 'daily' | 'weekly' | 'monthly' | 'yearly'): Date {
  if (freq === 'daily') return addDays(d, 1);
  if (freq === 'weekly') return addDays(d, 7);
  const [dy, dm] = freq === 'monthly' ? [d.getFullYear(), d.getMonth() + 1] : [d.getFullYear() + 1, d.getMonth()];
  const daysInTarget = new Date(dy, dm + 1, 0).getDate();
  return new Date(dy, dm, Math.min(d.getDate(), daysInTarget), 12);
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/** 列表分组用的日期标签：今天 / 昨天 / M月D日 周X */
export function fmtDayLabel(dateStr: string): string {
  const d = parseISO(dateStr);
  const today = new Date();
  const todayISO = fmtISO(today);
  const yestISO = fmtISO(addDays(today, -1));
  if (dateStr === todayISO) return '今天';
  if (dateStr === yestISO) return '昨天';
  return `${d.getMonth() + 1}月${d.getDate()}日 ${WEEKDAYS[d.getDay()]}`;
}

export function fmtMoney(n: number): string {
  return (
    '¥' +
    Math.abs(n).toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

/** 大数字缩写：统计轴用 */
export function fmtShort(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 100000000) return (n / 100000000).toFixed(1) + '亿';
  if (abs >= 10000) return (n / 10000).toFixed(1) + '万';
  return String(Math.round(n));
}

export const uid = () =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/* 全屏覆盖页打开时锁定背景滚动（计数式，支持覆盖页叠加） */
let scrollLockCount = 0;
export function lockBodyScroll() {
  scrollLockCount += 1;
  document.body.style.overflow = 'hidden';
}
export function unlockBodyScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) document.body.style.overflow = '';
}

/** 账户余额 = 期初 + 收入 − 支出 ± 转账（可截止某日期，ISO 字符串可直接比较）。
 *  负债账户余额为欠款额，方向与资产账户相反：消费增加欠款、还款/退款减少欠款 */
export function accountBalance(acc: Account, txns: Txn[], endISO?: string): number {
  let b = acc.initialBalance;
  const dir = acc.type === 'liability' ? -1 : 1;
  for (const t of txns) {
    if (endISO && t.date > endISO) continue;
    // 调整流水仅是操作痕迹，差额已并入期初余额，不参与余额计算
    if (t.type === 'adjust') continue;
    if (t.type === 'transfer') {
      if (t.accountId === acc.id) b -= dir * t.amount;
      if (t.toAccountId === acc.id) b += dir * t.amount;
      continue;
    }
    if (t.accountId !== acc.id) continue;
    b += dir * (t.type === 'income' ? t.amount : -t.amount);
  }
  return round2(b);
}

export interface Totals {
  assets: number;
  liabilities: number;
  netWorth: number;
}

export function computeTotals(accounts: Account[], txns: Txn[], endISO?: string): Totals {
  let assets = 0;
  let liabilities = 0;
  for (const a of accounts) {
    if (a.includeInNet === false) continue;
    const b = accountBalance(a, txns, endISO);
    if (a.type === 'asset') assets += b;
    else liabilities += b;
  }
  assets = round2(assets);
  liabilities = round2(liabilities);
  return { assets, liabilities, netWorth: round2(assets - liabilities) };
}

/** 流水的时分（HH:MM），取创建时间；解析失败返回空串 */
export function fmtHm(createdAt?: string): string {
  if (!createdAt) return '';
  // 演示数据为 "YYYY-MM-DD HH:MM"，实时记录为 ISO 字符串
  const m = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/.exec(createdAt);
  if (m) return m[2];
  const d = new Date(createdAt);
  return Number.isNaN(d.getTime()) ? '' : `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 计算器表达式求值：仅数字与 + - × ÷（含 ×/÷ 记号），先乘除后加减；非法返回 NaN */
export function evalAmount(raw: string): number {
  const s = raw.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
  if (!s || !/^[0-9.+\-*/]+$/.test(s) || /[+\-*/]{2,}/.test(s)) return NaN;
  const tokens = s.match(/\d+\.?\d*|\.\d+|[+\-*/]/g);
  if (!tokens) return NaN;
  let k = 0;
  let sign = 1;
  if (tokens[0] === '+' || tokens[0] === '-') {
    sign = tokens[0] === '-' ? -1 : 1;
    k = 1;
  }
  if (k >= tokens.length || /^[+\-*/]$/.test(tokens[k])) return NaN;
  let cur = sign * parseFloat(tokens[k]);
  k += 1;
  const flat: (number | string)[] = [];
  while (k < tokens.length) {
    const op = tokens[k];
    const next = tokens[k + 1];
    if (!next || /^[+\-*/]$/.test(next)) return NaN;
    const v = parseFloat(next);
    if (op === '*' || op === '/') {
      if (op === '/' && v === 0) return NaN;
      cur = op === '*' ? cur * v : cur / v;
    } else {
      flat.push(cur, op);
      cur = v;
    }
    k += 2;
  }
  flat.push(cur);
  let result = flat[0] as number;
  for (let j = 1; j < flat.length; j += 2) {
    result = flat[j] === '+' ? (result as number) + (flat[j + 1] as number) : (result as number) - (flat[j + 1] as number);
  }
  return Math.round(result * 10000) / 10000;
}

/** 近 N 个月每月末的净资产（当前月按今天） */
export function netWorthSeries(
  accounts: Account[],
  txns: Txn[],
  months = 12,
): { label: string; value: number }[] {
  const now = new Date();
  const pts: { label: string; value: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const anchor =
      i === 0 ? now : endOfMonth(new Date(now.getFullYear(), now.getMonth() - i, 1));
    const t = computeTotals(accounts, txns, fmtISO(anchor));
    pts.push({ label: `${anchor.getMonth() + 1}月`, value: t.netWorth });
  }
  return pts;
}

export type Period = 'week' | 'month' | 'year';

export interface Bucket {
  key: string;
  label: string;
  startISO: string;
  endISO: string;
}

/** 一个周期内的分桶：周→7 天，月→按日，年→12 个月 */
export function trendBuckets(period: Period, ref = new Date()): Bucket[] {
  const buckets: Bucket[] = [];
  if (period === 'week') {
    const base = startOfWeek(ref);
    for (let i = 0; i < 7; i++) {
      const s = addDays(base, i);
      buckets.push({
        key: fmtISO(s),
        label: `${s.getMonth() + 1}/${s.getDate()}`,
        startISO: fmtISO(s),
        endISO: fmtISO(s),
      });
    }
  } else if (period === 'month') {
    const days = endOfMonth(ref).getDate();
    for (let i = 1; i <= days; i++) {
      const s = new Date(ref.getFullYear(), ref.getMonth(), i);
      buckets.push({
        key: fmtISO(s),
        label: `${ref.getMonth() + 1}/${i}`,
        startISO: fmtISO(s),
        endISO: fmtISO(s),
      });
    }
  } else {
    for (let m = 0; m < 12; m++) {
      const s = new Date(ref.getFullYear(), m, 1);
      const e = new Date(ref.getFullYear(), m + 1, 0);
      buckets.push({
        key: `${ref.getFullYear()}-${pad(m + 1)}`,
        label: `${m + 1}月`,
        startISO: fmtISO(s),
        endISO: fmtISO(e),
      });
    }
  }
  return buckets;
}

export const PERIOD_LABEL: Record<Period, string> = {
  week: '本周',
  month: '本月',
  year: '今年',
};

export function sumIn(
  txns: Txn[],
  startISO: string,
  endISO: string,
  type?: TxnType,
): number {
  let s = 0;
  for (const t of txns) {
    if (t.date < startISO || t.date > endISO) continue;
    if (type && t.type !== type) continue;
    s += t.amount;
  }
  return round2(s);
}

export interface CategorySlice {
  id: string;
  name: string;
  emoji: string;
  value: number;
}

/** 分类占比（倒序，Top N + 其他） */
export function categoryBreakdown(
  txns: Txn[],
  categories: Category[],
  type: TxnType,
  topN = 7,
): CategorySlice[] {
  const byId = new Map<string, number>();
  for (const t of txns) {
    if (t.type !== type) continue;
    byId.set(t.categoryId, (byId.get(t.categoryId) ?? 0) + t.amount);
  }
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const slices: CategorySlice[] = [];
  for (const [id, value] of byId) {
    const c = catMap.get(id);
    slices.push({ id, name: c?.name ?? '未知', emoji: c?.emoji ?? '❓', value: round2(value) });
  }
  slices.sort((a, b) => b.value - a.value);
  if (slices.length <= topN) return slices;
  const rest = slices.slice(topN).reduce((s, x) => s + x.value, 0);
  return [...slices.slice(0, topN), { id: '__other__', name: '其他', emoji: '📦', value: round2(rest) }];
}
