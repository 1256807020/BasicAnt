/**
 * notify.ts — 脱离 React 树的全局消息通道
 * --------------------------------------------------
 * axios 拦截器运行在组件之外，无法直接使用 antd 的 App.useApp()，
 * 这里用一个极简的发布订阅，把消息转发给挂载在 App 内的 <GlobalNotifier />。
 */

export type NotifyType = 'success' | 'error' | 'warning' | 'info';

type Listener = (type: NotifyType, content: string) => void;

const listeners = new Set<Listener>();

/** 订阅消息，返回取消订阅函数 */
export function onNotify(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 发送全局消息 */
export function notify(type: NotifyType, content: string): void {
  listeners.forEach((listener) => listener(type, content));
}
