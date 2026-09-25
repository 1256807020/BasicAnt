/**
 * NotificationInitializer — 在 <AntdApp> 内挂载 WS 消费端，自身不渲染任何 UI。
 */

import { useNotifications } from '@/hooks/useNotifications';

export default function NotificationInitializer() {
  useNotifications();
  return null;
}
