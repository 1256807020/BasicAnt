/**
 * routes.tsx — 路由表配置
 * --------------------------------------------------
 * 使用 React.lazy 做路由级代码分割，首屏只加载必要 chunk。
 * 页面级权限由后端返回的 permissions 控制（菜单过滤 + 按钮级 Auth）。
 */

import { lazy, type ComponentType, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

export interface RouteConfig {
  path?: string;
  component?: ComponentType;
  /** 直接使用元素（重定向等场景） */
  element?: ReactNode;
  /** index 路由：父路径默认展示 */
  index?: boolean;
  children?: RouteConfig[];
}

const BasicLayout = lazy(() => import('@/layouts/BasicLayout'));
const Login = lazy(() => import('@/pages/login'));
const Dashboard = lazy(() => import('@/pages/dashboard'));
const NotFound = lazy(() => import('@/pages/error/NotFound'));

// 系统管理
const UserList = lazy(() => import('@/pages/system/user'));
const RoleList = lazy(() => import('@/pages/system/role'));
const PermissionList = lazy(() => import('@/pages/system/permission'));
const DeptList = lazy(() => import('@/pages/system/dept'));
const PostList = lazy(() => import('@/pages/system/post'));
const DictList = lazy(() => import('@/pages/system/dict'));
const LogList = lazy(() => import('@/pages/system/log'));
const ConfigList = lazy(() => import('@/pages/system/config'));

// 内容管理
const ArticleList = lazy(() => import('@/pages/content/article'));
const NoticeList = lazy(() => import('@/pages/content/notice'));
const TagList = lazy(() => import('@/pages/content/tag'));

// 数据管理
const DataTable = lazy(() => import('@/pages/data/table'));

// 个人中心
const Profile = lazy(() => import('@/pages/profile'));

export const routeConfig: RouteConfig[] = [
  { path: '/login', component: Login },
  {
    path: '/',
    component: BasicLayout,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', component: Dashboard },
      { path: 'system/user', component: UserList },
      { path: 'system/role', component: RoleList },
      { path: 'system/permission', component: PermissionList },
      { path: 'system/dept', component: DeptList },
      { path: 'system/post', component: PostList },
      { path: 'system/dict', component: DictList },
      { path: 'system/log', component: LogList },
      { path: 'system/config', component: ConfigList },
      { path: 'content/article', component: ArticleList },
      { path: 'content/notice', component: NoticeList },
      { path: 'content/tag', component: TagList },
      { path: 'data/table', component: DataTable },
      { path: 'profile', component: Profile },
      { path: '*', component: NotFound },
    ],
  },
];
