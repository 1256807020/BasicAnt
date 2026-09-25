/**
 * i18n 初始化（前端方案，与后端语言无关）
 * --------------------------------------------------
 * 后端只回稳定业务码 code + 默认 msg；前端用 i18next 字典把 code 映射成多语文案，
 * 既覆盖 UI 静态文案，也覆盖接口响应提示。新增语言只需在 locales/ 加一份资源。
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhCN from './locales/zh-CN';
import enUS from './locales/en-US';

export const SUPPORTED_LANGS = [
  { key: 'zh-CN', label: '中文', antd: 'zhCN' },
  { key: 'en-US', label: 'English', antd: 'enUS' },
] as const;

export type LangKey = (typeof SUPPORTED_LANGS)[number]['key'];

const STORAGE_KEY = 'basicant-lang';

function detectLang(): LangKey {
  const saved = localStorage.getItem(STORAGE_KEY) as LangKey | null;
  if (saved && SUPPORTED_LANGS.some((l) => l.key === saved)) return saved;
  return navigator.language.toLowerCase().startsWith('en') ? 'en-US' : 'zh-CN';
}

void i18n.use(initReactI18next).init({
  resources: {
    'zh-CN': { translation: zhCN },
    'en-US': { translation: enUS },
  },
  lng: detectLang(),
  fallbackLng: 'zh-CN',
  interpolation: { escapeValue: false },
});

/** 切换语言并持久化 */
export function setLang(lang: LangKey): void {
  localStorage.setItem(STORAGE_KEY, lang);
  void i18n.changeLanguage(lang);
}

/**
 * 把后端业务码/HTTP 状态码映射为本地化文案。
 * 字典中不存在该 code 时回退到后端原始 msg（保持中文兜底）。
 */
export function localizeMessage(code: number | string | undefined | null, fallback: string): string {
  if (code == null) return fallback;
  const key = `messages.${code}`;
  return i18n.exists(key) ? (i18n.t(key) as string) : fallback;
}

export default i18n;
