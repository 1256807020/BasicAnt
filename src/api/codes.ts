/**
 * codes.ts — 业务状态码，与后端（BasicApi / 未来 Nest 12.x）保持一致
 * 详见 docs/API.md §3。
 */

export const ApiCode = {
  SUCCESS: 0,
  ARG_ERROR: 40000,
  NO_LOGIN: 40001,
  FORBIDDEN: 40003,
  NOT_FOUND: 40004,
  UPLOAD_ERROR: 40005,
  INTERNAL_ERROR: 50000,
  FAIL: 50003,
} as const;

export type ApiCodeValue = (typeof ApiCode)[keyof typeof ApiCode];
