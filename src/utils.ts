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

/** 账户余额 = 期初 + 收入 − 支出（可截止某日期，ISO 字符串可直接比较） */
export function accountBalance(acc: Account, txns: Txn[], endISO?: string): number {
  let b = acc.initialBalance;
  for (const t of txns) {
    if (t.accountId !== acc.id) continue;
    if (endISO && t.date > endISO) continue;
    b += t.type === 'income' ? t.amount : -t.amount;
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
    const b = accountBalance(a, txns, endISO);
    if (a.type === 'asset') assets += b;
    else liabilities += b;
  }
  assets = round2(assets);
  liabilities = round2(liabilities);
  return { assets, liabilities, netWorth: round2(assets - liabilities) };
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
