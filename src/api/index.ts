/**
 * api/index.ts — 业务接口汇总
 * --------------------------------------------------
 * RBAC 相关（登录/用户/角色/权限/部门/字典/日志）见 @/api/rbac
 * 这里只放走通用 CRUD 的单集合业务：文章、公告、系统参数、通用数据、岗位
 */

import type { ArticleItem, ConfigItem, NoticeItem, PostItem, TableItem, TagItem } from '@/types';
import { createCrudApi } from './crud';

export * from './crud';
export * from './rbac';

/** 文章 */
export const articleApi = createCrudApi<ArticleItem>('article');
/** 通知公告 */
export const noticeApi = createCrudApi<NoticeItem>('notice');
/** 系统参数 */
export const configApi = createCrudApi<ConfigItem>('sys_config');
/** 通用数据表 */
export const tableApi = createCrudApi<TableItem>('table');
/** 标签（动手练示例模块） */
export const tagApi = createCrudApi<TagItem>('tag');
/** 岗位 */
export const postApi = createCrudApi<PostItem>('post');
