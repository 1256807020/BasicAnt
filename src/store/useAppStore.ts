/**
 * useAppStore.ts — 全局应用状态（zustand + 持久化）
 * --------------------------------------------------
 * 管理登录态（token + 含权限码的用户信息）、侧边栏折叠、主题。
 * 页面数据一律走接口，这里只存全局 UI 与身份信息。
 *
 * 主题为单一维度 themeKey（跟随系统 / 蓝白 / 蓝白暗黑 / 金橙 / 金橙暗黑），
 * 同一时刻只激活一个；theme + colorPrimary 由 themeKey 解析派生。
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { UserInfo } from '@/types';
import { clearToken, setToken } from '@/utils/auth';
import { THEME_PRESETS } from '@/theme/presets';

/** 主题键：跟随系统 + 浅色 / 暗黑（默认蓝）/ 金橙（浅色 + 橙色主色），同一时刻只激活一个 */
export type ThemeKey = 'system' | 'light' | 'dark' | 'gold';
/** 实际生效的深浅模式（供 ECharts 等消费） */
export type ResolvedTheme = 'light' | 'dark';

const prefersDark = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches;

/** 将主题键解析为实际的深浅模式与主色 */
export function resolveThemeKey(key: ThemeKey): { theme: ResolvedTheme; colorPrimary: string } {
  const blue = THEME_PRESETS[0].color;
  const gold = THEME_PRESETS[1].color;
  switch (key) {
    case 'system':
      return prefersDark()
        ? { theme: 'dark', colorPrimary: blue }
        : { theme: 'light', colorPrimary: blue };
    case 'dark':
      return { theme: 'dark', colorPrimary: blue };
    case 'gold':
      // 金橙主题 = 浅色 + 橙色主色；按钮 / 表格选中行 / 分页等均由 colorPrimary 级联
      return { theme: 'light', colorPrimary: gold };
    case 'light':
    default:
      return { theme: 'light', colorPrimary: blue };
  }
}

interface AppState {
  token: string;
  /** 含 permissions / roleCodes / dataScope 的完整用户信息 */
  userInfo: UserInfo | null;
  collapsed: boolean;
  /** 当前激活的主题键（单一维度，持久化） */
  themeKey: ThemeKey;
  /** 实际生效主题：themeKey=system 时随系统深浅色变化 */
  theme: ResolvedTheme;
  colorPrimary: string;
  setAuth: (token: string, userInfo: UserInfo) => void;
  logout: () => void;
  toggleCollapsed: () => void;
  setThemeKey: (key: ThemeKey) => void;
  /** 系统深浅色变化时同步（仅在 themeKey 为 system 时生效） */
  syncSystemTheme: () => void;
  /** 是否拥有某个权限码（超级管理员恒为 true） */
  hasPermission: (code?: string) => boolean;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      token: '',
      userInfo: null,
      collapsed: false,
      themeKey: 'light',
      theme: 'light',
      colorPrimary: THEME_PRESETS[0].color,

      setAuth: (token, userInfo) => {
        setToken(token);
        set({ token, userInfo });
      },

      logout: () => {
        clearToken();
        set({ token: '', userInfo: null });
      },

      toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),

      setThemeKey: (themeKey) => set({ themeKey, ...resolveThemeKey(themeKey) }),

      syncSystemTheme: () => {
        if (get().themeKey === 'system') set(resolveThemeKey('system'));
      },

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
      version: 5,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        userInfo: state.userInfo,
        collapsed: state.collapsed,
        themeKey: state.themeKey,
        theme: state.theme,
        colorPrimary: state.colorPrimary,
      }),
      /** 旧版本数据（如没有 permissions 的 userInfo）直接丢弃，强制重新登录 */
      migrate: (persisted) => {
        const old = (persisted ?? {}) as Partial<AppState> & {
          /** v3 及以前的主题偏好（system/light/dark + 独立色板） */
          themeMode?: 'system' | 'light' | 'dark';
        };
        let themeKey: ThemeKey = 'light';
        if (
          old.themeKey === 'system' ||
          old.themeKey === 'light' ||
          old.themeKey === 'dark' ||
          old.themeKey === 'gold'
        ) {
          themeKey = old.themeKey;
        } else if (old.themeMode === 'system') {
          themeKey = 'system';
        } else if (old.theme === 'dark') {
          // 旧暗黑（无论原蓝白 / 金橙）统一归为暗黑主题
          themeKey = 'dark';
        } else if (old.colorPrimary === THEME_PRESETS[1].color) {
          // 浅色 + 金橙 → 金橙主题
          themeKey = 'gold';
        }
        return {
          token: '',
          userInfo: null,
          collapsed: false,
          themeKey,
          ...resolveThemeKey(themeKey),
        };
      },
    },
  ),
);
