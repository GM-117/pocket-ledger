import { useMemo, useState } from 'react';
import * as echarts from 'echarts';
import { useStore } from '../store';
import { Chart, CHART_COLORS } from '../components/Chart';
import type { Period } from '../utils';
import {
  PERIOD_LABEL,
  categoryBreakdown,
  fmtMoney,
  fmtShort,
  netWorthSeries,
  round2,
  sumIn,
  trendBuckets,
} from '../utils';

const MUTED = '#7a8194';
const LINE = '#eef0f4';

function pieOption(title: string, slices: { name: string; emoji: string; value: number }[]) {
  return {
    title: {
      text: title,
      left: 14,
      top: 12,
      textStyle: { fontSize: 13, color: MUTED, fontWeight: 600 },
    },
    tooltip: {
      trigger: 'item',
      formatter: (p: { name: string; value: number; percent: number }) =>
        `${p.name}<br/>${fmtMoney(p.value)} · ${p.percent}%`,
    },
    legend: {
      bottom: 0,
      type: 'scroll' as const,
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { color: MUTED, fontSize: 11 },
    },
    series: [
      {
        type: 'pie' as const,
        radius: ['44%', '68%'],
        center: ['50%', '46%'],
        data: slices.map((s) => ({ name: `${s.emoji} ${s.name}`, value: s.value })),
        itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 4 },
        label: { show: false },
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

  const [period, setPeriod] = useState<Period>('month');
  const [scope, setScope] = useState('__all__');

  const scoped = useMemo(
    () => (scope === '__all__' ? txns : txns.filter((t) => t.bookId === scope)),
    [txns, scope],
  );

  const buckets = useMemo(() => trendBuckets(period), [period]);
  const rangeStart = buckets[0].startISO;
  const rangeEnd = buckets[buckets.length - 1].endISO;

  const periodIncome = sumIn(scoped, rangeStart, rangeEnd, 'income');
  const periodExpense = sumIn(scoped, rangeStart, rangeEnd, 'expense');
  const periodBalance = round2(periodIncome - periodExpense);

  const trend = useMemo(() => {
    const income = buckets.map((b) => sumIn(scoped, b.startISO, b.endISO, 'income'));
    const expense = buckets.map((b) => sumIn(scoped, b.startISO, b.endISO, 'expense'));
    return { income, expense, balance: income.map((v, i) => round2(v - expense[i])) };
  }, [buckets, scoped]);

  const trendOption = useMemo(
    () =>
      ({
        tooltip: { trigger: 'axis' },
        legend: {
          data: ['收入', '支出', '结余'],
          bottom: 0,
          icon: 'roundRect',
          itemWidth: 10,
          itemHeight: 10,
          textStyle: { color: MUTED, fontSize: 11 },
        },
        grid: { left: 8, right: 8, top: 28, bottom: 36, containLabel: true },
        xAxis: {
          type: 'category' as const,
          data: buckets.map((b) => b.label),
          axisTick: { show: false },
          axisLine: { lineStyle: { color: LINE } },
          axisLabel: { color: MUTED, fontSize: 10, interval: period === 'month' ? 4 : 'auto' },
        },
        yAxis: {
          type: 'value' as const,
          axisLabel: { color: MUTED, fontSize: 10, formatter: (v: number) => fmtShort(v) },
          splitLine: { lineStyle: { color: LINE } },
        },
        series: [
          {
            name: '收入',
            type: 'bar' as const,
            data: trend.income,
            itemStyle: { color: '#22c55e', borderRadius: [3, 3, 0, 0] },
            barMaxWidth: 14,
          },
          {
            name: '支出',
            type: 'bar' as const,
            data: trend.expense,
            itemStyle: { color: '#f97316', borderRadius: [3, 3, 0, 0] },
            barMaxWidth: 14,
          },
          {
            name: '结余',
            type: 'line' as const,
            data: trend.balance,
            smooth: true,
            symbol: 'circle',
            symbolSize: 5,
            lineStyle: { color: '#5b7cfa', width: 2 },
            itemStyle: { color: '#5b7cfa' },
          },
        ],
      }) as echarts.EChartsOption,
    [buckets, trend, period],
  );

  const expenseSlices = useMemo(() => categoryBreakdown(scoped, categories, 'expense'), [scoped, categories]);
  const incomeSlices = useMemo(() => categoryBreakdown(scoped, categories, 'income'), [scoped, categories]);

  const netSeries = useMemo(
    () => netWorthSeries(accounts, scoped, 12),
    [accounts, scoped],
  );

  const netOption = useMemo(
    () =>
      ({
        tooltip: {
          trigger: 'axis',
          valueFormatter: (v: unknown) => fmtMoney(Number(v)),
        },
        grid: { left: 8, right: 14, top: 24, bottom: 12, containLabel: true },
        xAxis: {
          type: 'category' as const,
          data: netSeries.map((p) => p.label),
          axisTick: { show: false },
          axisLine: { lineStyle: { color: LINE } },
          axisLabel: { color: MUTED, fontSize: 10 },
          boundaryGap: false,
        },
        yAxis: {
          type: 'value' as const,
          axisLabel: { color: MUTED, fontSize: 10, formatter: (v: number) => fmtShort(v) },
          splitLine: { lineStyle: { color: LINE } },
        },
        series: [
          {
            name: '净资产',
            type: 'line' as const,
            data: netSeries.map((p) => p.value),
            smooth: true,
            symbol: 'none',
            lineStyle: { color: '#5b7cfa', width: 3 },
            areaStyle: {
              color: {
                type: 'linear' as const,
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(91,124,250,0.26)' },
                  { offset: 1, color: 'rgba(91,124,250,0.02)' },
                ],
              },
            },
          },
        ],
      }) as echarts.EChartsOption,
    [netSeries],
  );

  return (
    <>
      <div className="chips section">
        <button
          className={'chip' + (scope === '__all__' ? ' active' : '')}
          onClick={() => setScope('__all__')}
        >
          全部账本
        </button>
        {books.map((b) => (
          <button
            key={b.id}
            className={'chip' + (scope === b.id ? ' active' : '')}
            onClick={() => setScope(b.id)}
          >
            {b.emoji} {b.name}
          </button>
        ))}
      </div>

      <div className="seg section">
        {(['week', 'month', 'year'] as Period[]).map((p) => (
          <button key={p} className={period === p ? 'active' : ''} onClick={() => setPeriod(p)}>
            {PERIOD_LABEL[p]}
          </button>
        ))}
      </div>

      <div className="summary-grid section">
        <div className="stat-card income">
          <span className="label">收入</span>
          <span className="value">+{periodIncome.toLocaleString('zh-CN')}</span>
        </div>
        <div className="stat-card expense">
          <span className="label">支出</span>
          <span className="value">−{periodExpense.toLocaleString('zh-CN')}</span>
        </div>
        <div className="stat-card balance">
          <span className="label">结余</span>
          <span className="value">{periodBalance.toLocaleString('zh-CN')}</span>
        </div>
      </div>

      <div className="card section">
        <div className="chart-title">
          收支趋势 · {scope === '__all__' ? '全部账本' : books.find((b) => b.id === scope)?.name}
          <span>（按{period === 'year' ? '月' : '日'}）</span>
        </div>
        <Chart option={trendOption} height={280} />
      </div>

      <div className="chart-grid two section">
        <div className="card">
          <Chart option={pieOption('支出构成', expenseSlices)} height={250} />
        </div>
        <div className="card">
          <Chart option={pieOption('收入构成', incomeSlices)} height={250} />
        </div>
      </div>

      <div className="card section">
        <div className="chart-title">净资产趋势 · 近 12 个月</div>
        <Chart option={netOption} height={250} />
      </div>
    </>
  );
}
