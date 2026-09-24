/**
 * App.tsx — 应用根组件
 * --------------------------------------------------
 * 统一装配：antd 国际化/主题 → 消息上下文 → 路由
 */

import { App as AntdApp, ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { BrowserRouter } from 'react-router-dom';
import GlobalNotifier from '@/components/GlobalNotifier';
import AppRouter from '@/router/AppRouter';
import { useAppStore } from '@/store/useAppStore';

dayjs.locale('zh-cn');

export default function App() {
  const themeMode = useAppStore((state) => state.theme);
  const colorPrimary = useAppStore((state) => state.colorPrimary);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: themeMode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
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
