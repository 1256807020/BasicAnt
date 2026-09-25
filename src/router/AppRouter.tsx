/**
 * AppRouter — 由路由配置渲染 <Routes>
 */

import { Suspense, type ReactNode } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { Spin } from 'antd';
import type { RouteConfig } from './routes';
import { routeConfig } from './routes';
import { useAppStore } from '@/store/useAppStore';
import Forbidden from '@/pages/error/Forbidden';

function renderRoutes(list: RouteConfig[]) {
  return list.map((item, index) => {
    const key = item.path ?? `${item.index ? 'index' : 'route'}-${index}`;
    const element = item.element ?? (item.component ? <item.component /> : <Outlet />);
    // /login 为公开路由，不挂守卫；其余路由统一走 RequirePerm（未登录跳登录、无权限渲染 403）
    const guarded =
      item.path === '/login' ? (
        element
      ) : (
        <RequirePerm permission={item.permission}>{element}</RequirePerm>
      );

    if (item.index) {
      return <Route key={key} index element={guarded} />;
    }

    return (
      <Route key={key} path={item.path} element={guarded}>
        {item.children?.length ? renderRoutes(item.children) : undefined}
      </Route>
    );
  });
}

/**
 * 路由级权限守卫（§7.5-3）：
 * - 未登录 → 跳转 /login
 * - 已登录但无该路由权限码 → 渲染 403（后端 RequirePermGuard 仍兜底接口 403）
 * - 无 permission 的路由仅做登录态校验
 */
function RequirePerm({
  permission,
  children,
}: {
  permission?: string | string[];
  children: ReactNode;
}) {
  const token = useAppStore((s) => s.token);
  const hasMenuPermission = useAppStore((s) => s.hasMenuPermission);
  if (!token) return <Navigate to="/login" replace />;
  const allowed =
    !permission ||
    (Array.isArray(permission)
      ? permission.some((p) => hasMenuPermission(p))
      : hasMenuPermission(permission));
  if (!allowed) return <Forbidden />;
  return <>{children}</>;
}

const AppRouter = () => (
  <Suspense
    fallback={
      <div className="flex-center" style={{ height: '100vh' }}>
        <Spin size="large" description="页面加载中" />
      </div>
    }
  >
    <Routes>{renderRoutes(routeConfig)}</Routes>
  </Suspense>
);

export default AppRouter;
