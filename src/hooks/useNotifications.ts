/**
 * useNotifications — 站内信 WebSocket 消费端
 * --------------------------------------------------
 * 登录后自动连接 /ws/notifications?token=...，断线指数退避重连；
 * 收到推送时弹 toast 并更新红点。需在 <AntdApp> 内调用（用 App.useApp() 弹提示）。
 *
 * 连接地址：
 *  - 开发态：同源 ws://<host>/ws，由 vite proxy 转发到 BasicNest 后端；
 *  - 生产态：若配置 VITE_WS_BASE_URL（如 wss://<sub>.suga.run），则直连该后端，
 *    以兼容纯静态托管（Netlify / HuggingFace Spaces 无 /ws 代理）的场景。
 */

import { useEffect, useRef } from 'react';
import { App } from 'antd';
import { useAppStore } from '@/store/useAppStore';
import { useNotificationStore } from '@/store/notification';
import { getToken } from '@/utils/auth';
import type { NotificationItem } from '@/types';

function wsUrl(): string {
  const base = import.meta.env.VITE_WS_BASE_URL;
  if (base) {
    return `${base.replace(/\/$/, '')}/ws/notifications`;
  }
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${window.location.host}/ws/notifications`;
}

export function useNotifications() {
  const token = useAppStore((s) => s.token);
  const { notification: antdNotification } = App.useApp();
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const notifyRef = useRef(antdNotification);
  // 在 effect 中同步最新实例，避免在渲染期写 ref（符合 react-hooks/refs 规则）
  useEffect(() => {
    notifyRef.current = antdNotification;
  }, [antdNotification]);

  useEffect(() => {
    if (!token) return; // 未登录不连接

    let closedByUs = false;

    const connect = () => {
      const socket = new WebSocket(`${wsUrl()}?token=${encodeURIComponent(getToken())}`);
      wsRef.current = socket;
      useNotificationStore.getState().setConnected(false);

      socket.onopen = () => {
        retryRef.current = 0;
        useNotificationStore.getState().setConnected(true);
      };

      socket.onmessage = (ev) => {
        let msg: { event: string; data: unknown; unread?: number };
        try {
          msg = JSON.parse(ev.data as string);
        } catch {
          return;
        }
        const store = useNotificationStore.getState();
        if (msg.event === 'init') {
          const data = msg.data as { total?: number };
          store.setUnread(data.total ?? 0);
        } else if (msg.event === 'notification') {
          const item = msg.data as NotificationItem;
          store.addNotification(item);
          if (typeof msg.unread === 'number') store.setUnread(msg.unread);
          notifyRef.current.open({
            message: item.title,
            description: item.content ?? '',
            placement: 'topRight',
            duration: 4,
          });
        } else if (msg.event === 'permission_updated') {
          // 权限已变更（角色权限 / 用户-角色关系变化）：原地刷新 userInfo，菜单/按钮/路由立即生效
          void useAppStore.getState().refreshUserInfo();
          notifyRef.current.open({
            message: '权限已更新',
            description: '您的访问权限已实时刷新',
            placement: 'topRight',
            duration: 3,
          });
        }
      };

      socket.onclose = (ev) => {
        useNotificationStore.getState().setConnected(false);
        // 鉴权失败（4001/4003）不再重连，避免死循环
        if (ev.code === 4001 || ev.code === 4003) {
          closedByUs = true;
          return;
        }
        if (closedByUs) return;
        const delay = Math.min(1000 * 2 ** retryRef.current, 10000);
        retryRef.current += 1;
        timerRef.current = window.setTimeout(connect, delay);
      };

      socket.onerror = () => socket.close();
    };

    connect();

    return () => {
      closedByUs = true;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      wsRef.current?.close();
    };
  }, [token]);

  // token 变化（登录/登出）后兜底刷新未读数
  useEffect(() => {
    if (token) void useNotificationStore.getState().fetchUnread();
  }, [token]);
}
