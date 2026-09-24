/**
 * 系统参数 — 关键字搜索 + 分页，支持表格 / 卡片两种视图
 * --------------------------------------------------
 * 参数只允许「修改」（不允许随意新增/删除），因此操作列只有编辑按钮。
 * 列表状态交给 useCrudList，编辑用 Modal + Form。
 */

import { ReloadOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  Modal,
  Pagination,
  Row,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
import { useState } from 'react';
import { configApi } from '@/api';
import Auth from '@/components/Auth';
import { useCrudList } from '@/hooks/useCrudList';
import type { ConfigItem } from '@/types';

/** 视图模式：表格 / 卡片 */
type ConfigView = 'table' | 'card';

/** 参数类型 */
const TYPE_OPTIONS = [
  { label: '字符串', value: 'string' },
  { label: '数字', value: 'number' },
  { label: '布尔', value: 'boolean' },
  { label: 'JSON', value: 'json' },
];

interface ConfigFormValues {
  name: string;
  key: string;
  value?: string;
  type?: string;
  remark?: string;
}

export default function ConfigPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm<ConfigFormValues>();

  const { list, total, loading, page, pageSize, setPage, setPageSize, setKeyword, reload } =
    useCrudList<ConfigItem>(configApi.list, { keywordFields: 'name,key,remark' });

  const [view, setView] = useState<ConfigView>('table');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ConfigItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const openEdit = (record: ConfigItem) => {
    setEditing(record);
    form.resetFields();
    form.setFieldsValue({
      name: record.name,
      key: record.key,
      value: record.value ?? '',
      type: record.type ?? 'string',
      remark: record.remark ?? '',
    });
    setOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    if (!editing) return;
    setSubmitting(true);
    try {
      await configApi.update(editing.id, values);
      message.success('修改成功');
      setOpen(false);
      reload();
    } catch {
      // 校验失败或请求失败：错误提示已由 request 统一处理
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <Card>
        <Space wrap style={{ marginBottom: 16 }}>
          <Input.Search
            allowClear
            placeholder="搜索参数名称 / 键名 / 备注"
            style={{ width: 260 }}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={setKeyword}
          />
          <Button icon={<ReloadOutlined />} onClick={reload}>
            刷新
          </Button>
          <Segmented<ConfigView>
            value={view}
            onChange={setView}
            options={[
              { label: '表格视图', value: 'table' },
              { label: '卡片视图', value: 'card' },
            ]}
          />
        </Space>

        {view === 'table' ? (
          <Table<ConfigItem>
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
            columns={[
              { title: '参数名称', dataIndex: 'name', width: 180, fixed: 'left' },
              {
                title: '参数键名',
                dataIndex: 'key',
                width: 200,
                ellipsis: true,
                render: (key: string) => <Tag>{key}</Tag>,
              },
              {
                title: '参数值',
                dataIndex: 'value',
                width: 220,
                ellipsis: true,
                render: (value?: string) => value || '-',
              },
              {
                title: '类型',
                dataIndex: 'type',
                width: 100,
                render: (type?: string) => (type ? <Tag color="blue">{type}</Tag> : '-'),
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
                width: 90,
                fixed: 'right',
                render: (_, record) => (
                  <Auth code="system:config:edit">
                    <Button type="link" size="small" onClick={() => openEdit(record)}>
                      编辑
                    </Button>
                  </Auth>
                ),
              },
            ]}
          />
        ) : (
          <>
            <Row gutter={[16, 16]}>
              {list.map((item) => (
                <Col key={item.id} xs={24} sm={12} lg={8} xxl={6}>
                  <Card
                    size="small"
                    title={item.name}
                    extra={
                      <Auth code="system:config:edit">
                        <Button type="link" size="small" onClick={() => openEdit(item)}>
                          编辑
                        </Button>
                      </Auth>
                    }
                  >
                    <Descriptions
                      column={1}
                      size="small"
                      items={[
                        { key: 'key', label: '参数键名', children: <Tag>{item.key}</Tag> },
                        { key: 'value', label: '参数值', children: item.value || '-' },
                        {
                          key: 'type',
                          label: '类型',
                          children: item.type ? <Tag color="blue">{item.type}</Tag> : '-',
                        },
                        { key: 'remark', label: '备注', children: item.remark || '-' },
                      ]}
                    />
                  </Card>
                </Col>
              ))}
            </Row>
            <Pagination
              style={{ marginTop: 16, textAlign: 'right' }}
              current={page}
              pageSize={pageSize}
              total={total}
              showSizeChanger
              showTotal={(value) => `共 ${value} 条`}
              onChange={(current, size) => {
                setPage(current);
                setPageSize(size);
              }}
            />
          </>
        )}
      </Card>

      <Modal
        open={open}
        title={editing ? `编辑参数：${editing.name}` : '编辑参数'}
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
                label="参数名称"
                rules={[{ required: true, message: '请输入参数名称' }]}
              >
                <Input placeholder="请输入参数名称" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="key"
                label="参数键名"
                rules={[{ required: true, message: '请输入参数键名' }]}
              >
                <Input placeholder="如：site.title" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="value" label="参数值">
                <Input.TextArea rows={3} placeholder="请输入参数值" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="type" label="类型">
                <Select style={{ width: '100%' }} options={TYPE_OPTIONS} />
              </Form.Item>
            </Col>
            {/* 备注为长文本，单独占满整行 */}
            <Col span={24}>
              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={2} placeholder="请输入备注" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
