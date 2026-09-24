/**
 * App.tsx — 应用根组件
 * --------------------------------------------------
 * 统一装配：antd 国际化/主题 → 消息上下文 → 路由
 */

import { App as AntdApp, ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import GlobalNotifier from '@/components/GlobalNotifier';
import AppRouter from '@/router/AppRouter';
import { useAppStore } from '@/store/useAppStore';

dayjs.locale('zh-cn');

export default function App() {
  const themeKey = useAppStore((state) => state.themeKey);
  const resolvedTheme = useAppStore((state) => state.theme);
  const colorPrimary = useAppStore((state) => state.colorPrimary);

  // 主题为「跟随系统」时，监听系统深浅色变化并同步
  useEffect(() => {
    if (themeKey !== 'system') return;
    useAppStore.getState().syncSystemTheme();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => useAppStore.getState().syncSystemTheme();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [themeKey]);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: resolvedTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: { colorPrimary, borderRadius: 6 },
      }}
    >
      <AntdApp>
        <GlobalNotifier />
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  );
}
