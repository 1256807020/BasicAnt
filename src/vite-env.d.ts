/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 接口基础地址，默认走 vite proxy 的 /api */
  readonly VITE_API_BASE_URL?: string;
  /** 应用标题 */
  readonly VITE_APP_TITLE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
