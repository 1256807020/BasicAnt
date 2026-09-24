/**
 * 标签管理（动手练示例）
 * --------------------------------------------------
 * 这是「极简 CRUD 模板」的忠实复刻：搜索 + 表格 + Modal 增改 + 删除。
 * 与 data/table 的唯一区别：api 换成 tagApi，字段换成 name / remark。
 * 照抄这一份，你就掌握了本框架 90% 页面的写法。
 */

import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { App, Button, Card, Form, Input, Modal, Popconfirm, Space, Table, Typography } from 'antd';
import { useState } from 'react';
import { tagApi } from '@/api';
import Auth from '@/components/Auth';
import { useCrudList } from '@/hooks/useCrudList';
import type { TagItem } from '@/types';

interface TagFormValues {
  name: string;
  remark?: string;
}

export default function TagListPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm<TagFormValues>();

  // ① 列表逻辑：一个 Hook 包揽分页 / 关键字 / 刷新，业务只关心 fetcher
  const { list, total, loading, page, pageSize, setPage, setPageSize, setKeyword, reload } =
    useCrudList<TagItem>(tagApi.list, { keywordFields: 'name,remark' });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TagItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /** 新增：清空表单 */
  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  };

  /** 编辑：回填记录 */
  const openEdit = (record: TagItem) => {
    setEditing(record);
    form.setFieldsValue(record);
    setOpen(true);
  };

  /** 提交：靠 editing 区分新增 / 修改 */
  const submit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      if (editing) {
        await tagApi.update(editing.id, values);
        message.success('修改成功');
      } else {
        await tagApi.create(values);
        message.success('新增成功');
      }
      setOpen(false);
      reload();
    } catch {
      // 校验失败或请求异常已由拦截器统一提示
    } finally {
      setSubmitting(false);
    }
  };

  /** 删除 */
  const removeOne = async (id: string | number) => {
    await tagApi.remove(id);
    message.success('删除成功');
    reload();
  };

  return (
    <div className="page-container">
      <Typography.Title level={4} style={{ margin: 0 }}>
        标签管理
      </Typography.Title>

      <Card>
        <Space wrap style={{ marginBottom: 16 }}>
          <Input.Search
            allowClear
            placeholder="搜索名称 / 备注"
            style={{ width: 260 }}
            onSearch={setKeyword}
          />
          <Button icon={<ReloadOutlined />} onClick={reload}>
            刷新
          </Button>
          <Auth code="content:tag:add">
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新增
            </Button>
          </Auth>
        </Space>

        <Table<TagItem>
          rowKey="id"
          size="medium"
          loading={loading}
          dataSource={list}
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
            { title: '名称', dataIndex: 'name', width: 200, fixed: 'left', ellipsis: true },
            {
              title: '备注',
              dataIndex: 'remark',
              ellipsis: true,
              render: (value?: string) => value ?? '-',
            },
            {
              title: '操作',
              key: 'action',
              width: 140,
              fixed: 'right',
              render: (_, record) => (
                <Space size="small">
                  <Auth code="content:tag:edit">
                    <Button type="link" size="small" onClick={() => openEdit(record)}>
                      编辑
                    </Button>
                  </Auth>
                  <Auth code="content:tag:delete">
                    <Popconfirm title="确认删除该标签？" onConfirm={() => removeOne(record.id)}>
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
        title={editing ? '编辑标签' : '新增标签'}
        width={720}
        onCancel={() => setOpen(false)}
        onOk={submit}
        confirmLoading={submitting}
        destroyOnHidden
        styles={{ body: { maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' } }}
      >
        <Form form={form} layout="vertical" autoComplete="off">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="请输入标签名称" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
