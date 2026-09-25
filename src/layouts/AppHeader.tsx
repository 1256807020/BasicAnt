/**
 * AppHeader — 顶部栏：折叠按钮 / 面包屑 / 语言与主题切换 / 用户操作
 */

import {
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Breadcrumb, Button, Dropdown, Layout, Space, Typography } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { titleMap } from '@/config/menu';
import { useAppStore } from '@/store/useAppStore';
import LangSwitch from '@/components/LangSwitch';
import ThemeSwitch from '@/components/ThemeSwitch';
import FullscreenButton from '@/components/FullscreenButton';
import NotificationBell from '@/components/NotificationBell';

const { Header } = Layout;

export default function AppHeader() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const collapsed = useAppStore((state) => state.collapsed);
  const toggleCollapsed = useAppStore((state) => state.toggleCollapsed);
  const userInfo = useAppStore((state) => state.userInfo);
  const logout = useAppStore((state) => state.logout);

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
        <LangSwitch />
        <ThemeSwitch />
        <FullscreenButton />
        <NotificationBell />
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
