/**
 * 通知公告 — 内容管理模块
 * --------------------------------------------------
 * 左侧列表（Table）+ 右侧编辑抽屉（Drawer，多行文本更适合长内容）
 * 按钮级权限：content:notice:add / content:notice:edit / content:notice:delete
 */

import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Col,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { noticeApi } from '@/api';
import Auth from '@/components/Auth';
import { useCrudList } from '@/hooks/useCrudList';
import type { NoticeItem } from '@/types';

/** 表单值 */
interface NoticeFormValues {
  title: string;
  content?: string;
  type?: NoticeItem['type'];
  status?: NoticeItem['status'];
  publisher?: string;
}

export default function NoticePage() {
  const { message } = App.useApp();
  const [form] = Form.useForm<NoticeFormValues>();

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
  } = useCrudList<NoticeItem>(noticeApi.list, { keywordFields: 'title,content,publisher' });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NoticeItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /** 新增 */
  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ type: 'notice', status: 'draft' });
    setOpen(true);
  };

  /** 编辑 */
  const openEdit = (record: NoticeItem) => {
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
        await noticeApi.update(editing.id, values);
        message.success('修改成功');
      } else {
        await noticeApi.create(values);
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

  /** 删除 */
  const removeOne = async (id: string | number) => {
    await noticeApi.remove(id);
    message.success('删除成功');
    reload();
  };

  return (
    <div className="page-container">
      <Card>
        <Space wrap style={{ marginBottom: 16 }}>
          <Input.Search
            allowClear
            placeholder="搜索标题 / 内容 / 发布人"
            style={{ width: 260 }}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={setKeyword}
          />
          <Select
            allowClear
            placeholder="类型"
            style={{ width: 120 }}
            options={[
              { label: '通知', value: 'notice' },
              { label: '公告', value: 'announce' },
            ]}
            onChange={(type) => setFilters({ type })}
          />
          <Select
            allowClear
            placeholder="状态"
            style={{ width: 120 }}
            options={[
              { label: '已发布', value: 'published' },
              { label: '草稿', value: 'draft' },
            ]}
            onChange={(status) => setFilters({ status })}
          />
          <Button icon={<ReloadOutlined />} onClick={reload}>
            刷新
          </Button>
          <Auth code="content:notice:add">
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新增
            </Button>
          </Auth>
        </Space>

        <Table<NoticeItem>
          rowKey="id"
          size="medium"
          loading={loading}
          dataSource={list}
          /* 列较多，开启横向滚动；fixed 列必须配合 scroll.x 才会生效 */
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
          columns={[
            { title: '标题', dataIndex: 'title', width: 240, fixed: 'left', ellipsis: true },
            {
              title: '类型',
              dataIndex: 'type',
              width: 100,
              render: (type?: NoticeItem['type']) =>
                type === 'announce' ? <Tag color="purple">公告</Tag> : <Tag color="blue">通知</Tag>,
            },
            {
              title: '状态',
              dataIndex: 'status',
              width: 100,
              render: (status?: NoticeItem['status']) =>
                status === 'published' ? <Tag color="green">已发布</Tag> : <Tag>草稿</Tag>,
            },
            {
              title: '发布人',
              dataIndex: 'publisher',
              width: 120,
              render: (value?: string) => value ?? '-',
            },
            {
              title: '创建时间',
              dataIndex: 'createdAt',
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
                  <Auth code="content:notice:edit">
                    <Button type="link" size="small" onClick={() => openEdit(record)}>
                      编辑
                    </Button>
                  </Auth>
                  <Auth code="content:notice:delete">
                    <Popconfirm title="确认删除该公告？" onConfirm={() => removeOne(record.id)}>
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

      <Drawer
        open={open}
        title={editing ? '编辑公告' : '新增公告'}
        size={560}
        onClose={() => setOpen(false)}
        destroyOnHidden
        extra={
          <Space>
            <Button onClick={() => setOpen(false)}>取消</Button>
            <Button type="primary" loading={submitting} onClick={submit}>
              保存
            </Button>
          </Space>
        }
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
              <Form.Item name="type" label="类型">
                <Select
                  style={{ width: '100%' }}
                  options={[
                    { label: '通知', value: 'notice' },
                    { label: '公告', value: 'announce' },
                  ]}
                />
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
              <Form.Item name="publisher" label="发布人">
                <Input placeholder="请输入发布人" />
              </Form.Item>
            </Col>
            {/* 正文为长文本，单独占满整行 */}
            <Col span={24}>
              <Form.Item name="content" label="内容">
                <Input.TextArea rows={10} showCount maxLength={1000} placeholder="请输入公告内容" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Drawer>
    </div>
  );
}
