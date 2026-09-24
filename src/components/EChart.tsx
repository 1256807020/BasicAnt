/**
 * EChart — echarts 的轻量 React 封装
 * --------------------------------------------------
 * 只负责：初始化实例、响应式 resize、option 更新、卸载销毁。
 */

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface EChartProps {
  option: echarts.EChartsOption;
  height?: number;
  /** 'dark' | 'light'，变化时重建实例以应用主题 */
  theme?: string;
}

export default function EChart({ option, height = 320, theme = 'light' }: EChartProps) {
  const domRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof echarts.init> | null>(null);

  useEffect(() => {
    const dom = domRef.current;
    if (!dom) return;

    const chart = echarts.init(dom, theme === 'dark' ? 'dark' : undefined);
    chartRef.current = chart;

    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(dom);

    return () => {
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, [theme]);

  useEffect(() => {
    chartRef.current?.setOption(option, true);
  }, [option]);

  return <div ref={domRef} style={{ width: '100%', height }} />;
}
