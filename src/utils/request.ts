/**
 * request.ts — axios 封装（对齐 BasicApi 响应规范）
 * --------------------------------------------------
 * 1. 统一 baseURL / 超时 / 请求头
 * 2. 请求拦截器自动注入 token
 * 3. 响应拦截器统一解包 { code, data, msg }，业务失败自动提示并 reject
 * 4. HTTP 异常统一提示，401 自动清理登录态
 */

import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ResEnvelope } from '@/types';
import { clearToken, getToken } from './auth';
import { notify } from './notify';
import { localizeMessage } from '@/i18n';

export const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

request.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // 身份凭证只通过 Authorization: Bearer <JWT> 传递；
  // 后端校验 JWT 后据此确定操作人，不再信任客户端自报的 x-user-id / x-user-name
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

request.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ResEnvelope>) => {
    const status = error.response?.status;
    const code = error.response?.data?.code;
    const fallback = error.response?.data?.msg || error.message || '网络异常，请稍后重试';
    // 未登录：以 HTTP 401 为唯一信号（BasicApi noLogin 返回 401，业务码 40001 随之返回）
    if (status === 401) {
      clearToken();
      notify('error', localizeMessage(401, '登录已失效，请重新登录'));
    } else {
      notify('error', code != null ? localizeMessage(code, fallback) : fallback);
    }
    return Promise.reject(error);
  },
);

/** 业务异常 */
export class ApiError extends Error {
  readonly code: number;

  constructor(code: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

/**
 * 发起请求并返回后端信封
 * 业务码 code !== 0 时自动提示并抛出 ApiError
 */
export async function http<T = unknown>(config: AxiosRequestConfig): Promise<ResEnvelope<T>> {
  const { data } = await request.request<ResEnvelope<T>>(config);

  if (data && typeof data === 'object' && 'code' in data && data.code !== 0) {
    const message = localizeMessage(data.code, data.msg || '请求失败');
    notify('error', message);
    throw new ApiError(data.code, message);
  }

  return data;
}

/** 过滤掉空值参数，避免把 undefined 拼进 query */
export function cleanParams(params: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    result[key] = value;
  });
  return result;
}
