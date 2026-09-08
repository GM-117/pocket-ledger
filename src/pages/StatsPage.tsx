import { useEffect, useMemo, useState } from 'react';
import * as echarts from 'echarts';
import { useStore } from '../store';
import { Chart, CHART_COLORS } from '../components/Chart';
import { MonthSwitcher } from '../components/MonthSwitcher';
import type { Period } from '../utils';
import {
  PERIOD_LABEL,
  addMonths,
  categoryBreakdown,
  fmtISO,
  fmtMoney,
  fmtShort,
  netWorthSeries,
  parseISO,
  round2,
  startOfMonth,
  startOfWeek,
  sumIn,
  trendBuckets,
  ymKey,
} from '../utils';

const MUTED_LIGHT = '#7a8194';
const MUTED_DARK = '#8f99ad';

interface ChartColors {
  muted: string;
  line: string;
  ink: string;
  border: string;
  green: string;
  red: string;
  primary: string;
}

/** 图表配色与 CSS 变量（styles.css 深浅主题）保持一致 */
function chartColors(dark: boolean): ChartColors {
  return dark
    ? { muted: MUTED_DARK, line: '#232b3a', ink: '#e9ecf4', border: '#1c222e', green: '#34d399', red: '#f26d6a', primary: '#8091ff' }
    : { muted: MUTED_LIGHT, line: '#eef0f4', ink: '#1b2231', border: '#ffffff', green: '#22c55e', red: '#ef5350', primary: '#5b7cfa' };
}

type StatsPeriod = Period | 'all';

const LABELS: Record<StatsPeriod, string> = { ...PERIOD_LABEL, all: '全部' };

function pieOption(
  title: string,
  total: number,
  totalLabel: string,
  slices: { name: string; emoji: string; value: number }[],
  C: ChartColors,
) {
  return {
    title: {
      text: fmtMoney(total),
      subtext: totalLabel,
      left: 'center',
      top: '40%',
      textStyle: { fontSize: 17, color: C.ink, fontWeight: 700 },
      subtextStyle: { fontSize: 11, color: C.muted },
    },
    legend: {
      bottom: 0,
      type: 'scroll' as const,
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { color: C.muted, fontSize: 11 },
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: C.border,
      borderColor: C.line,
      textStyle: { color: C.ink },
      formatter: (p: { name: string; value: number; percent: number }) =>
        `${p.name}<br/>${fmtMoney(p.value)} · ${p.percent}%`,
    },
    series: [
      {
        type: 'pie' as const,
        radius: ['40%', '60%'],
        center: ['50%', '48%'],
        data: slices.map((s) => ({ name: s.name, value: s.value })),
        itemStyle: { borderColor: C.border, borderWidth: 2, borderRadius: 4 },
        label: {
          show: true,
          color: C.muted,
          formatter: (p: { percent: number; name: string }) => `${p.percent}% ${p.name}`,
          fontSize: 10,
        },
        labelLine: { length: 8, length2: 6, lineStyle: { color: C.line } },
      },
    ],
    color: CHART_COLORS,
  } as echarts.EChartsOption;
}

export function StatsPage() {
  const books = useStore((s) => s.books);
  const accounts = useStore((s) => s.accounts);
  const categories = useStore((s) => s.categories);
  const txns = useStore((s) => s.txns);
  const activeBookId = useStore((s) => s.activeBookId);
  const theme = useStore((s) => s.theme);
  const dark = theme === 'dark';
  const C = chartColors(dark);

  const [period, setPeriod] = useState<StatsPeriod>('month');
  const [anchor, setAnchor] = useState(() => startOfMonth(new Date()));

  // 图表完全跟随右上角当前账本
  const scoped = useMemo(
    () => txns.filter((t) => t.bookId === activeBookId),
    [txns, activeBookId],
  );

  const range = useMemo(() => {
    const todayISO = fmtISO(new Date());
    if (period === 'all') {
      const earliest = scoped.reduce<string | null>((min, t) => (min === null || t.date < min ? t.date : min), null);
      const start = earliest ?? todayISO;
      return { startISO: start, endISO: todayISO };
    }
    const buckets = trendBuckets(period, period === 'week' ? anchor : new Date(anchor));
    return { startISO: buckets[0].startISO, endISO: buckets[buckets.length - 1].endISO };
  }, [period, anchor, scoped]);

  const buckets = useMemo(() => {
    if (period === 'all') {
      // 按月聚合：从最早流水的月份（最多回溯 24 个月）到锚点所在月
      const earliest = scoped.reduce<string | null>((min, t) => (min === null || t.date < min ? t.date : min), null);
      const endMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
      let startMonth = startOfMonth(parseISO(earliest ?? fmtISO(new Date())));
      if (endMonth.getMonth() - startMonth.getMonth() + (endMonth.getFullYear() - startMonth.getFullYear()) * 12 > 23) {
        startMonth = addMonths(endMonth, -23);
      }
      const arr = [];
      let cur = startMonth;
      while (cur <= endMonth) {
        arr.push({
          key: ymKey(cur),
          label: `${cur.getMonth() + 1}月`,
          startISO: fmtISO(new Date(cur.getFullYear(), cur.getMonth(), 1)),
          endISO: fmtISO(new Date(cur.getFullYear(), cur.getMonth() + 1, 0)),
        });
        cur = addMonths(cur, 1);
      }
      return arr;
    }
    return trendBuckets(period, anchor);
  }, [period, anchor, scoped]);

  const periodIncome = sumIn(scoped, range.startISO, range.endISO, 'income');
  const periodExpense = sumIn(scoped, range.startISO, range.endISO, 'expense');
  const periodBalance = round2(periodIncome - periodExpense);

  const dailyAvg = useMemo(() => {
    const todayISO = fmtISO(new Date());
    const s = parseISO(range.startISO);
    const e = parseISO(range.endISO > todayISO ? todayISO : range.endISO);
    const days = Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);
    return round2(periodExpense / days);
  }, [range, periodExpense]);

  const trend = useMemo(() => {
    const income = buckets.map((b) => sumIn(scoped, b.startISO, b.endISO, 'income'));
    const expense = buckets.map((b) => sumIn(scoped, b.startISO, b.endISO, 'expense'));
    return { income, expense, balance: income.map((v, i) => round2(v - expense[i])) };
  }, [buckets, scoped]);

  const trendOption = useMemo(
    () =>
      ({
        tooltip: { trigger: 'axis', backgroundColor: C.border, borderColor: C.line, textStyle: { color: C.ink } },
        legend: {
          data: ['收入', '支出', '结余'],
          bottom: 0,
          icon: 'roundRect',
          itemWidth: 10,
          itemHeight: 10,
          textStyle: { color: C.muted, fontSize: 11 },
        },
        grid: { left: 8, right: 8, top: 28, bottom: 36, containLabel: true },
        xAxis: {
          type: 'category' as const,
          data: buckets.map((b) => b.label),
          axisTick: { show: false },
          axisLine: { lineStyle: { color: C.line } },
          axisLabel: {
            color: C.muted,
            fontSize: 10,
            interval: period === 'month' ? 4 : buckets.length > 16 ? 'auto' : 0,
          },
        },
        yAxis: {
          type: 'value' as const,
          axisLabel: { color: C.muted, fontSize: 10, formatter: (v: number) => fmtShort(v) },
          splitLine: { lineStyle: { color: C.line } },
        },
        series: [
          {
            name: '收入',
            type: 'bar' as const,
            data: trend.income,
            itemStyle: { color: C.green, borderRadius: [3, 3, 0, 0] },
            barMaxWidth: 14,
          },
          {
            name: '支出',
            type: 'bar' as const,
            data: trend.expense,
            itemStyle: { color: C.red, borderRadius: [3, 3, 0, 0] },
            barMaxWidth: 14,
          },
          {
            name: '结余',
            type: 'line' as const,
            data: trend.balance,
            smooth: true,
            symbol: 'circle',
            symbolSize: 5,
            lineStyle: { color: C.primary, width: 2 },
            itemStyle: { color: C.primary },
          },
        ],
      }) as echarts.EChartsOption,
    [buckets, trend, period, C],
  );

  const expenseSlices = useMemo(() => categoryBreakdown(scoped, categories, 'expense'), [scoped, categories]);
  const incomeSlices = useMemo(() => categoryBreakdown(scoped, categories, 'income'), [scoped, categories]);

  const netSeries = useMemo(() => netWorthSeries(accounts, scoped, 12), [accounts, scoped]);

  const netOption = useMemo(
    () =>
      ({
        tooltip: {
          trigger: 'axis',
          valueFormatter: (v: unknown) => fmtMoney(Number(v)),
          backgroundColor: C.border,
          borderColor: C.line,
          textStyle: { color: C.ink },
        },
        grid: { left: 8, right: 14, top: 24, bottom: 12, containLabel: true },
        xAxis: {
          type: 'category' as const,
          data: netSeries.map((p) => p.label),
          axisTick: { show: false },
          axisLine: { lineStyle: { color: C.line } },
          axisLabel: { color: C.muted, fontSize: 10 },
          boundaryGap: false,
        },
        yAxis: {
          type: 'value' as const,
          axisLabel: { color: C.muted, fontSize: 10, formatter: (v: number) => fmtShort(v) },
          splitLine: { lineStyle: { color: C.line } },
        },
        series: [
          {
            name: '净资产',
            type: 'line' as const,
            data: netSeries.map((p) => p.value),
            smooth: true,
            symbol: 'none',
            lineStyle: { color: C.primary, width: 3 },
            areaStyle: {
              color: {
                type: 'linear' as const,
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: dark ? 'rgba(128,145,255,0.3)' : 'rgba(91,124,250,0.26)' },
                  { offset: 1, color: 'rgba(91,124,250,0.02)' },
                ],
              },
            },
          },
        ],
      }) as echarts.EChartsOption,
    [netSeries, C, dark],
  );

  const anchorLabel =
    period === 'year' ? `${anchor.getFullYear()}年` : `${anchor.getFullYear()}年${anchor.getMonth() + 1}月`;

  return (
    <>
      <div className="seg section">
        {(['week', 'month', 'year', 'all'] as StatsPeriod[]).map((p) => (
          <button key={p} className={period === p ? 'active' : ''} onClick={() => setPeriod(p)}>
            {LABELS[p]}
          </button>
        ))}
      </div>

      {period !== 'all' && (
        <MonthSwitcher
          value={anchor}
          onChange={setAnchor}
          mode={period === 'year' ? 'year' : 'month'}
          label={period === 'week' ? `本周（${anchorLabel.slice(0, 4)}）` : anchorLabel}
          disableFuture={period !== 'week'}
          nextDisabled={period === 'week'}
        />
      )}

      <div className="summary-grid section four">
        <div className="stat-card expense">
          <span className="label">支出</span>
          <span className="value">−{periodExpense.toLocaleString('zh-CN')}</span>
        </div>
        <div className="stat-card income">
          <span className="label">收入</span>
          <span className="value">+{periodIncome.toLocaleString('zh-CN')}</span>
        </div>
        <div className="stat-card balance">
          <span className="label">结余</span>
          <span className="value">{periodBalance.toLocaleString('zh-CN')}</span>
        </div>
        <div className="stat-card">
          <span className="label">日均支出</span>
          <span className="value">{dailyAvg.toLocaleString('zh-CN')}</span>
        </div>
      </div>

      <div className="card section">
        <div className="chart-title">
          收支趋势 · {books.find((b) => b.id === activeBookId)?.name}
          <span>
            （{LABELS[period]}
            {period === 'all' ? ' · 按月' : period === 'year' ? ' · 按月' : ' · 按日'}）
          </span>
        </div>
        <Chart option={trendOption} height={280} />
      </div>

      <div className="chart-grid two section">
        <div className="card">
          <Chart
            option={pieOption('支出构成', periodExpense, '总支出', expenseSlices, C)}
            height={280}
          />
        </div>
        <div className="card">
          <Chart
            option={pieOption('收入构成', periodIncome, '总收入', incomeSlices, C)}
            height={280}
          />
        </div>
      </div>

      <div className="card section">
        <div className="chart-title">净资产趋势 · 近 12 个月</div>
        <Chart option={netOption} height={250} />
      </div>
    </>
  );
}
