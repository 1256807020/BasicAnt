/**
 * 岗位管理
 * --------------------------------------------------
 * 岗位（position）与角色（role）的区别：
 *   岗位 = 组织职务（技术总监、前端工程师），描述「人是什么职位」
 *   角色 = 权限集合（管理员、部门经理），描述「人能做什么」
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
import { useState } from 'react';
import { postApi } from '@/api';
import { useCrudList } from '@/hooks/useCrudList';
import type { PostItem } from '@/types';
import Auth from '@/components/Auth';

/** 状态：后端用 '1' 启用 / '0' 禁用 */
const STATUS_OPTIONS = [
  { label: '启用', value: '1' },
  { label: '禁用', value: '0' },
];

interface PostFormValues {
  name: string;
  code: string;
  sort?: number;
  status?: string;
  remark?: string;
}

export default function PostListPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm<PostFormValues>();

  const { list, total, loading, page, pageSize, setPage, setPageSize, setKeyword, reload } =
    useCrudList<PostItem>(postApi.list, { keywordFields: 'name,code' });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PostItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ status: '1', sort: 0 });
    setOpen(true);
  };

  const openEdit = (record: PostItem) => {
    setEditing(record);
    form.setFieldsValue(record);
    setOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      if (editing) {
        await postApi.update(editing.id, values);
        message.success('修改成功');
      } else {
        await postApi.create(values);
        message.success('新增成功');
      }
      setOpen(false);
      reload();
    } catch {
      // 统一提示已处理
    } finally {
      setSubmitting(false);
    }
  };

  const removeOne = async (id: string | number) => {
    await postApi.remove(id);
    message.success('删除成功');
    reload();
  };

  const removeMany = async () => {
    if (!selectedKeys.length) return;
    await postApi.batchRemove(selectedKeys);
    setSelectedKeys([]);
    message.success(`已删除 ${selectedKeys.length} 条`);
    reload();
  };

  return (
    <div className="page-container">
      <Card>
        <Space wrap style={{ marginBottom: 16 }}>
          <Input.Search
            allowClear
            placeholder="搜索岗位名称 / 编码"
            style={{ width: 240 }}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={setKeyword}
          />
          <Button icon={<ReloadOutlined />} onClick={reload}>
            刷新
          </Button>
          <Auth code="system:post:add">
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新增
            </Button>
          </Auth>
          <Auth code="system:post:delete">
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

        <Table<PostItem>
          rowKey={(record) => String(record.id)}
          loading={loading}
          dataSource={list}
          /* 列较多：开启横向滚动，fixed 列需配合 scroll.x 才生效 */
          scroll={{ x: 900 }}
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
            { title: '岗位名称', dataIndex: 'name', width: 180, fixed: 'left' },
            { title: '岗位编码', dataIndex: 'code', width: 160, ellipsis: true },
            { title: '排序', dataIndex: 'sort', width: 80 },
            {
              title: '状态',
              dataIndex: 'status',
              width: 90,
              render: (value?: string) =>
                value === '0' ? <Tag color="red">禁用</Tag> : <Tag color="green">启用</Tag>,
            },
            {
              title: '备注',
              dataIndex: 'remark',
              ellipsis: true,
              render: (v?: string) => v || '-',
            },
            {
              title: '操作',
              key: 'action',
              width: 140,
              fixed: 'right',
              render: (_, record) => (
                <Space size="small">
                  <Auth code="system:post:edit">
                    <Button type="link" size="small" onClick={() => openEdit(record)}>
                      编辑
                    </Button>
                  </Auth>
                  <Auth code="system:post:delete">
                    <Popconfirm title="确认删除该岗位？" onConfirm={() => removeOne(record.id)}>
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
        title={editing ? '编辑岗位' : '新增岗位'}
        onCancel={() => setOpen(false)}
        onOk={submit}
        confirmLoading={submitting}
        width={800}
        /* 字段较多：限制表单区最大高度，小屏内部滚动 */
        styles={{ body: { maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' } }}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" autoComplete="off">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="name"
                label="岗位名称"
                rules={[{ required: true, message: '请输入岗位名称' }]}
              >
                <Input placeholder="如：前端工程师" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="code"
                label="岗位编码"
                rules={[{ required: true, message: '请输入岗位编码' }]}
              >
                <Input placeholder="如：FE" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="sort" label="排序">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="status" label="状态">
                <Select
                  style={{ width: '100%' }}
                  options={STATUS_OPTIONS}
                  placeholder="请选择状态"
                />
              </Form.Item>
            </Col>
            {/* 备注为长文本，单独占满整行 */}
            <Col span={24}>
              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={3} placeholder="岗位说明" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
