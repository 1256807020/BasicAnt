/**
 * auth.ts — 登录凭证存储
 * --------------------------------------------------
 * 单独成模块，供 request 与 store 共用，避免循环依赖。
 */

export const TOKEN_KEY = 'reactadm_token';

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? '';
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
