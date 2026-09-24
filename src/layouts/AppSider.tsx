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
import { Layout, Menu, type MenuProps } from 'antd';
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

/**
 * 按权限过滤菜单树：
 * - 叶子节点：自身有权限才保留
 * - 父级分组：自身有权限，或存在任一可见子级 → 保留
 *   这样角色即使只持有一个子级权限（如 system:user），整组也会带着该子级显示，
 *   不会被父级自身的 code（system/content/data）未授权而整体误删。
 */
function filterMenu(nodes: MenuNode[], has: (code?: string) => boolean): MenuNode[] {
  const result: MenuNode[] = [];
  for (const node of nodes) {
    const selfOk = node.code ? has(node.code) : true;
    if (node.children?.length) {
      const children = filterMenu(node.children, has);
      if (selfOk || children.length > 0) result.push({ ...node, children });
    } else if (selfOk) {
      result.push(node);
    }
  }
  return result;
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
  const permissions = useAppStore((state) => state.userInfo?.permissions);

  /**
   * 菜单可见性判定：拥有该菜单权限码，或拥有其任意后代权限码。
   * 角色通常只被授予按钮级 code（如 content:post:list），若严格按菜单级
   * code 精确匹配，会出现「有查看权限却看不到菜单」的反直觉情况。
   * 例：持有 content:post:list → 视为可见 content:post（文章管理）。
   */
  const hasMenu = (code?: string): boolean => {
    if (!code) return true;
    if (!permissions?.length) return false;
    return permissions.some((p) => p === code || p.startsWith(`${code}:`));
  };

  const visibleMenu = filterMenu(menuConfig, hasMenu);

  const [openKeys, setOpenKeys] = useState<string[]>(() => {
    const parent = visibleMenu.find((node) =>
      node.children?.some((child) => pathname.startsWith(child.key)),
    );
    return parent ? [parent.key] : [];
  });

  return (
    <Sider collapsible collapsed={collapsed} trigger={null} width={220} className="app-sider">
      <div className="app-logo">
        <span className="sider-logo-mark">R</span>
        {!collapsed && <span className="sider-logo-name">ReactAdmin</span>}
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
