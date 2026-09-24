/**
 * useCrudList — 通用列表查询 Hook（基于 ahooks useRequest）
 * --------------------------------------------------
 * 统一管理分页 / 关键字 / 过滤条件 / loading / 刷新，
 * 管理后台里 90% 的页面都是「筛选 + 表格 + 分页」，抽出来避免重复代码。
 */

import { useState } from 'react';
import { useRequest } from 'ahooks';
import type { ListParams } from '@/api/crud';
import type { PageResult } from '@/types';

interface Options {
  keywordFields?: string;
  defaultPageSize?: number;
}

export function useCrudList<T>(
  fetcher: (params: ListParams) => Promise<PageResult<T>>,
  options: Options = {},
) {
  const { keywordFields, defaultPageSize = 10 } = options;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [keyword, setKeyword] = useState('');
  const [filters, setFilters] = useState<Record<string, unknown>>({});

  const { data, loading, refresh } = useRequest(
    () =>
      fetcher({
        page,
        pageSize,
        keyword,
        keywordFields,
        ...filters,
      }),
    { refreshDeps: [page, pageSize, keyword, filters] },
  );

  /** 关键字搜索：回到第一页 */
  const search = (value: string) => {
    setPage(1);
    setKeyword(value);
  };

  /** 过滤条件变更：回到第一页 */
  const applyFilters = (value: Record<string, unknown>) => {
    setPage(1);
    setFilters(value);
  };

  /** 新增/编辑/删除后刷新 */
  const reload = () => {
    refresh();
  };

  return {
    list: data?.list ?? [],
    total: data?.total ?? 0,
    loading,
    page,
    pageSize,
    keyword,
    filters,
    setPage,
    setPageSize,
    setKeyword: search,
    setFilters: applyFilters,
    reload,
  };
}
