/**
 * 通用类型 + RBAC 类型统一出口
 * 页面统一从 '@/types' 导入，避免多处散落。
 */

export * from './rbac';

/** 后端统一响应信封 */
export interface ResEnvelope<T = unknown> {
  code: number;
  msg: string;
  data: T;
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

/** 分页查询结果 */
export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** 集合记录公共字段 */
export interface BaseRecord {
  id: string | number;
  createdAt?: string;
  updatedAt?: string;
}

/** 文章（内容管理） */
export interface ArticleItem extends BaseRecord {
  title: string;
  author?: string;
  category?: string;
  status?: 'published' | 'draft';
  views?: number;
}

/** 通知公告 */
export interface NoticeItem extends BaseRecord {
  title: string;
  content?: string;
  type?: 'notice' | 'announce';
  status?: 'published' | 'draft';
  publisher?: string;
}

/** 系统参数 */
export interface ConfigItem extends BaseRecord {
  name: string;
  key: string;
  value?: string;
  type?: string;
  remark?: string;
}

/** 通用数据表 */
export interface TableItem extends BaseRecord {
  title: string;
  content?: string;
}
