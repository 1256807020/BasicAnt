/**
 * GlobalNotifier — 把 utils/notify 的消息桥接到 antd 的 message
 * 让 axios 拦截器这类「React 之外」的代码也能弹出统一风格的提示。
 */

import { useEffect } from 'react';
import { App } from 'antd';
import { onNotify } from '@/utils/notify';

export default function GlobalNotifier() {
  const { message } = App.useApp();

  useEffect(
    () =>
      onNotify((type, content) => {
        message[type](content);
      }),
    [message],
  );

  return null;
}
