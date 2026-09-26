/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 接口基础地址，默认走 vite proxy 的 /api；生产填 Suga 后端，如 https://<sub>.suga.run/api */
  readonly VITE_API_BASE_URL?: string;
  /** WebSocket 基础地址，默认同源（dev proxy）；生产填 Suga 后端，如 wss://<sub>.suga.run */
  readonly VITE_WS_BASE_URL?: string;
  /** 应用标题 */
  readonly VITE_APP_TITLE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
