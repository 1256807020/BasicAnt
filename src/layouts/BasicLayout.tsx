/**
 * BasicLayout — 后台主框架
 * --------------------------------------------------
 * 结构：Sider（菜单） + Header（工具栏） + Content（子路由 Outlet） + Footer
 * 未登录时重定向到 /login。
 */

import { Layout } from 'antd';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import AppHeader from './AppHeader';
import AppSider from './AppSider';
import { useAppStore } from '@/store/useAppStore';

const { Content } = Layout;

export default function BasicLayout() {
  const location = useLocation();
  const token = useAppStore((state) => state.token);

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <Layout className="app-layout">
      <AppSider />
      <Layout>
        <AppHeader />
        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
