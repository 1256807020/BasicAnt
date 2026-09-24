/**
 * crud.ts — 通用 CRUD 工厂（对接 BasicApi 的 /api/:resource 规范）
 * --------------------------------------------------
 * 一个 createCrudApi(resource) 即得到 list / detail / create / update / remove / batchRemove / count，
 * 新增业务集合只需要一行代码。
 */

import type { PageResult, ResEnvelope } from '@/types';
import { cleanParams, http } from '@/utils/request';

export interface ListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  keywordFields?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  tree?: '1' | '0';
  parentKey?: string;
  childrenKey?: string;
  [key: string]: unknown;
}

/** 列表（含分页） */
export async function getList<T>(
  resource: string,
  params: ListParams = {},
): Promise<PageResult<T>> {
  const res = await http<T[]>({ url: `/${resource}`, method: 'GET', params: cleanParams(params) });
  return {
    list: Array.isArray(res.data) ? res.data : [],
    total: res.total ?? 0,
    page: res.page ?? 1,
    pageSize: res.pageSize ?? 10,
    totalPages: res.totalPages ?? 0,
  };
}

/** 详情 */
export async function getDetail<T>(resource: string, id: string | number): Promise<T> {
  const res = await http<T>({ url: `/${resource}/${id}`, method: 'GET' });
  return res.data;
}

/** 新增 */
export async function createItem<T, D extends object = Record<string, unknown>>(
  resource: string,
  data: D,
): Promise<T> {
  const res = await http<T>({ url: `/${resource}`, method: 'POST', data });
  return res.data;
}

/** 修改（增量） */
export async function updateItem<T, D extends object = Record<string, unknown>>(
  resource: string,
  id: string | number,
  data: D,
): Promise<T> {
  const res = await http<T>({ url: `/${resource}/${id}`, method: 'PATCH', data });
  return res.data;
}

/** 删除 */
export async function removeItem<T = unknown>(resource: string, id: string | number): Promise<T> {
  const res = await http<T>({ url: `/${resource}/${id}`, method: 'DELETE' });
  return res.data;
}

/** 批量删除 */
export async function batchRemove(
  resource: string,
  ids: Array<string | number>,
): Promise<ResEnvelope> {
  return http({ url: `/${resource}/batch-delete`, method: 'POST', data: { ids } });
}

/** 数量统计 */
export async function getCount(resource: string, params: ListParams = {}): Promise<number> {
  const res = await http<{ total: number }>({
    url: `/${resource}/_count`,
    method: 'GET',
    params: cleanParams(params),
  });
  return res.data?.total ?? 0;
}

/** 健康检查 */
export async function getHealth(): Promise<ResEnvelope<Record<string, unknown>>> {
  return http<Record<string, unknown>>({ url: '/_health', method: 'GET' });
}

/** 生成一个绑定集合的 CRUD 实例 */
export function createCrudApi<T>(resource: string) {
  return {
    resource,
    list: (params?: ListParams) => getList<T>(resource, params),
    tree: (params?: ListParams) => getList<T>(resource, { ...params, tree: '1' }),
    detail: (id: string | number) => getDetail<T>(resource, id),
    create: <D extends object>(data: D) => createItem<T, D>(resource, data),
    update: <D extends object>(id: string | number, data: D) =>
      updateItem<T, D>(resource, id, data),
    remove: (id: string | number) => removeItem(resource, id),
    batchRemove: (ids: Array<string | number>) => batchRemove(resource, ids),
    count: (params?: ListParams) => getCount(resource, params),
  };
}
