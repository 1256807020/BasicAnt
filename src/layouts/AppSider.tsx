/**
 * AppSider — 侧边栏菜单（按权限码过滤）
 * --------------------------------------------------
 * 菜单可见性由后端返回的 permissions 决定：
 * 超级管理员看全部；其它角色只看被授权的菜单。
 */

import { useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ApartmentOutlined,
  BookOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  IdcardOutlined,
  NotificationOutlined,
  SafetyOutlined,
  SettingOutlined,
  TeamOutlined,
  ToolOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Layout, Menu, Typography, type MenuProps } from 'antd';
import { menuConfig, type IconName, type MenuNode } from '@/config/menu';
import { useAppStore } from '@/store/useAppStore';

const { Sider } = Layout;

const iconMap: Record<IconName, ReactNode> = {
  dashboard: <DashboardOutlined />,
  setting: <SettingOutlined />,
  user: <UserOutlined />,
  role: <TeamOutlined />,
  permission: <SafetyOutlined />,
  dept: <ApartmentOutlined />,
  post: <IdcardOutlined />,
  dict: <BookOutlined />,
  log: <FileSearchOutlined />,
  config: <ToolOutlined />,
  article: <FileTextOutlined />,
  notice: <NotificationOutlined />,
  table: <DatabaseOutlined />,
};

/** 按权限过滤菜单树：无权限的节点剔除，子级全无权限的父级也剔除 */
function filterMenu(nodes: MenuNode[], has: (code?: string) => boolean): MenuNode[] {
  return nodes
    .filter((node) => (node.code ? has(node.code) : true))
    .map((node) => {
      if (!node.children?.length) return node;
      const children = filterMenu(node.children, has);
      return { ...node, children };
    })
    .filter((node) => !node.children || node.children.length > 0);
}

const toMenuItems = (nodes: MenuNode[]): MenuProps['items'] =>
  nodes.map((node) => ({
    key: node.key,
    icon: node.icon ? iconMap[node.icon] : undefined,
    label: node.label,
    children: node.children?.length
      ? node.children.map((child) => ({
          key: child.key,
          icon: child.icon ? iconMap[child.icon] : undefined,
          label: child.label,
        }))
      : undefined,
  }));

export default function AppSider() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const collapsed = useAppStore((state) => state.collapsed);
  const hasPermission = useAppStore((state) => state.hasPermission);

  const visibleMenu = filterMenu(menuConfig, hasPermission);

  const [openKeys, setOpenKeys] = useState<string[]>(() => {
    const parent = visibleMenu.find((node) =>
      node.children?.some((child) => pathname.startsWith(child.key)),
    );
    return parent ? [parent.key] : [];
  });

  return (
    <Sider collapsible collapsed={collapsed} trigger={null} width={220} className="app-sider">
      <div className="app-logo">
        <Typography.Text strong style={{ color: '#fff', fontSize: collapsed ? 14 : 18 }}>
          {collapsed ? 'RA' : 'ReactAdmin'}
        </Typography.Text>
      </div>
      <Menu
        theme="dark"
        mode="inline"
        items={toMenuItems(visibleMenu)}
        selectedKeys={[pathname]}
        openKeys={openKeys}
        onOpenChange={(keys) => setOpenKeys(keys)}
        onClick={({ key }) => navigate(key)}
      />
    </Sider>
  );
}
