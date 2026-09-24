/**
 * Auth — 按钮级权限包裹组件
 * --------------------------------------------------
 * 用法：
 *   <Auth code="system:user:add"><Button>新增</Button></Auth>
 *   <Auth code="system:user:add" fallback={<Tooltip title="无权限"><Button disabled>新增</Button></Tooltip>}>
 *     <Button>新增</Button>
 *   </Auth>
 */

import type { ReactNode } from 'react';
import { usePermission } from '@/hooks/usePermission';

interface AuthProps {
  /** 权限码；不传则直接渲染 */
  code?: string;
  /** 满足任意一个即可 */
  anyOf?: string[];
  children: ReactNode;
  /** 无权限时的替代内容（默认不渲染） */
  fallback?: ReactNode;
}

export default function Auth({ code, anyOf, children, fallback = null }: AuthProps) {
  const { has, hasAny } = usePermission();

  const allowed = anyOf?.length ? hasAny(anyOf) : has(code);
  return <>{allowed ? children : fallback}</>;
}
