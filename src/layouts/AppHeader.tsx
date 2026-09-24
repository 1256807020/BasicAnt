/**
 * AppHeader — 顶部栏：折叠按钮 / 面包屑 / 主题与用户操作
 */

import {
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  SunOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Breadcrumb, Button, Dropdown, Layout, Space, Typography } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { titleMap } from '@/config/menu';
import { useAppStore } from '@/store/useAppStore';
import { THEME_PRESETS, resolvePreset } from '@/theme/presets';

const { Header } = Layout;

export default function AppHeader() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const collapsed = useAppStore((state) => state.collapsed);
  const toggleCollapsed = useAppStore((state) => state.toggleCollapsed);
  const userInfo = useAppStore((state) => state.userInfo);
  const logout = useAppStore((state) => state.logout);
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const colorPrimary = useAppStore((state) => state.colorPrimary);
  const setColorPrimary = useAppStore((state) => state.setColorPrimary);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <Header className="app-header">
      <Space size="middle">
        <Button
          type="text"
          aria-label="toggle-sidebar"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={toggleCollapsed}
        />
        <Breadcrumb items={(titleMap[pathname] ?? ['首页']).map((title) => ({ title }))} />
      </Space>

      <Space size="middle">
        <span className="header-theme">
          {THEME_PRESETS.map((p) => {
            const active = resolvePreset(colorPrimary).key === p.key;
            return (
              <button
                key={p.key}
                type="button"
                className={`header-theme-dot${active ? ' active' : ''}`}
                style={{
                  background: p.swatch,
                  boxShadow: active ? `0 0 0 2px ${colorPrimary}` : undefined,
                }}
                title={p.label}
                aria-label={p.label}
                onClick={() => setColorPrimary(p.color)}
              />
            );
          })}
        </span>
        <Button
          type="text"
          aria-label="toggle-theme"
          icon={theme === 'dark' ? <SunOutlined /> : <MoonOutlined />}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        />
        <Dropdown
          menu={{
            items: [
              { key: 'profile', icon: <UserOutlined />, label: '个人中心' },
              { type: 'divider' },
              { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
            ],
            onClick: ({ key }) => {
              if (key === 'logout') handleLogout();
              if (key === 'profile') navigate('/profile');
            },
          }}
        >
          <Space style={{ cursor: 'pointer' }}>
            <Avatar size="small" icon={<UserOutlined />} />
            <Typography.Text>{userInfo?.nickname ?? '未登录'}</Typography.Text>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  );
}
