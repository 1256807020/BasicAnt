/**
 * request.ts — axios 封装（对齐 BasicNest 响应规范）
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
import { clearRefreshToken, clearToken, getRefreshToken, getToken, setToken } from './auth';
import { notify } from './notify';
import { localizeMessage } from '@/i18n';

/** 上次 401 提示时间，用于对并发 401 去重，避免刷屏 */
let lastUnauthorizedAt = 0;

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

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

request.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ResEnvelope>) => {
    const status = error.response?.status;
    const data = error.response?.data;
    const code = data?.code ?? status ?? 0;
    // 优先展示后端返回的具体业务文案（如「用户名已存在」「数据已存在…」「登录已过期…」）；
    // 仅当后端未给出 msg 时，才按 code 回退到 i18n 通用文案（messages.<code>）。
    const backendMsg = data?.msg;
    const message =
      backendMsg || (code != null ? localizeMessage(code, '请求失败') : '网络异常，请稍后重试');

    const originalConfig = error.config as
      (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const url = originalConfig?.url ?? '';

    // 刷新接口自身失败：直接登出
    if (url.includes('/auth/refresh')) {
      clearToken();
      clearRefreshToken();
      if (window.location.pathname !== '/login') window.location.replace('/login');
      return Promise.reject(new ApiError(code, message, { errors: data?.errors, status }));
    }

    // access token 失效：尝试用 refreshToken 续期并自动重试一次（并发 401 串行化）
    if (status === 401 && !originalConfig?._retry) {
      const rt = getRefreshToken();
      if (rt) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const newToken = await doRefresh(rt);
            isRefreshing = false;
            refreshQueue.forEach((cb) => cb(newToken));
            refreshQueue = [];
            if (newToken && originalConfig) {
              originalConfig._retry = true;
              originalConfig.headers.Authorization = `Bearer ${newToken}`;
              return request(originalConfig);
            }
          } catch {
            isRefreshing = false;
            refreshQueue.forEach((cb) => cb(null));
            refreshQueue = [];
          }
        } else {
          // 已有刷新在进行，排队等待结果后重试
          return new Promise((resolve, reject) => {
            refreshQueue.push((newToken) => {
              if (newToken && originalConfig) {
                originalConfig._retry = true;
                originalConfig.headers.Authorization = `Bearer ${newToken}`;
                request(originalConfig).then(resolve).catch(reject);
              } else {
                reject(error);
              }
            });
          });
        }
      }
    }

    if (status === 401) {
      clearToken();
      clearRefreshToken();
      // 会话失效：并发请求可能同时 401，去重提示避免刷屏；随后跳回登录页
      const now = Date.now();
      if (now - lastUnauthorizedAt > 1500) {
        lastUnauthorizedAt = now;
        notify('error', message);
      }
      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
      return Promise.reject(new ApiError(code, message, { errors: data?.errors, status }));
    }

    notify('error', message);
    // 抛出结构化 ApiError，调用方（如表单）可读取 errors 做字段级内联提示
    return Promise.reject(new ApiError(code, message, { errors: data?.errors, status }));
  },
);

/** 用 refreshToken 换发新的 accessToken（失败返回 null，由调用方决定登出） */
async function doRefresh(refreshToken: string): Promise<string | null> {
  try {
    const res = await request.post<ResEnvelope<{ accessToken: string; expiresIn: number }>>(
      '/rbac/auth/refresh',
      { refreshToken },
    );
    const env = res.data;
    if (env && env.code === 0 && env.data?.accessToken) {
      setToken(env.data.accessToken);
      return env.data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

/** 业务异常（携带可选字段级错误 errors 与 HTTP 状态 status） */
export class ApiError extends Error {
  readonly code: number;
  readonly errors?: Record<string, string>;
  readonly status?: number;

  constructor(
    code: number,
    message: string,
    opts?: { errors?: Record<string, string>; status?: number },
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.errors = opts?.errors;
    this.status = opts?.status;
  }
}

/**
 * 发起请求并返回后端信封
 * 业务码 code !== 0 时自动提示并抛出 ApiError（含字段级 errors）
 */
export async function http<T = unknown>(config: AxiosRequestConfig): Promise<ResEnvelope<T>> {
  // FormData 上传：移除实例默认的 application/json，让浏览器自动补充 multipart boundary
  if (config.data instanceof FormData) {
    config = { ...config, headers: { ...(config.headers || {}), 'Content-Type': undefined } };
  }
  const { data } = await request.request<ResEnvelope<T>>(config);

  if (data && typeof data === 'object' && 'code' in data && data.code !== 0) {
    // 与响应拦截器保持一致：优先后端具体 msg，缺省才回退 i18n 通用文案
    const message = data.msg || localizeMessage(data.code, '请求失败');
    notify('error', message);
    throw new ApiError(data.code, message, {
      errors: (data as ResEnvelope<T> & { errors?: Record<string, string> }).errors,
    });
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
