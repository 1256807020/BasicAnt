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

/** 主题偏好：跟随系统 / 浅色 / 暗黑 */
export type ThemeMode = 'system' | 'light' | 'dark';
/** 实际生效的主题（themeMode 为 system 时由系统偏好解析得出） */
export type ResolvedTheme = 'light' | 'dark';

const prefersDark = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches;

const resolveTheme = (mode: ThemeMode): ResolvedTheme =>
  mode === 'system' ? (prefersDark() ? 'dark' : 'light') : mode;

interface AppState {
  token: string;
  /** 含 permissions / roleCodes / dataScope 的完整用户信息 */
  userInfo: UserInfo | null;
  collapsed: boolean;
  /** 主题偏好（system / light / dark），持久化 */
  themeMode: ThemeMode;
  /** 实际生效主题：themeMode=system 时随系统深浅色变化 */
  theme: ResolvedTheme;
  colorPrimary: string;
  setAuth: (token: string, userInfo: UserInfo) => void;
  logout: () => void;
  toggleCollapsed: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  /** 系统深浅色变化时同步（仅在 themeMode 为 system 时生效） */
  syncSystemTheme: () => void;
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
      themeMode: 'light',
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

      setThemeMode: (themeMode) => set({ themeMode, theme: resolveTheme(themeMode) }),

      syncSystemTheme: () => {
        if (get().themeMode === 'system') set({ theme: resolveTheme('system') });
      },

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
      version: 3,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        userInfo: state.userInfo,
        collapsed: state.collapsed,
        themeMode: state.themeMode,
        theme: state.theme,
        colorPrimary: state.colorPrimary,
      }),
      /** 旧版本数据（如没有 permissions 的 userInfo）直接丢弃，强制重新登录 */
      migrate: (persisted) => {
        const old = (persisted ?? {}) as Partial<AppState>;
        return {
          token: '',
          userInfo: null,
          collapsed: false,
          // v2 及以前只有 theme 字段，迁移为对应的固定偏好
          themeMode: old.themeMode ?? (old.theme === 'dark' ? 'dark' : 'light'),
          theme: old.theme === 'dark' ? 'dark' : 'light',
          colorPrimary: '#1677ff',
        };
      },
    },
  ),
);
