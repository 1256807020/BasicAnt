/**
 * 主题预设 — 蓝白 / 金橙
 * --------------------------------------------------
 * 登录页与全局可切换的主色方案。colorPrimary 写入 zustand，
 * 由 App.tsx 的 ConfigProvider 应用到 antd 组件；
 * 登录页的渐变背景与光斑通过 CSS 变量 --brand 消费该色。
 */

export interface ThemePreset {
  key: 'blue' | 'gold';
  label: string;
  /** antd colorPrimary */
  color: string;
  /** 色板预览（渐变） */
  swatch: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    key: 'blue',
    label: '蓝白',
    color: '#1677ff',
    swatch: 'linear-gradient(135deg, #0958d9, #1677ff 55%, #69b1ff)',
  },
  {
    key: 'gold',
    label: '金橙',
    color: '#f97316',
    swatch: 'linear-gradient(135deg, #b45309, #f97316 55%, #fbbf24)',
  },
];
