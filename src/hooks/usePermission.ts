/**
 * usePermission — 按钮级权限 Hook
 * --------------------------------------------------
 * 用法：
 *   const { has, isAdmin } = usePermission()
 *   {has('system:user:add') && <Button>新增</Button>}
 */

import { useAppStore } from '@/store/useAppStore';

export function usePermission() {
  const userInfo = useAppStore((state) => state.userInfo);
  const hasPermission = useAppStore((state) => state.hasPermission);

  return {
    /** 是否拥有某权限码 */
    has: hasPermission,
    /** 是否拥有其中任意一个 */
    hasAny: (codes: string[]) => codes.some((code) => hasPermission(code)),
    /** 是否同时拥有全部 */
    hasAll: (codes: string[]) => codes.every((code) => hasPermission(code)),
    isAdmin: userInfo?.isAdmin ?? false,
    permissions: userInfo?.permissions ?? [],
    userInfo,
  };
}
