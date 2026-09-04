import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

/** 与全局 body 字体栈保持一致；ECharts 默认只写 sans-serif，
 *  部分 WebView 会把中文回退成宋体，导致图表字体与页面不一致 */
export const CHART_FONT =
  "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Segoe UI', 'Microsoft YaHei', 'Helvetica Neue', sans-serif";

interface ChartProps {
  option: echarts.EChartsOption;
  height?: number;
}

/** 轻量 ECharts 封装：自动 resize、卸载时销毁、option 变更全量替换 */
export function Chart({ option, height = 260 }: ChartProps) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!elRef.current) return;
    const chart = echarts.init(elRef.current);
    chartRef.current = chart;
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(elRef.current);
    return () => {
      ro.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(
      { ...option, textStyle: { fontFamily: CHART_FONT } },
      true,
    );
  }, [option]);

  return <div ref={elRef} style={{ width: '100%', height }} />;
}

export const CHART_COLORS = [
  '#5b7cfa', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#ec4899', '#84cc16',
];
