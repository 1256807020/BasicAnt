/**
 * 字典管理 — 两级结构（字典分类 + 字典项）
 * --------------------------------------------------
 * 外层表格展示字典分类，展开行内嵌字典项表格，可分别对分类与字典项做增删改。
 * 数据请求统一走 ahooks 的 useRequest，避免在 useEffect 中直接 setState。
 */

import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import {
  App,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useState } from 'react';
import {
  createDict,
  createDictItem,
  deleteDict,
  deleteDictItem,
  updateDict,
  updateDictItem,
} from '@/api';
import Auth from '@/components/Auth';
import type { DictDataItem, DictItem, PageResult } from '@/types';
import { http } from '@/utils/request';

/** 字典项标签类型（取值与 antd Tag 的 color 对齐） */
const TAG_TYPE_OPTIONS = [
  { label: '默认', value: 'default' },
  { label: '蓝色', value: 'blue' },
  { label: '绿色', value: 'green' },
  { label: '红色', value: 'red' },
  { label: '橙色', value: 'orange' },
  { label: '紫色', value: 'purple' },
  { label: '青色', value: 'cyan' },
];

/** 状态：后端用 '1' 启用 / '0' 禁用 */
const STATUS_OPTIONS = [
  { label: '启用', value: '1' },
  { label: '禁用', value: '0' },
];

/** 字典分类表单值 */
interface DictFormValues {
  name: string;
  code: string;
  status?: string;
  sort?: number;
  remark?: string;
}

/** 字典项表单值 */
interface DictItemFormValues {
  dictId: string | number;
  label: string;
  value: string;
  tagType?: string;
  sort?: number;
  status?: string;
  remark?: string;
}

/** 分类列表查询参数 */
interface DictQuery {
  page: number;
  pageSize: number;
  keyword?: string;
}

/** 字典分类分页查询：GET /api/rbac/dicts */
async function fetchDictPage(params: DictQuery): Promise<PageResult<DictItem>> {
  const res = await http<DictItem[]>({ url: '/rbac/dicts', method: 'GET', params });
  return {
    list: Array.isArray(res.data) ? res.data : [],
    total: res.total ?? 0,
    page: res.page ?? params.page,
    pageSize: res.pageSize ?? params.pageSize,
    totalPages: res.totalPages ?? 0,
  };
}

/** 状态标签：'0' 为禁用，其余按启用处理 */
function renderStatus(status?: string) {
  return status === '0' ? <Tag color="red">禁用</Tag> : <Tag color="green">启用</Tag>;
}

export default function DictPage() {
  const { message } = App.useApp();
  const [dictForm] = Form.useForm<DictFormValues>();
  const [itemForm] = Form.useForm<DictItemFormValues>();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');

  /** 分类列表：page / pageSize / keyword 变化时自动重新请求 */
  const { data, loading, refresh } = useRequest(() => fetchDictPage({ page, pageSize, keyword }), {
    refreshDeps: [page, pageSize, keyword],
  });
  const list = data?.list ?? [];
  const total = data?.total ?? 0;

  /** 分类弹窗 */
  const [dictOpen, setDictOpen] = useState(false);
  const [editingDict, setEditingDict] = useState<DictItem | null>(null);
  /** 字典项弹窗 */
  const [itemOpen, setItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DictDataItem | null>(null);
  const [itemDictId, setItemDictId] = useState<string | number>('');
  const [submitting, setSubmitting] = useState(false);

  /** 关键字搜索：回到第一页 */
  const search = (value: string) => {
    setPage(1);
    setKeyword(value);
  };

  /* ------------------------------ 字典分类 ------------------------------ */

  const openCreateDict = () => {
    setEditingDict(null);
    dictForm.resetFields();
    dictForm.setFieldsValue({ status: '1', sort: 0 });
    setDictOpen(true);
  };

  const openEditDict = (record: DictItem) => {
    setEditingDict(record);
    dictForm.resetFields();
    dictForm.setFieldsValue({
      name: record.name,
      code: record.code,
      status: record.status ?? '1',
      sort: record.sort ?? 0,
      remark: record.remark ?? '',
    });
    setDictOpen(true);
  };

  const submitDict = async () => {
    const values = await dictForm.validateFields();
    setSubmitting(true);
    try {
      if (editingDict) {
        await updateDict(editingDict.id, values);
        message.success('修改成功');
      } else {
        await createDict(values);
        message.success('新增成功');
      }
      setDictOpen(false);
      refresh();
    } catch {
      // 校验失败或请求失败：错误提示已由 request 统一处理
    } finally {
      setSubmitting(false);
    }
  };

  const removeDict = async (record: DictItem) => {
    await deleteDict(record.id);
    message.success('删除成功（含其下字典项）');
    refresh();
  };

  /* ------------------------------ 字典项 ------------------------------ */

  const openCreateItem = (dict: DictItem) => {
    setEditingItem(null);
    setItemDictId(dict.id);
    itemForm.resetFields();
    itemForm.setFieldsValue({
      dictId: dict.id,
      status: '1',
      sort: (dict.items?.length ?? 0) + 1,
      tagType: 'default',
    });
    setItemOpen(true);
  };

  const openEditItem = (record: DictDataItem) => {
    setEditingItem(record);
    setItemDictId(record.dictId);
    itemForm.resetFields();
    itemForm.setFieldsValue({
      dictId: record.dictId,
      label: record.label,
      value: record.value,
      tagType: record.tagType ?? 'default',
      sort: record.sort ?? 0,
      status: record.status ?? '1',
      remark: record.remark ?? '',
    });
    setItemOpen(true);
  };

  const submitItem = async () => {
    const values = await itemForm.validateFields();
    const payload = { ...values, dictId: values.dictId ?? itemDictId };
    setSubmitting(true);
    try {
      if (editingItem) {
        await updateDictItem(editingItem.id, payload);
        message.success('修改成功');
      } else {
        await createDictItem(payload);
        message.success('新增成功');
      }
      setItemOpen(false);
      refresh();
    } catch {
      // 校验失败或请求失败：错误提示已由 request 统一处理
    } finally {
      setSubmitting(false);
    }
  };

  const removeItem = async (record: DictDataItem) => {
    await deleteDictItem(record.id);
    message.success('删除成功');
    refresh();
  };

  return (
    <div className="page-container">
      <Card>
        <Space wrap style={{ marginBottom: 16 }}>
          <Input.Search
            allowClear
            placeholder="搜索字典名称 / 编码"
            style={{ width: 260 }}
            onChange={(e) => search(e.target.value)}
            onSearch={search}
          />
          <Button icon={<ReloadOutlined />} onClick={refresh}>
            刷新
          </Button>
          <Auth code="system:dict:add">
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateDict}>
              新增字典
            </Button>
          </Auth>
        </Space>

        <Table<DictItem>
          rowKey="id"
          loading={loading}
          dataSource={list}
          /* 列较多：开启横向滚动，fixed 列需配合 scroll.x 才生效 */
          scroll={{ x: 1000 }}
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
          expandable={{
            expandedRowRender: (record) => (
              <div>
                <Space style={{ marginBottom: 12 }}>
                  <Typography.Text type="secondary">
                    字典项（{record.itemCount ?? record.items?.length ?? 0}）
                  </Typography.Text>
                  <Auth code="system:dict:add">
                    <Button
                      type="primary"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => openCreateItem(record)}
                    >
                      新增字典项
                    </Button>
                  </Auth>
                </Space>
                <Table<DictDataItem>
                  rowKey="id"
                  size="small"
                  dataSource={record.items ?? []}
                  pagination={false}
                  locale={{ emptyText: '暂无字典项' }}
                  columns={[
                    { title: '标签', dataIndex: 'label', width: 160, ellipsis: true },
                    { title: '值', dataIndex: 'value', width: 140, ellipsis: true },
                    {
                      title: '标签类型',
                      dataIndex: 'tagType',
                      width: 120,
                      render: (tagType?: string) =>
                        tagType ? <Tag color={tagType}>{tagType}</Tag> : '-',
                    },
                    {
                      title: '排序',
                      dataIndex: 'sort',
                      width: 80,
                      render: (sort?: number) => sort ?? 0,
                    },
                    {
                      title: '状态',
                      dataIndex: 'status',
                      width: 90,
                      render: (status?: string) => renderStatus(status),
                    },
                    {
                      title: '备注',
                      dataIndex: 'remark',
                      ellipsis: true,
                      render: (remark?: string) => remark || '-',
                    },
                    {
                      title: '操作',
                      key: 'action',
                      width: 120,
                      render: (_, item) => (
                        <Space size="small">
                          <Auth code="system:dict:edit">
                            <Button type="link" size="small" onClick={() => openEditItem(item)}>
                              编辑
                            </Button>
                          </Auth>
                          <Auth code="system:dict:delete">
                            <Popconfirm
                              title="确认删除该字典项？"
                              onConfirm={() => removeItem(item)}
                            >
                              <Button type="link" size="small" danger>
                                删除
                              </Button>
                            </Popconfirm>
                          </Auth>
                        </Space>
                      ),
                    },
                  ]}
                />
              </div>
            ),
          }}
          columns={[
            { title: '名称', dataIndex: 'name', width: 180, fixed: 'left' },
            {
              title: '编码',
              dataIndex: 'code',
              width: 160,
              render: (code: string) => <Tag>{code}</Tag>,
            },
            {
              title: '字典项数量',
              dataIndex: 'itemCount',
              width: 110,
              render: (count?: number, record?: DictItem) => count ?? record?.items?.length ?? 0,
            },
            {
              title: '状态',
              dataIndex: 'status',
              width: 90,
              render: (status?: string) => renderStatus(status),
            },
            {
              title: '排序',
              dataIndex: 'sort',
              width: 80,
              render: (sort?: number) => sort ?? 0,
            },
            {
              title: '备注',
              dataIndex: 'remark',
              ellipsis: true,
              render: (remark?: string) => remark || '-',
            },
            {
              title: '操作',
              key: 'action',
              width: 180,
              fixed: 'right',
              render: (_, record) => (
                <Space size="small">
                  <Auth code="system:dict:edit">
                    <Button type="link" size="small" onClick={() => openEditDict(record)}>
                      编辑
                    </Button>
                  </Auth>
                  <Auth code="system:dict:delete">
                    <Popconfirm
                      title="确认删除该字典？"
                      description="删除后会级联删除其下所有字典项"
                      onConfirm={() => removeDict(record)}
                    >
                      <Button type="link" size="small" danger>
                        删除
                      </Button>
                    </Popconfirm>
                  </Auth>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      {/* 字典分类：新增 / 编辑 */}
      <Modal
        open={dictOpen}
        title={editingDict ? '编辑字典分类' : '新增字典分类'}
        onCancel={() => setDictOpen(false)}
        onOk={submitDict}
        confirmLoading={submitting}
        width={800}
        /* 字段较多：限制表单区最大高度，小屏内部滚动 */
        styles={{ body: { maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' } }}
        destroyOnHidden
      >
        <Form form={dictForm} layout="vertical" autoComplete="off">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="name"
                label="字典名称"
                rules={[{ required: true, message: '请输入字典名称' }]}
              >
                <Input placeholder="如：用户状态" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="code"
                label="字典编码"
                rules={[{ required: true, message: '请输入字典编码' }]}
              >
                <Input placeholder="如：user_status" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="status" label="状态">
                <Select style={{ width: '100%' }} options={STATUS_OPTIONS} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="sort" label="排序">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            {/* 备注为长文本，单独占满整行 */}
            <Col span={24}>
              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={3} placeholder="请输入备注" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 字典项：新增 / 编辑 */}
      <Modal
        open={itemOpen}
        title={editingItem ? '编辑字典项' : '新增字典项'}
        onCancel={() => setItemOpen(false)}
        onOk={submitItem}
        confirmLoading={submitting}
        width={800}
        styles={{ body: { maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' } }}
        destroyOnHidden
      >
        <Form form={itemForm} layout="vertical" autoComplete="off">
          {/* 所属字典 ID：隐藏字段，由外层表格行带入 */}
          <Form.Item name="dictId" hidden>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="label"
                label="标签"
                rules={[{ required: true, message: '请输入标签' }]}
              >
                <Input placeholder="如：启用" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="value" label="值" rules={[{ required: true, message: '请输入值' }]}>
                <Input placeholder="如：1" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="tagType" label="标签类型">
                <Select style={{ width: '100%' }} options={TAG_TYPE_OPTIONS} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="sort" label="排序">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="status" label="状态">
                <Select style={{ width: '100%' }} options={STATUS_OPTIONS} />
              </Form.Item>
            </Col>
            {/* 备注为长文本，单独占满整行 */}
            <Col span={24}>
              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={3} placeholder="请输入备注" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
