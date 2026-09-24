/**
 * BasicLayout — 后台主框架
 * --------------------------------------------------
 * 结构：Sider（菜单） + Header（工具栏） + Content（子路由 Outlet） + Footer
 * 未登录时重定向到 /login。
 */

import { useEffect } from 'react';
import { Layout } from 'antd';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import AppHeader from './AppHeader';
import AppSider from './AppSider';
import { useAppStore } from '@/store/useAppStore';

const { Content } = Layout;

export default function BasicLayout() {
  const location = useLocation();
  const token = useAppStore((state) => state.token);

  /**
   * 登录后全局平滑滚动（Lenis）。
   * 只挂在后台框架上，登录页自带独立实例；尊重系统「减弱动效」偏好。
   */
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time * 1000);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

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
