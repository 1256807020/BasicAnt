/**
 * ThemeSwitch — 主题切换（单一维度，同一时刻只激活一个）
 * --------------------------------------------------
 * 菜单项：
 *   跟随系统 / 蓝白主题（浅色）/ 蓝白暗黑主题 / 金橙主题（浅色）/ 金橙暗黑主题
 * 选中项右侧显示主色小圆点。登录页与 AppHeader 共用。
 */

import { DesktopOutlined, MoonOutlined, SunOutlined } from '@ant-design/icons';
import { Button, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import type { ReactNode } from 'react';
import { useAppStore, type ThemeKey } from '@/store/useAppStore';
import { THEME_PRESETS } from '@/theme/presets';

const OPTIONS: { key: ThemeKey; icon: ReactNode; label: string; swatch?: string }[] = [
  { key: 'system', icon: <DesktopOutlined />, label: '跟随系统' },
  {
    key: 'light',
    icon: <SunOutlined />,
    label: '浅色主题',
    swatch: THEME_PRESETS[0].swatch,
  },
  {
    key: 'dark',
    icon: <MoonOutlined />,
    label: '暗黑主题',
    swatch: THEME_PRESETS[0].swatch,
  },
  {
    key: 'gold',
    icon: <SunOutlined />,
    label: '金橙主题',
    swatch: THEME_PRESETS[1].swatch,
  },
];

/** 菜单项文案 + 右侧选中小圆点（仿官网样式） */
function ActiveLabel({ text, active, color }: { text: string; active: boolean; color: string }) {
  return (
    <span className="theme-menu-item">
      <span>{text}</span>
      {active && <span className="theme-menu-dot" style={{ background: color }} />}
    </span>
  );
}

export default function ThemeSwitch() {
  const themeKey = useAppStore((s) => s.themeKey);
  const resolvedTheme = useAppStore((s) => s.theme);
  const colorPrimary = useAppStore((s) => s.colorPrimary);
  const setThemeKey = useAppStore((s) => s.setThemeKey);

  const items: MenuProps['items'] = OPTIONS.map((o) => ({
    key: o.key,
    icon: o.swatch ? (
      <span className="theme-menu-swatch" style={{ background: o.swatch }} />
    ) : (
      o.icon
    ),
    label: <ActiveLabel text={o.label} active={themeKey === o.key} color={colorPrimary} />,
  }));

  return (
    <Dropdown
      trigger={['click']}
      placement="bottomRight"
      menu={{
        items,
        selectable: false,
        onClick: ({ key }) => setThemeKey(key as ThemeKey),
      }}
    >
      <Button
        type="text"
        aria-label="toggle-theme"
        icon={resolvedTheme === 'dark' ? <SunOutlined /> : <MoonOutlined />}
      />
    </Dropdown>
  );
}
