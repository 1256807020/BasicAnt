/**
 * AppRouter — 由路由配置渲染 <Routes>
 */

import { Suspense } from 'react';
import { Outlet, Route, Routes } from 'react-router-dom';
import { Spin } from 'antd';
import type { RouteConfig } from './routes';
import { routeConfig } from './routes';

function renderRoutes(list: RouteConfig[]) {
  return list.map((item, index) => {
    const key = item.path ?? `${item.index ? 'index' : 'route'}-${index}`;
    const element = item.element ?? (item.component ? <item.component /> : <Outlet />);

    if (item.index) {
      return <Route key={key} index element={element} />;
    }

    return (
      <Route key={key} path={item.path} element={element}>
        {item.children?.length ? renderRoutes(item.children) : undefined}
      </Route>
    );
  });
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
