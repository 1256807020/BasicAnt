/**
 * 审计日志 — 日志查询 / 概览统计 / 详情查看 / 清空
 * --------------------------------------------------
 * 数据全部来自 BasicApi 的 /api/rbac/logs* 接口，
 * 列表用 ahooks useRequest，依赖变化时自动刷新。
 */

import { ClearOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { formatUtc } from '@/utils/time';
import { useMemo, useState } from 'react';
import type { EChartsOption } from 'echarts';
import { useRequest } from 'ahooks';
import { clearLogs, fetchLogOverview, fetchLogs, type LogQuery } from '@/api/rbac';
import Auth from '@/components/Auth';
import EChart from '@/components/EChart';
import type { LogItem } from '@/types';
import { useAppStore } from '@/store/useAppStore';

/** 筛选表单值 */
interface SearchFormValues {
  keyword?: string;
  module?: string;
  action?: string;
  username?: string;
  range?: [Dayjs, Dayjs] | null;
}

/** 模块下拉：内置常见模块，再补上后端实际出现过的 */
const BASE_MODULES = [
  '认证',
  '用户',
  '角色',
  '权限',
  '部门',
  '岗位',
  '字典',
  '日志',
  '文章',
  '公告',
  '数据表',
];

/** 动作下拉 */
const ACTION_OPTIONS = [
  { label: '登录', value: 'login' },
  { label: '登出', value: 'logout' },
  { label: '注册', value: 'register' },
  { label: '新增', value: 'create' },
  { label: '修改', value: 'update' },
  { label: '删除', value: 'delete' },
  { label: '查询', value: 'query' },
  { label: '分配', value: 'assign' },
  { label: '重置密码', value: 'reset-password' },
  { label: '清空', value: 'clear' },
];

/** 状态码着色：<400 成功（绿），>=400 失败（红） */
function statusTag(code?: number) {
  if (code === undefined || code === null) return <Tag>未知</Tag>;
  if (code >= 400) return <Tag color="red">{code}</Tag>;
  return <Tag color="green">{code}</Tag>;
}

export default function LogPage() {
  const { message } = App.useApp();
  const theme = useAppStore((state) => state.theme);
  const [form] = Form.useForm<SearchFormValues>();

  /** 分页 + 查询条件，任一变化都会触发 useRequest 重新请求 */
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [query, setQuery] = useState<LogQuery>({});

  /** 列表 */
  const { data, loading, refresh } = useRequest(() => fetchLogs({ page, pageSize, ...query }), {
    refreshDeps: [page, pageSize, query],
  });

  /** 概览统计 */
  const {
    data: overview,
    loading: overviewLoading,
    refresh: refreshOverview,
  } = useRequest(fetchLogOverview);

  const list = useMemo<LogItem[]>(() => data?.list ?? [], [data]);
  const total = data?.total ?? 0;

  /** 当前查看详情的日志 */
  const [current, setCurrent] = useState<LogItem | null>(null);

  /** 模块下拉项：内置 + 概览里真实出现的模块 */
  const moduleOptions = useMemo(() => {
    const names = new Set<string>(BASE_MODULES);
    overview?.byModule?.forEach((item) => item.name && names.add(item.name));
    return Array.from(names).map((value) => ({ label: value, value }));
  }, [overview]);

  /** 近 7 日趋势图 */
  const trendOption = useMemo<EChartsOption>(() => {
    const trend = overview?.trend ?? [];
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 20, top: 30, bottom: 30 },
      xAxis: { type: 'category', data: trend.map((item) => item.day), boundaryGap: false },
      yAxis: { type: 'value', minInterval: 1 },
      series: [
        {
          name: '日志量',
          type: 'line',
          smooth: true,
          areaStyle: { opacity: 0.15 },
          data: trend.map((item) => item.count),
        },
      ],
    };
  }, [overview]);

  /** 详情内容：JSON 自动美化输出，非 JSON 原样展示 */
  const detailText = useMemo(() => {
    if (!current?.detail) return '';
    try {
      return JSON.stringify(JSON.parse(current.detail), null, 2);
    } catch {
      return current.detail;
    }
  }, [current]);

  /** 查询：日期区间转成 YYYY-MM-DD 字符串 */
  const submitSearch = () => {
    const values = form.getFieldsValue() as SearchFormValues;
    const range = values.range;
    setPage(1);
    setQuery({
      keyword: values.keyword?.trim() || undefined,
      module: values.module,
      action: values.action,
      username: values.username?.trim() || undefined,
      startTime: range?.[0]?.format('YYYY-MM-DD'),
      endTime: range?.[1]?.format('YYYY-MM-DD'),
    });
  };

  /** 重置 */
  const resetSearch = () => {
    form.resetFields();
    setPage(1);
    setQuery({});
  };

  /** 清空日志（高危操作，需权限 + 二次确认） */
  const { run: runClear, loading: clearing } = useRequest(clearLogs, {
    manual: true,
    onSuccess: () => {
      message.success('日志已清空');
      setPage(1);
      setCurrent(null);
      refresh();
      refreshOverview();
    },
  });

  const statItems = [
    { key: 'total', title: '日志总数', value: overview?.total ?? 0, color: '#1677ff' },
    { key: 'today', title: '今日日志', value: overview?.today ?? 0, color: '#52c41a' },
    { key: 'failed', title: '失败请求', value: overview?.failed ?? 0, color: '#ff4d4f' },
    { key: 'module', title: '涉及模块', value: overview?.byModule?.length ?? 0, color: '#faad14' },
  ];

  return (
    <div className="page-container">
      <Row gutter={[16, 16]}>
        {statItems.map((item) => (
          <Col key={item.key} xs={24} sm={12} xl={6}>
            <Card loading={overviewLoading}>
              <Statistic
                title={item.title}
                value={item.value}
                styles={{ content: { color: item.color } }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="近 7 日日志趋势">
        {overview?.trend?.length ? (
          <EChart option={trendOption} theme={theme} height={280} />
        ) : (
          <Empty description="暂无趋势数据" />
        )}
      </Card>

      <Card>
        <Form form={form} layout="inline" style={{ marginBottom: 16, rowGap: 12 }}>
          <Form.Item name="keyword">
            <Input allowClear placeholder="关键字 / 路径 / IP" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="module">
            <Select
              allowClear
              showSearch
              placeholder="模块"
              style={{ width: 140 }}
              options={moduleOptions}
            />
          </Form.Item>
          <Form.Item name="action">
            <Select
              allowClear
              showSearch
              placeholder="动作"
              style={{ width: 140 }}
              options={ACTION_OPTIONS}
            />
          </Form.Item>
          <Form.Item name="username">
            <Input allowClear placeholder="操作人" style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="range" label="时间范围">
            <DatePicker.RangePicker
              allowClear
              placeholder={['开始日期', '结束日期']}
              disabledDate={(value) => value.isAfter(dayjs(), 'day')}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={submitSearch}>
                查询
              </Button>
              <Button onClick={resetSearch}>重置</Button>
              <Button icon={<ReloadOutlined />} onClick={() => refresh()}>
                刷新
              </Button>
              <Auth code="system:log:delete">
                <Popconfirm
                  title="确认清空全部日志？"
                  description="该操作不可恢复，请谨慎操作。"
                  okButtonProps={{ danger: true, loading: clearing }}
                  onConfirm={() => runClear()}
                >
                  <Button danger icon={<ClearOutlined />} loading={clearing}>
                    清空日志
                  </Button>
                </Popconfirm>
              </Auth>
            </Space>
          </Form.Item>
        </Form>

        <Table<LogItem>
          rowKey="id"
          size="medium"
          loading={loading}
          dataSource={list}
          scroll={{ x: 1200 }}
          locale={{ emptyText: <Empty description="暂无日志" /> }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (value) => `共 ${value} 条`,
          }}
          onChange={(pagination) => {
            setPage(pagination.current ?? 1);
            setPageSize(pagination.pageSize ?? 10);
          }}
          columns={[
            {
              title: '操作人',
              dataIndex: 'username',
              width: 120,
              render: (value?: string) => value ?? '系统',
            },
            {
              title: '模块',
              dataIndex: 'module',
              width: 100,
              render: (value?: string) => (value ? <Tag color="blue">{value}</Tag> : '-'),
            },
            {
              title: '动作',
              dataIndex: 'action',
              width: 130,
              render: (value?: string) => value ?? '-',
            },
            {
              title: '请求方法',
              dataIndex: 'method',
              width: 100,
              render: (value?: string) => (value ? <Tag>{value}</Tag> : '-'),
            },
            {
              title: '请求路径',
              dataIndex: 'path',
              ellipsis: true,
              render: (value?: string) => value ?? '-',
            },
            { title: 'IP', dataIndex: 'ip', width: 140, render: (value?: string) => value ?? '-' },
            { title: '状态码', dataIndex: 'statusCode', width: 90, render: statusTag },
            {
              title: '耗时',
              dataIndex: 'cost',
              width: 100,
              render: (value?: number) => (value === undefined ? '-' : `${value} ms`),
            },
            {
              title: '时间',
              dataIndex: 'createdAt',
              width: 170,
              render: (value?: string) => formatUtc(value, 'YYYY-MM-DD HH:mm:ss'),
            },
            {
              title: '操作',
              key: 'action',
              width: 100,
              fixed: 'right',
              render: (_, record) => (
                <Button type="link" size="small" onClick={() => setCurrent(record)}>
                  查看详情
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <Drawer
        open={!!current}
        title="日志详情"
        size={560}
        onClose={() => setCurrent(null)}
        destroyOnHidden
      >
        {current ? (
          <Space orientation="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions
              column={1}
              size="small"
              bordered
              items={[
                { key: 'user', label: '操作人', children: current.username ?? '系统' },
                { key: 'module', label: '模块', children: current.module ?? '-' },
                { key: 'action', label: '动作', children: current.action ?? '-' },
                {
                  key: 'req',
                  label: '请求',
                  children: current.method
                    ? `${current.method} ${current.path ?? ''}`
                    : (current.path ?? '-'),
                },
                { key: 'ip', label: 'IP', children: current.ip ?? '-' },
                { key: 'code', label: '状态码', children: statusTag(current.statusCode) },
                {
                  key: 'cost',
                  label: '耗时',
                  children: current.cost === undefined ? '-' : `${current.cost} ms`,
                },
                {
                  key: 'time',
                  label: '时间',
                  children: formatUtc(current.createdAt, 'YYYY-MM-DD HH:mm:ss'),
                },
              ]}
            />

            <div>
              <Typography.Text strong>详细信息</Typography.Text>
              <pre
                style={{
                  margin: '8px 0 0',
                  padding: 12,
                  background: 'rgba(0,0,0,0.04)',
                  borderRadius: 6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {detailText || '暂无'}
              </pre>
            </div>
          </Space>
        ) : null}
      </Drawer>
    </div>
  );
}
