/**
 * 通用数据 — 数据管理模块
 * --------------------------------------------------
 * 简洁 CRUD：关键字搜索 + 表格 + 新增/编辑 + 删除
 * 按钮级权限：data:table:add / data:table:edit / data:table:delete
 */

import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Space,
  Table,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { tableApi } from '@/api';
import Auth from '@/components/Auth';
import { useCrudList } from '@/hooks/useCrudList';
import type { TableItem } from '@/types';

/** 表单值 */
interface TableFormValues {
  title: string;
  content?: string;
}

export default function DataTablePage() {
  const { message } = App.useApp();
  const [form] = Form.useForm<TableFormValues>();

  const { list, total, loading, page, pageSize, setPage, setPageSize, setKeyword, reload } =
    useCrudList<TableItem>(tableApi.list, { keywordFields: 'title,content' });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TableItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /** 新增 */
  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  };

  /** 编辑 */
  const openEdit = (record: TableItem) => {
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
        await tableApi.update(editing.id, values);
        message.success('修改成功');
      } else {
        await tableApi.create(values);
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
    await tableApi.remove(id);
    message.success('删除成功');
    reload();
  };

  return (
    <div className="page-container">
      <Typography.Title level={4} style={{ margin: 0 }}>
        通用数据
      </Typography.Title>

      <Card>
        <Space wrap style={{ marginBottom: 16 }}>
          <Input.Search
            allowClear
            placeholder="搜索标题 / 内容"
            style={{ width: 260 }}
            onSearch={setKeyword}
          />
          <Button icon={<ReloadOutlined />} onClick={reload}>
            刷新
          </Button>
          <Auth code="data:table:add">
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新增
            </Button>
          </Auth>
        </Space>

        <Table<TableItem>
          rowKey="id"
          size="middle"
          loading={loading}
          dataSource={list}
          /* 有 fixed 列必须设置 scroll.x，否则固定列不生效 */
          scroll={{ x: 700 }}
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
              title: '内容',
              dataIndex: 'content',
              ellipsis: true,
              render: (value?: string) => value ?? '-',
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
                  <Auth code="data:table:edit">
                    <Button type="link" size="small" onClick={() => openEdit(record)}>
                      编辑
                    </Button>
                  </Auth>
                  <Auth code="data:table:delete">
                    <Popconfirm title="确认删除该数据？" onConfirm={() => removeOne(record.id)}>
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
        title={editing ? '编辑数据' : '新增数据'}
        /* 字段较少，宽度取 720 */
        width={720}
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
            {/* 内容为长文本，单独占满整行 */}
            <Col span={24}>
              <Form.Item name="content" label="内容">
                <Input.TextArea rows={4} placeholder="请输入内容" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
