/**
 * notification.ts — 站内信全局状态（zustand）
 * --------------------------------------------------
 * 数据来自两路：REST 拉取历史 / WS 实时推送。
 * WS 仅负责「更新 unread + 预存最新一条到 list」，REST 负责分页历史。
 */

import { create } from 'zustand';
import { http } from '@/utils/request';
import type { NotificationItem, PageResult } from '@/types';

const PAGE_SIZE = 10;

interface NotificationState {
  unread: number;
  list: NotificationItem[];
  connected: boolean;
  drawerOpen: boolean;
  loading: boolean;
  hasMore: boolean;
  page: number;

  // WS 侧调用（非异步）
  setUnread: (n: number) => void;
  setConnected: (v: boolean) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  addNotification: (item: NotificationItem) => void;

  // REST 侧调用
  fetchUnread: () => Promise<void>;
  fetchList: (reset?: boolean) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  unread: 0,
  list: [],
  connected: false,
  drawerOpen: false,
  loading: false,
  hasMore: true,
  page: 1,

  setUnread: (n) => set({ unread: n }),
  setConnected: (v) => set({ connected: v }),
  openDrawer: () => {
    set({ drawerOpen: true });
    // 打开时若尚无数据则拉首页；已有数据则仅刷新未读
    if (get().list.length === 0) void get().fetchList(true);
    else void get().fetchUnread();
  },
  closeDrawer: () => set({ drawerOpen: false }),
  addNotification: (item) =>
    set((s) => ({
      unread: s.unread + (item.read ? 0 : 1),
      list: [item, ...s.list].slice(0, 50),
    })),

  fetchUnread: async () => {
    try {
      const res = await http<{ total: number }>({ url: '/notifications/unread-count' });
      set({ unread: res.data.total });
    } catch {
      /* 未登录或接口异常：静默 */
    }
  },

  fetchList: async (reset = false) => {
    if (get().loading) return;
    const page = reset ? 1 : get().page;
    set({ loading: true });
    try {
      const res = await http<PageResult<NotificationItem>>({
        url: '/notifications',
        params: { page, pageSize: PAGE_SIZE },
      });
      const rows = res.data.list ?? [];
      set((s) => ({
        list: reset ? rows : [...s.list, ...rows],
        page: page + 1,
        hasMore: rows.length === PAGE_SIZE,
      }));
    } catch {
      /* 静默 */
    } finally {
      set({ loading: false });
    }
  },

  markRead: async (id) => {
    try {
      await http({ url: `/notifications/${id}/read`, method: 'PATCH' });
      set((s) => ({
        list: s.list.map((n) =>
          n.id === id ? { ...n, read: true, readAt: n.readAt ?? new Date().toISOString() } : n,
        ),
        unread: Math.max(0, s.unread - 1),
      }));
    } catch {
      /* 静默 */
    }
  },

  markAllRead: async () => {
    try {
      await http({ url: '/notifications/read-all', method: 'POST' });
      set((s) => ({
        list: s.list.map((n) => ({ ...n, read: true, readAt: n.readAt ?? new Date().toISOString() })),
        unread: 0,
      }));
    } catch {
      /* 静默 */
    }
  },

  remove: async (id) => {
    try {
      await http({ url: `/notifications/${id}`, method: 'DELETE' });
      set((s) => {
        const item = s.list.find((n) => n.id === id);
        return {
          list: s.list.filter((n) => n.id !== id),
          unread: Math.max(0, s.unread - (item && !item.read ? 1 : 0)),
        };
      });
    } catch {
      /* 静默 */
    }
  },
}));
