/**
 * time.ts — UTC → 用户 IANA 时区的展示层时间工具
 * --------------------------------------------------
 * 后端统一以 UTC（timestamptz / ISO Z 字符串）存储与返回，
 * 前端在「展示层」按用户 IANA 时区转换为本地时间，避免依赖浏览器隐式本地时区。
 *
 * 实现：dayjs 的 utc + timezone 插件（timezone 底层即 Intl.DateTimeFormat(timeZone)）。
 */

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * 取当前用户 IANA 时区。
 * 当前前端没有用户时区设置字段，默认取浏览器 / 系统的 IANA 时区
 * （即用户所在时区，如 Asia/Shanghai），这正是「用户 IANA 时区」。
 * 后续若接入用户时区偏好，可在此改为从 useAppStore 读取 userInfo.timezone。
 */
export function getUserTimeZone(): string {
  return dayjs.tz.guess();
}

/**
 * 将后端返回的 UTC 时间按用户 IANA 时区格式化为本地时间。
 * @param value  ISO 字符串 / 时间戳(ms) / Date；后端 timestamptz 一律返回 ISO Z
 * @param pattern  dayjs 格式串，默认 'YYYY-MM-DD HH:mm'
 * @param tz      IANA 时区，默认取 getUserTimeZone()
 * @returns 空值或非法时间返回 '-'
 */
export function formatUtc(
  value: string | number | Date | null | undefined,
  pattern = 'YYYY-MM-DD HH:mm',
  tz: string = getUserTimeZone(),
): string {
  if (value === null || value === undefined || value === '') return '-';
  const d = dayjs.utc(value);
  if (!d.isValid()) return '-';
  return d.tz(tz).format(pattern);
}
