/**
 * 文章管理 — 内容管理模块
 * --------------------------------------------------
 * 标准 CRUD：关键字搜索 + 状态筛选 + 分页表格 + 新增/编辑 + 删除 + 批量删除
 * 按钮级权限：content:post:add / content:post:edit / content:post:delete
 */

import { DeleteOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
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
} from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { articleApi } from '@/api';
import Auth from '@/components/Auth';
import { useCrudList } from '@/hooks/useCrudList';
import type { ArticleItem } from '@/types';

/** 表单值 */
interface ArticleFormValues {
  title: string;
  author?: string;
  category?: string;
  status?: ArticleItem['status'];
  views?: number;
  content?: string;
}

export default function ArticlePage() {
  const { message } = App.useApp();
  const [form] = Form.useForm<ArticleFormValues>();

  const {
    list,
    total,
    loading,
    page,
    pageSize,
    setPage,
    setPageSize,
    setKeyword,
    setFilters,
    reload,
  } = useCrudList<ArticleItem>(articleApi.list, { keywordFields: 'title,author,category' });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ArticleItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Array<string | number>>([]);

  /** 新增 */
  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ status: 'draft', views: 0 });
    setOpen(true);
  };

  /** 编辑 */
  const openEdit = (record: ArticleItem) => {
    setEditing(record);
    form.setFieldsValue(record);
    setOpen(true);
  };

  /** 提交新增 / 修改 */
  const submit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      if (editing) {
        await articleApi.update(editing.id, values);
        message.success('修改成功');
      } else {
        await articleApi.create(values);
        message.success('新增成功');
      }
      setOpen(false);
      reload();
    } catch {
      // 校验失败或请求失败均已在拦截器中提示
    } finally {
      setSubmitting(false);
    }
  };

  /** 单条删除 */
  const removeOne = async (id: string | number) => {
    await articleApi.remove(id);
    message.success('删除成功');
    reload();
  };

  /** 批量删除 */
  const removeMany = async () => {
    if (!selectedKeys.length) return;
    await articleApi.batchRemove(selectedKeys);
    message.success(`已删除 ${selectedKeys.length} 条`);
    setSelectedKeys([]);
    reload();
  };

  return (
    <div className="page-container">
      <Card>
        <Space wrap style={{ marginBottom: 16 }}>
          <Input.Search
            allowClear
            placeholder="搜索标题 / 作者 / 分类"
            style={{ width: 260 }}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={setKeyword}
          />
          <Select
            allowClear
            placeholder="状态"
            style={{ width: 130 }}
            options={[
              { label: '已发布', value: 'published' },
              { label: '草稿', value: 'draft' },
            ]}
            onChange={(status) => setFilters({ status })}
          />
          <Select
            allowClear
            placeholder="分类"
            style={{ width: 150 }}
            options={[
              { label: '技术', value: '技术' },
              { label: '产品', value: '产品' },
              { label: '运营', value: '运营' },
              { label: '公告', value: '公告' },
            ]}
            onChange={(category) => setFilters({ category })}
          />
          <Button icon={<ReloadOutlined />} onClick={reload}>
            刷新
          </Button>
          <Auth code="content:post:add">
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新增
            </Button>
          </Auth>
          <Auth code="content:post:delete">
            <Button
              danger
              icon={<DeleteOutlined />}
              disabled={!selectedKeys.length}
              onClick={removeMany}
            >
              批量删除
            </Button>
          </Auth>
        </Space>

        <Table<ArticleItem>
          rowKey="id"
          size="medium"
          loading={loading}
          dataSource={list}
          /* 列较多，开启横向滚动；fixed 列必须配合 scroll.x 才会生效 */
          scroll={{ x: 1200 }}
          rowSelection={{
            selectedRowKeys: selectedKeys,
            onChange: (keys) => setSelectedKeys(keys.map(String)),
          }}
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
            { title: '标题', dataIndex: 'title', width: 220, fixed: 'left', ellipsis: true },
            {
              title: '作者',
              dataIndex: 'author',
              width: 120,
              render: (value?: string) => value ?? '-',
            },
            {
              title: '分类',
              dataIndex: 'category',
              width: 120,
              render: (value?: string) => (value ? <Tag color="blue">{value}</Tag> : '-'),
            },
            {
              title: '状态',
              dataIndex: 'status',
              width: 100,
              render: (status?: ArticleItem['status']) =>
                status === 'published' ? <Tag color="green">已发布</Tag> : <Tag>草稿</Tag>,
            },
            {
              title: '阅读量',
              dataIndex: 'views',
              width: 100,
              render: (value?: number) => value ?? 0,
            },
            {
              title: '正文',
              dataIndex: 'content',
              width: 200,
              ellipsis: true,
              render: (value?: string) => value || '-',
            },
            {
              title: '更新时间',
              dataIndex: 'updatedAt',
              width: 170,
              render: (value?: string) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'),
            },
            {
              title: '操作',
              key: 'action',
              width: 140,
              fixed: 'right',
              render: (_, record) => (
                <Space size="small">
                  <Auth code="content:post:edit">
                    <Button type="link" size="small" onClick={() => openEdit(record)}>
                      编辑
                    </Button>
                  </Auth>
                  <Auth code="content:post:delete">
                    <Popconfirm title="确认删除该文章？" onConfirm={() => removeOne(record.id)}>
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

      <Modal
        open={open}
        title={editing ? '编辑文章' : '新增文章'}
        width={800}
        onCancel={() => setOpen(false)}
        onOk={submit}
        confirmLoading={submitting}
        destroyOnHidden
        /* 限制弹窗内容高度，小屏下内部滚动，避免溢出屏幕 */
        styles={{ body: { maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' } }}
      >
        <Form form={form} layout="vertical" autoComplete="off">
          <Row gutter={16}>
            {/* 标题较长，单独占满整行 */}
            <Col span={24}>
              <Form.Item
                name="title"
                label="标题"
                rules={[{ required: true, message: '请输入标题' }]}
              >
                <Input placeholder="请输入标题" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="author" label="作者">
                <Input placeholder="请输入作者" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="category" label="分类">
                <Input placeholder="请输入分类" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="status" label="状态">
                <Select
                  style={{ width: '100%' }}
                  options={[
                    { label: '已发布', value: 'published' },
                    { label: '草稿', value: 'draft' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="views" label="阅读量">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            {/* 正文：占满整行，支持多行输入；如需富文本可在后端支持后替换为编辑器 */}
            <Col span={24}>
              <Form.Item name="content" label="正文">
                <Input.TextArea rows={8} placeholder="请输入文章正文" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
