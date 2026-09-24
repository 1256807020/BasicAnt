/**
 * useAppStore.ts — 全局应用状态（zustand + 持久化）
 * --------------------------------------------------
 * 管理登录态（token + 含权限码的用户信息）、侧边栏折叠、主题。
 * 页面数据一律走接口，这里只存全局 UI 与身份信息。
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { UserInfo } from '@/types';
import { clearToken, setToken } from '@/utils/auth';

export type ThemeMode = 'light' | 'dark';

interface AppState {
  token: string;
  /** 含 permissions / roleCodes / dataScope 的完整用户信息 */
  userInfo: UserInfo | null;
  collapsed: boolean;
  theme: ThemeMode;
  colorPrimary: string;
  setAuth: (token: string, userInfo: UserInfo) => void;
  logout: () => void;
  toggleCollapsed: () => void;
  setTheme: (theme: ThemeMode) => void;
  setColorPrimary: (color: string) => void;
  /** 是否拥有某个权限码（超级管理员恒为 true） */
  hasPermission: (code?: string) => boolean;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      token: '',
      userInfo: null,
      collapsed: false,
      theme: 'light',
      colorPrimary: '#1677ff',

      setAuth: (token, userInfo) => {
        setToken(token);
        set({ token, userInfo });
      },

      logout: () => {
        clearToken();
        set({ token: '', userInfo: null });
      },

      toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),

      setTheme: (theme) => set({ theme }),

      setColorPrimary: (colorPrimary) => set({ colorPrimary }),

      hasPermission: (code) => {
        if (!code) return true;
        const { userInfo } = get();
        if (!userInfo) return false;
        if (userInfo.isAdmin) return true;
        // 旧版本持久化的 userInfo 可能没有 permissions 字段，这里做防御
        return Array.isArray(userInfo.permissions) && userInfo.permissions.includes(code);
      },
    }),
    {
      name: 'reactadm_app',
      // 结构变更时递增：旧数据会被 migrate 重置，避免拿着半截 userInfo 渲染
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        userInfo: state.userInfo,
        collapsed: state.collapsed,
        theme: state.theme,
        colorPrimary: state.colorPrimary,
      }),
      /** 旧版本数据（如没有 permissions 的 userInfo）直接丢弃，强制重新登录 */
      migrate: () => ({
        token: '',
        userInfo: null,
        collapsed: false,
        theme: 'light' as ThemeMode,
        colorPrimary: '#1677ff',
      }),
    },
  ),
);
