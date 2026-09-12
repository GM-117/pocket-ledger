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
  computeTotals,
  fmtISO,
  fmtMoney,
  fmtShort,
  fmtSigned,
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
  /** 空态占位灰环（比网格线深一档，白底卡片上可辨） */
  ring: string;
}

/** 图表配色与 CSS 变量（styles.css 深浅主题）保持一致 */
function chartColors(dark: boolean): ChartColors {
  return dark
    ? { muted: MUTED_DARK, line: '#232b3a', ink: '#e9ecf4', border: '#1c222e', green: '#34d399', red: '#f26d6a', primary: '#8091ff', ring: '#2a3448' }
    : { muted: MUTED_LIGHT, line: '#eef0f4', ink: '#1b2231', border: '#ffffff', green: '#22c55e', red: '#ef5350', primary: '#5b7cfa', ring: '#e4e7ee' };
}

type StatsPeriod = Period | 'all';

const LABELS: Record<StatsPeriod, string> = { ...PERIOD_LABEL, all: '全部' };

/** 构成环形图与资产负债趋势的卡内切换 */
type PieType = 'expense' | 'income';
type NetType = 'net' | 'asset' | 'liability';

const NET_NAME: Record<NetType, string> = { net: '净资产', asset: '总资产', liability: '总负债' };

function pieOption(
  total: number,
  totalLabel: string,
  slices: { name: string; emoji: string; value: number }[],
  C: ChartColors,
) {
  // 无数据时给一个占位灰环（参考同类记账 App 的 ¥0.00 空态），而不是空白
  const empty = slices.length === 0;
  const data = empty
    ? [
        {
          name: '',
          value: 1,
          itemStyle: { color: C.ring, borderColor: C.border, borderWidth: 0 },
          label: { show: false },
          labelLine: { show: false },
        },
      ]
    : slices.map((s) => ({ name: s.name, value: s.value }));
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
      show: !empty,
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
        data,
        // 占位灰环必须整段静默：单靠 data 项的 silent 挡不住 item tooltip，
        // 会在 ¥0.00 空态上悬停出「¥1.00 · 100%」的幽灵数据
        silent: empty,
        ...(empty ? { emphasis: { scale: false } } : {}),
        itemStyle: { borderColor: C.border, borderWidth: 2, borderRadius: empty ? 0 : 4 },
        label: empty
          ? { show: false }
          : {
              show: true,
              color: C.muted,
              formatter: (p: { percent: number; name: string }) => `${p.percent}% ${p.name}`,
              fontSize: 10,
            },
        labelLine: empty ? { show: false } : { length: 8, length2: 6, lineStyle: { color: C.line } },
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
  const [pieType, setPieType] = useState<PieType>('expense');
  const [netType, setNetType] = useState<NetType>('net');

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
    const bs = trendBuckets(period, anchor);
    return { startISO: bs[0].startISO, endISO: bs[bs.length - 1].endISO };
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
            // 柱子居中到类目中点，与结余折线的取数位置对齐（默认双柱会左右错开）
            barGap: '-100%' as const,
          },
          {
            name: '支出',
            type: 'bar' as const,
            data: trend.expense,
            itemStyle: { color: C.red, borderRadius: [3, 3, 0, 0] },
            barMaxWidth: 14,
            barGap: '-100%' as const,
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

  // 构成环形图：跟随当前所选周期（周/月/年/全部）过滤流水，与卡片总额同口径
  const rangeTxns = useMemo(
    () => scoped.filter((t) => t.date >= range.startISO && t.date <= range.endISO),
    [scoped, range],
  );

  const expenseSlices = useMemo(
    () => categoryBreakdown(rangeTxns, categories, 'expense'),
    [rangeTxns, categories],
  );
  const incomeSlices = useMemo(
    () => categoryBreakdown(rangeTxns, categories, 'income'),
    [rangeTxns, categories],
  );

  const pieOpt = useMemo(
    () =>
      pieOption(
        pieType === 'expense' ? periodExpense : periodIncome,
        pieType === 'expense' ? '总支出' : '总收入',
        pieType === 'expense' ? expenseSlices : incomeSlices,
        C,
      ),
    [pieType, periodExpense, periodIncome, expenseSlices, incomeSlices, C],
  );

  // 资产/负债/净资产趋势：跟随当前账本。账户与流水都必须按账本过滤，
  // 否则会把其他账本的账户余额算进来（空账本显示别的账本的数据）
  const bookAccounts = useMemo(
    () => accounts.filter((a) => a.bookId === activeBookId),
    [accounts, activeBookId],
  );
  const netSeries = useMemo(() => {
    const todayISO = fmtISO(new Date());
    return buckets.map((b) => {
      const t = computeTotals(bookAccounts, scoped, b.endISO > todayISO ? todayISO : b.endISO);
      return { label: b.label, netWorth: t.netWorth, assets: t.assets, liabilities: t.liabilities };
    });
  }, [buckets, bookAccounts, scoped]);

  const netOption = useMemo(() => {
    const key = netType === 'net' ? 'netWorth' : netType === 'asset' ? 'assets' : 'liabilities';
    const line = netType === 'net' ? C.primary : netType === 'asset' ? C.green : C.red;
    const rgb =
      netType === 'net'
        ? dark
          ? '128,145,255'
          : '91,124,250'
        : netType === 'asset'
          ? dark
            ? '52,211,153'
            : '34,197,94'
          : dark
            ? '242,109,106'
            : '239,83,80';
    return {
      tooltip: {
        trigger: 'axis',
        valueFormatter: (v: unknown) => fmtSigned(Number(v)),
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
          name: NET_NAME[netType],
          type: 'line' as const,
          data: netSeries.map((p) => p[key]),
          smooth: true,
          // 带圆点标记：「全部」可能只有单个分桶，无标记的折线单点会什么都不画
          symbol: 'circle' as const,
          symbolSize: 6,
          lineStyle: { color: line, width: 3 },
          itemStyle: { color: line },
          areaStyle: {
            color: {
              type: 'linear' as const,
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: `rgba(${rgb},0.28)` },
                { offset: 1, color: `rgba(${rgb},0.02)` },
              ],
            },
          },
        },
      ],
    } as echarts.EChartsOption;
  }, [netSeries, netType, C, dark]);

  const anchorLabel =
    period === 'year' ? `${anchor.getFullYear()}年` : `${anchor.getFullYear()}年${anchor.getMonth() + 1}月`;
  // 周模式显示实际起止日期，翻周时一目了然
  const switcherLabel =
    period === 'week'
      ? `${buckets[0]?.label} - ${buckets[buckets.length - 1]?.label}`
      : anchorLabel;

  return (
    <>
      <div className="seg section">
        {(['week', 'month', 'year', 'all'] as StatsPeriod[]).map((p) => (
          <button
            key={p}
            className={period === p ? 'active' : ''}
            onClick={() => {
              setPeriod(p);
              // 页签语义是「本周/本月/今年」，切换时锚点归位到当前周期，避免沿用上一次翻页残留的锚点
              if (p === 'week') setAnchor(startOfWeek(new Date()));
              else if (p !== 'all') setAnchor(startOfMonth(new Date()));
            }}
          >
            {LABELS[p]}
          </button>
        ))}
      </div>

      {period !== 'all' && (
        <MonthSwitcher
          value={anchor}
          onChange={setAnchor}
          mode={period === 'year' ? 'year' : period === 'week' ? 'week' : 'month'}
          label={switcherLabel}
          disableFuture
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

      <div className="card section">
        <div className="chart-title">
          收支构成 · {books.find((b) => b.id === activeBookId)?.name}
          <span>（{LABELS[period]}）</span>
        </div>
        <Chart option={pieOpt} height={280} />
        <div className="seg mini">
          <button className={pieType === 'expense' ? 'active expense' : ''} onClick={() => setPieType('expense')}>
            支出
          </button>
          <button className={pieType === 'income' ? 'active income' : ''} onClick={() => setPieType('income')}>
            收入
          </button>
        </div>
      </div>

      <div className="card section">
        <div className="chart-title">
          {NET_NAME[netType]}趋势 · {books.find((b) => b.id === activeBookId)?.name}
          <span>
            （{LABELS[period]}
            {period === 'all' ? ' · 按月' : period === 'year' ? ' · 按月' : ' · 按日'}）
          </span>
        </div>
        <Chart option={netOption} height={250} />
        <div className="seg mini">
          {(['net', 'asset', 'liability'] as NetType[]).map((t) => (
            <button key={t} className={netType === t ? 'active' : ''} onClick={() => setNetType(t)}>
              {NET_NAME[t]}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
