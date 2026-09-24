/**
 * ThemeSwitch — 主题切换（仿 Ant Design 官网）
 * --------------------------------------------------
 * 下拉菜单分两组：
 *   1. 模式：跟随系统 / 浅色主题 / 暗黑主题（真实切换，写入 store.themeMode）
 *   2. 色板：蓝白主题 / 金橙主题（写入 store.colorPrimary）
 * 选中项右侧显示主色小圆点。登录页与 AppHeader 共用。
 */

import { DesktopOutlined, MoonOutlined, SunOutlined } from '@ant-design/icons';
import { Button, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import type { ReactNode } from 'react';
import { useAppStore, type ThemeMode } from '@/store/useAppStore';
import { THEME_PRESETS, resolvePreset } from '@/theme/presets';

const MODE_ITEMS: { key: ThemeMode; icon: ReactNode; label: string }[] = [
  { key: 'system', icon: <DesktopOutlined />, label: '跟随系统' },
  { key: 'light', icon: <SunOutlined />, label: '浅色主题' },
  { key: 'dark', icon: <MoonOutlined />, label: '暗黑主题' },
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
  const themeMode = useAppStore((s) => s.themeMode);
  const resolvedTheme = useAppStore((s) => s.theme);
  const setThemeMode = useAppStore((s) => s.setThemeMode);
  const colorPrimary = useAppStore((s) => s.colorPrimary);
  const setColorPrimary = useAppStore((s) => s.setColorPrimary);
  const activePreset = resolvePreset(colorPrimary).key;

  const items: MenuProps['items'] = [
    ...MODE_ITEMS.map((m) => ({
      key: m.key,
      icon: m.icon,
      label: <ActiveLabel text={m.label} active={themeMode === m.key} color={colorPrimary} />,
    })),
    { type: 'divider' },
    ...THEME_PRESETS.map((p) => ({
      key: p.key,
      icon: <span className="theme-menu-swatch" style={{ background: p.swatch }} />,
      label: (
        <ActiveLabel text={`${p.label}主题`} active={activePreset === p.key} color={colorPrimary} />
      ),
    })),
  ];

  return (
    <Dropdown
      trigger={['click']}
      placement="bottomRight"
      menu={{
        items,
        selectable: false,
        onClick: ({ key }) => {
          if (key === 'system' || key === 'light' || key === 'dark') {
            setThemeMode(key);
          } else {
            const preset = THEME_PRESETS.find((p) => p.key === key);
            if (preset) setColorPrimary(preset.color);
          }
        },
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
