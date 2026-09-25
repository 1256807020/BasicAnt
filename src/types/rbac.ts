/**
 * rbac.ts — RBAC 权限模型类型定义
 * --------------------------------------------------
 * 与 BasicNest 的 /api/rbac/* 接口一一对应。
 * 后端已完成「内存 JOIN」，所以前端拿到的对象里
 * deptName / postName / roleNames / permissionIds 都是现成的。
 */

/** 菜单类型 */
export type MenuType = 'menu' | 'button' | 'api';

/** 数据范围：全部 / 本部门及以下 / 本部门 / 仅本人 */
export type DataScope = 'all' | 'deptAndBelow' | 'dept' | 'self';

/** 权限（菜单 / 按钮 / 接口） */
export interface PermissionItem {
  id: string | number;
  name: string;
  code: string;
  type: MenuType;
  parentId?: string | number | null;
  path?: string;
  icon?: string;
  sort?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  children?: PermissionItem[];
}

/** 角色（列表接口已 JOIN 出权限与用户数） */
export interface RoleItem {
  id: string | number;
  name: string;
  code: string;
  description?: string;
  dataScope?: DataScope;
  status?: string;
  sort?: number;
  createdAt?: string;
  updatedAt?: string;
  /** JOIN：该角色已分配的权限 id */
  permissionIds?: string[];
  permissionCount?: number;
  userCount?: number;
}

/** 用户（列表接口已 JOIN 出部门 / 岗位 / 角色） */
export interface UserItem {
  id: string | number;
  username: string;
  nickname?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  deptId?: string | number | null;
  postId?: string | number | null;
  roleIds?: string[];
  status?: string;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
  /** JOIN 字段 */
  deptName?: string;
  postName?: string;
  roleNames?: string[];
  roleCodes?: string[];
}

/** 部门（树接口已 JOIN 出负责人与人数） */
export interface DeptItem {
  id: string | number;
  name: string;
  parentId?: string | number | null;
  leader?: string | number | null;
  phone?: string;
  email?: string;
  sort?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  /** JOIN 字段 */
  leaderName?: string;
  userCount?: number;
  totalCount?: number;
  children?: DeptItem[];
}

/** 岗位 */
export interface PostItem {
  id: string | number;
  name: string;
  code: string;
  sort?: number;
  status?: string;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** 字典分类 */
export interface DictItem {
  id: string | number;
  name: string;
  code: string;
  status?: string;
  sort?: number;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
  itemCount?: number;
  items?: DictDataItem[];
}

/** 字典项 */
export interface DictDataItem {
  id: string | number;
  dictId: string | number;
  label: string;
  value: string;
  tagType?: string;
  sort?: number;
  status?: string;
  remark?: string;
}

/** 审计日志 */
export interface LogItem {
  id: string | number;
  userId?: string | number | null;
  username?: string;
  module?: string;
  action?: string;
  method?: string;
  path?: string;
  ip?: string;
  statusCode?: number;
  cost?: number;
  detail?: string;
  createdAt?: string;
}

/** 日志概览 */
export interface LogOverview {
  total: number;
  today: number;
  failed: number;
  byModule: Array<{ name: string; value: number }>;
  trend: Array<{ day: string; count: number }>;
}

/** 登录返回 */
export interface LoginResult {
  token: string;
  userInfo: UserInfo;
}

/** 当前登录用户完整信息 */
export interface UserInfo {
  id: string | number;
  username: string;
  nickname: string;
  avatar: string;
  email: string;
  phone: string;
  deptId: string | number | null;
  deptName: string;
  roleIds: string[];
  roleNames: string[];
  roleCodes: string[];
  dataScope: DataScope;
  /** 权限码列表，按钮级鉴权与菜单过滤都基于它 */
  permissions: string[];
  isAdmin: boolean;
}

export interface LoginParams {
  username: string;
  password: string;
}

export interface RegisterParams {
  username: string;
  password: string;
  confirmPassword?: string;
  nickname?: string;
  email?: string;
  phone?: string;
}
