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
  /** 进入该路由所需权限码（菜单 code）；缺省则不鉴权（仅登录即可）。
   *  守卫用「菜单级」判定：拥有该 code 或其任一子权限码即放行（与侧边栏一致）。 */
  permission?: string | string[];
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

// 在线用户 / 通知广播
const OnlineList = lazy(() => import('@/pages/system/online'));
const NotifyBroadcast = lazy(() => import('@/pages/system/notify'));

// 密码找回（公开页）
const Forgot = lazy(() => import('@/pages/forgot'));
const Reset = lazy(() => import('@/pages/reset'));

// 个人中心
const Profile = lazy(() => import('@/pages/profile'));

export const routeConfig: RouteConfig[] = [
  { path: '/login', component: Login },
  { path: '/forgot', component: Forgot },
  { path: '/reset', component: Reset },
  {
    path: '/',
    component: BasicLayout,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', component: Dashboard, permission: 'dashboard' },
      { path: 'system/user', component: UserList, permission: 'system:user' },
      { path: 'system/role', component: RoleList, permission: 'system:role' },
      { path: 'system/permission', component: PermissionList, permission: 'system:permission' },
      { path: 'system/dept', component: DeptList, permission: 'system:dept' },
      { path: 'system/post', component: PostList, permission: 'system:post' },
      { path: 'system/dict', component: DictList, permission: 'system:dict' },
      { path: 'system/log', component: LogList, permission: 'system:log' },
      { path: 'system/config', component: ConfigList, permission: 'system:config' },
      { path: 'system/online', component: OnlineList, permission: 'system:user' },
      { path: 'system/notify', component: NotifyBroadcast, permission: 'system:notify' },
      { path: 'content/article', component: ArticleList, permission: 'content:post' },
      { path: 'content/notice', component: NoticeList, permission: 'content:notice' },
      { path: 'content/tag', component: TagList, permission: 'content:tag' },
      { path: 'data/table', component: DataTable, permission: 'data:table' },
      { path: 'profile', component: Profile },
      { path: '*', component: NotFound },
    ],
  },
];
