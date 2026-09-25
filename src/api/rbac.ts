/**
 * rbac.ts — RBAC 权限接口
 * --------------------------------------------------
 * 对接 BasicNest（Nest.js 12 + Prisma 7）企业级 RBAC 后端。
 * 所有关联（用户-部门-角色-权限）由后端在 Prisma 层 JOIN 聚合后返回，
 * 前端只消费聚合结果，不需要自己拼装。
 */

import type {
  DeptItem,
  DictDataItem,
  DictItem,
  LogItem,
  LogOverview,
  LoginParams,
  LoginResult,
  PermissionItem,
  RegisterParams,
  RoleItem,
  UserInfo,
  UserItem,
} from '@/types';
import type { PageResult } from '@/types';
import { http } from '@/utils/request';

const RBAC = '/rbac';

/* ---------------------------------- 认证 ---------------------------------- */

export function login(params: LoginParams): Promise<LoginResult> {
  const res = http<LoginResult>({ url: `${RBAC}/auth/login`, method: 'POST', data: params });
  return unwrap(res);
}

export function register(
  params: RegisterParams,
): Promise<{ id: string | number; username: string }> {
  return unwrap(
    http<{ id: string | number; username: string }>({
      url: `${RBAC}/auth/register`,
      method: 'POST',
      data: params,
    }),
  );
}

export function fetchMe(userId: string | number): Promise<LoginResult> {
  return unwrap(http<LoginResult>({ url: `${RBAC}/auth/me`, method: 'GET', params: { userId } }));
}

export function updatePassword(params: {
  userId: string | number;
  oldPassword?: string;
  newPassword: string;
}): Promise<null> {
  return unwrap(http<null>({ url: `${RBAC}/auth/password`, method: 'POST', data: params }));
}

/** 更新个人资料（走通用 CRUD 的 PATCH /:resource/:id） */
export function updateProfile(
  id: string | number,
  data: Partial<Pick<UserItem, 'nickname' | 'email' | 'phone' | 'avatar'>>,
): Promise<UserItem> {
  return unwrap(http<UserItem>({ url: `/user/${id}`, method: 'PATCH', data }));
}

/** 更新用户任意字段（管理员用，可改部门 / 岗位 / 状态） */
export function updateUser(id: string | number, data: Partial<UserItem>): Promise<UserItem> {
  return unwrap(http<UserItem>({ url: `/user/${id}`, method: 'PATCH', data }));
}

/** 删除用户 */
export function deleteUser(id: string | number): Promise<null> {
  return unwrap(http<null>({ url: `/user/${id}`, method: 'DELETE' }));
}

/**
 * 新增用户
 * 密码必须经后端哈希，所以先走 /auth/register，
 * 再补写部门 / 岗位 / 角色（register 只给默认角色）
 */
export async function createUser(payload: {
  username: string;
  password: string;
  nickname?: string;
  email?: string;
  phone?: string;
  deptId?: string | number | null;
  postId?: string | number | null;
  roleIds?: Array<string | number>;
}): Promise<UserItem> {
  const created = await register({
    username: payload.username,
    password: payload.password,
    nickname: payload.nickname,
    email: payload.email,
    phone: payload.phone,
  });

  const patch: Partial<UserItem> = {};
  if (payload.deptId !== undefined) patch.deptId = payload.deptId;
  if (payload.postId !== undefined) patch.postId = payload.postId;
  if (Object.keys(patch).length) await updateUser(created.id, patch);
  if (payload.roleIds?.length) await assignUserRoles(created.id, payload.roleIds);

  return (
    (await fetchUsers({ keyword: payload.username, pageSize: 1 })).list[0] ?? {
      id: created.id,
      username: created.username,
    }
  );
}

export function logout(userId?: string | number, username?: string): Promise<null> {
  return unwrap(
    http<null>({ url: `${RBAC}/auth/logout`, method: 'POST', data: { userId, username } }),
  );
}

/* ---------------------------------- 用户 ---------------------------------- */

export interface UserQuery {
  keyword?: string;
  deptId?: string | number;
  roleId?: string | number;
  status?: string;
  page?: number;
  pageSize?: number;
  [key: string]: unknown;
}

export async function fetchUsers(params: UserQuery = {}): Promise<PageResult<UserItem>> {
  const res = await http<UserItem[]>({ url: `${RBAC}/users`, method: 'GET', params });
  return toPage<UserItem>(res);
}

export function assignUserRoles(
  userId: string | number,
  roleIds: Array<string | number>,
): Promise<null> {
  return unwrap(
    http<null>({
      url: `${RBAC}/users/roles`,
      method: 'POST',
      data: { userId, roleIds, operator: currentUsername() },
    }),
  );
}

export function fetchUserRoles(userId: string | number): Promise<string[]> {
  return unwrap(http<string[]>({ url: `${RBAC}/users/roles`, method: 'GET', params: { userId } }));
}

export function resetUserPassword(userId: string | number, password = '123456'): Promise<null> {
  return unwrap(
    http<null>({
      url: `${RBAC}/users/reset-password`,
      method: 'POST',
      data: { userId, password, operator: currentUsername() },
    }),
  );
}

export function updateUserStatus(userId: string | number, status: string): Promise<null> {
  return unwrap(
    http<null>({
      url: `${RBAC}/users/status`,
      method: 'POST',
      data: { userId, status, operator: currentUsername() },
    }),
  );
}

/* ---------------------------------- 角色 ---------------------------------- */

export async function fetchRoles(
  params: { keyword?: string; status?: string } = {},
): Promise<RoleItem[]> {
  const res = await http<RoleItem[]>({
    url: `${RBAC}/roles`,
    method: 'GET',
    params: { pageSize: 500, ...params },
  });
  return res.data ?? [];
}

export function fetchAllRoles(): Promise<RoleItem[]> {
  return unwrap(http<RoleItem[]>({ url: `${RBAC}/roles/all`, method: 'GET' }));
}

export function createRole(data: Partial<RoleItem>): Promise<RoleItem> {
  return unwrap(
    http<RoleItem>({
      url: `${RBAC}/roles`,
      method: 'POST',
      data: { ...data, operator: currentUsername() },
    }),
  );
}

export function updateRole(id: string | number, data: Partial<RoleItem>): Promise<RoleItem> {
  return unwrap(
    http<RoleItem>({
      url: `${RBAC}/roles/${id}`,
      method: 'PUT',
      data: { ...data, operator: currentUsername() },
    }),
  );
}

export function deleteRole(id: string | number): Promise<null> {
  return unwrap(
    http<null>({
      url: `${RBAC}/roles/${id}`,
      method: 'DELETE',
      params: { operator: currentUsername() },
    }),
  );
}

export function fetchRolePermissions(roleId: string | number): Promise<string[]> {
  return unwrap(
    http<string[]>({ url: `${RBAC}/role/permissions`, method: 'GET', params: { roleId } }),
  );
}

export function saveRolePermissions(
  roleId: string | number,
  permissionIds: string[],
): Promise<null> {
  return unwrap(
    http<null>({
      url: `${RBAC}/role/permissions`,
      method: 'POST',
      data: { roleId, permissionIds, operator: currentUsername() },
    }),
  );
}

export function fetchRoleUsers(roleId: string | number): Promise<UserItem[]> {
  return unwrap(http<UserItem[]>({ url: `${RBAC}/role/users`, method: 'GET', params: { roleId } }));
}

export function assignRoleUsers(
  roleId: string | number,
  userIds: Array<string | number>,
): Promise<null> {
  return unwrap(
    http<null>({
      url: `${RBAC}/role/users`,
      method: 'POST',
      data: { roleId, userIds, operator: currentUsername() },
    }),
  );
}

/* ---------------------------------- 权限 ---------------------------------- */

export function fetchPermissionTree(
  params: { type?: string; status?: string } = {},
): Promise<PermissionItem[]> {
  return unwrap(
    http<PermissionItem[]>({
      url: `${RBAC}/permissions`,
      method: 'GET',
      params: { tree: '1', ...params },
    }),
  );
}

export function fetchPermissionList(): Promise<PermissionItem[]> {
  return unwrap(http<PermissionItem[]>({ url: `${RBAC}/permissions`, method: 'GET' }));
}

export function createPermission(data: Partial<PermissionItem>): Promise<PermissionItem> {
  return unwrap(
    http<PermissionItem>({
      url: `${RBAC}/permissions`,
      method: 'POST',
      data: { ...data, operator: currentUsername() },
    }),
  );
}

export function updatePermission(
  id: string | number,
  data: Partial<PermissionItem>,
): Promise<PermissionItem> {
  return unwrap(
    http<PermissionItem>({
      url: `${RBAC}/permissions/${id}`,
      method: 'PUT',
      data: { ...data, operator: currentUsername() },
    }),
  );
}

export function deletePermission(id: string | number): Promise<null> {
  return unwrap(http<null>({ url: `${RBAC}/permissions/${id}`, method: 'DELETE' }));
}

/* ---------------------------------- 部门 ---------------------------------- */

export function fetchDeptTree(): Promise<DeptItem[]> {
  return unwrap(http<DeptItem[]>({ url: `${RBAC}/depts`, method: 'GET', params: { tree: '1' } }));
}

export function fetchAllDepts(): Promise<DeptItem[]> {
  return unwrap(http<DeptItem[]>({ url: `${RBAC}/depts/all`, method: 'GET' }));
}

export function createDept(data: Partial<DeptItem>): Promise<DeptItem> {
  return unwrap(
    http<DeptItem>({
      url: `${RBAC}/depts`,
      method: 'POST',
      data: { ...data, operator: currentUsername() },
    }),
  );
}

export function updateDept(id: string | number, data: Partial<DeptItem>): Promise<DeptItem> {
  return unwrap(
    http<DeptItem>({
      url: `${RBAC}/depts/${id}`,
      method: 'PUT',
      data: { ...data, operator: currentUsername() },
    }),
  );
}

export function deleteDept(id: string | number): Promise<null> {
  return unwrap(http<null>({ url: `${RBAC}/depts/${id}`, method: 'DELETE' }));
}

/* ---------------------------------- 字典 ---------------------------------- */

export async function fetchDicts(params: { keyword?: string } = {}): Promise<PageResult<DictItem>> {
  const res = await http<DictItem[]>({ url: `${RBAC}/dicts`, method: 'GET', params });
  return toPage<DictItem>(res);
}

export function fetchDictItems(code: string): Promise<DictDataItem[]> {
  return unwrap(http<DictDataItem[]>({ url: `${RBAC}/dict/${code}/items`, method: 'GET' }));
}

export function createDict(data: Partial<DictItem>): Promise<DictItem> {
  return unwrap(
    http<DictItem>({
      url: `${RBAC}/dicts`,
      method: 'POST',
      data: { ...data, operator: currentUsername() },
    }),
  );
}

export function updateDict(id: string | number, data: Partial<DictItem>): Promise<DictItem> {
  return unwrap(
    http<DictItem>({
      url: `${RBAC}/dicts/${id}`,
      method: 'PUT',
      data: { ...data, operator: currentUsername() },
    }),
  );
}

export function deleteDict(id: string | number): Promise<null> {
  return unwrap(http<null>({ url: `${RBAC}/dicts/${id}`, method: 'DELETE' }));
}

export function createDictItem(data: Partial<DictDataItem>): Promise<DictDataItem> {
  return unwrap(
    http<DictDataItem>({
      url: `${RBAC}/dict/items`,
      method: 'POST',
      data: { ...data, operator: currentUsername() },
    }),
  );
}

export function updateDictItem(
  id: string | number,
  data: Partial<DictDataItem>,
): Promise<DictDataItem> {
  return unwrap(http<DictDataItem>({ url: `${RBAC}/dict/items/${id}`, method: 'PUT', data }));
}

export function deleteDictItem(id: string | number): Promise<null> {
  return unwrap(http<null>({ url: `${RBAC}/dict/items/${id}`, method: 'DELETE' }));
}

/* ---------------------------------- 审计日志 ---------------------------------- */

export interface LogQuery {
  keyword?: string;
  module?: string;
  action?: string;
  username?: string;
  startTime?: string;
  endTime?: string;
  page?: number;
  pageSize?: number;
  [key: string]: unknown;
}

export async function fetchLogs(params: LogQuery = {}): Promise<PageResult<LogItem>> {
  const res = await http<LogItem[]>({ url: `${RBAC}/logs`, method: 'GET', params });
  return toPage<LogItem>(res);
}

export function fetchLogOverview(): Promise<LogOverview> {
  return unwrap(http<LogOverview>({ url: `${RBAC}/logs/overview`, method: 'GET' }));
}

export function clearLogs(): Promise<null> {
  return unwrap(http<null>({ url: `${RBAC}/logs`, method: 'DELETE', params: { confirm: '1' } }));
}

/* ---------------------------------- 初始化 ---------------------------------- */

export function seedRbac(): Promise<Record<string, number>> {
  return unwrap(
    http<Record<string, number>>({
      url: `${RBAC}/seed`,
      method: 'POST',
      params: { confirm: '1' },
      data: { confirm: '1' },
    }),
  );
}

/* ---------------------------------- 工具 ---------------------------------- */

/** 解包：把信封里的 data 取出来 */
async function unwrap<T>(promise: Promise<import('@/types').ResEnvelope<T>>): Promise<T> {
  const res = await promise;
  return res.data;
}

/** 信封 → PageResult */
function toPage<T>(res: import('@/types').ResEnvelope<T[]>): PageResult<T> {
  return {
    list: Array.isArray(res.data) ? res.data : [],
    total: res.total ?? 0,
    page: res.page ?? 1,
    pageSize: res.pageSize ?? 10,
    totalPages: res.totalPages ?? 0,
  };
}

/** 当前操作人（写入审计日志用） */
function currentUsername(): string {
  try {
    const raw = localStorage.getItem('reactadm_app');
    if (!raw) return '系统';
    const parsed = JSON.parse(raw) as { state?: { userInfo?: UserInfo } };
    return parsed.state?.userInfo?.username ?? '系统';
  } catch {
    return '系统';
  }
}
