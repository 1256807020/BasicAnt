/**
 * 网站设置 — SEO / 社交联系方式等「全局展示类」配置的完整增删改查
 * --------------------------------------------------
 * 与「系统参数」（只允许修改）不同：设置项支持新增/编辑/删除/批量删除，
 * 按分组（site/seo/contact）管理，停用的项不会出现在公开接口 /settings/public 里。
 * 安全类配置（上传大小/存储开关）不在这里，只走后端环境变量。
 */

import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
} from 'antd';
import { useState, type Key } from 'react';
import { settingsApi } from '@/api';
import Auth from '@/components/Auth';
import { useCrudList } from '@/hooks/useCrudList';
import type { SettingItem } from '@/types';

/** 分组选项（与后端 seed 的 group 对应，可扩展） */
const GROUP_OPTIONS = [
  { label: '站点', value: 'site' },
  { label: 'SEO', value: 'seo' },
  { label: '联系方式', value: 'contact' },
];

const GROUP_COLOR: Record<string, string> = {
  site: 'blue',
  seo: 'purple',
  contact: 'green',
};

interface SettingFormValues {
  name: string;
  key: string;
  value?: string;
  group?: string;
  sort?: number;
  status?: number;
  remark?: string;
}

export default function SettingsPage() {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<SettingFormValues>();

  const { list, total, loading, page, pageSize, setPage, setPageSize, setKeyword, reload } =
    useCrudList<SettingItem>(settingsApi.list, { keywordFields: 'name,key,value,remark' });

  const [groupFilter, setGroupFilter] = useState<string | undefined>();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SettingItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Key[]>([]);

  /** 过滤条件变化（关键字外的额外参数走 reload 的覆盖） */
  const reloadWithGroup = (group?: string) => {
    setGroupFilter(group);
    reload({ group });
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ group: groupFilter || 'site', sort: 0, status: 1 });
    setOpen(true);
  };

  const openEdit = (record: SettingItem) => {
    setEditing(record);
    form.resetFields();
    form.setFieldsValue({
      name: record.name,
      key: record.key,
      value: record.value ?? '',
      group: record.group ?? 'site',
      sort: record.sort ?? 0,
      status: record.status ?? 1,
      remark: record.remark ?? '',
    });
    setOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      if (editing) {
        await settingsApi.update(editing.id, values);
        message.success('修改成功');
      } else {
        await settingsApi.create(values);
        message.success('新增成功');
      }
      setOpen(false);
      reload();
    } catch {
      // 错误提示已由 request 拦截器统一处理（如键名重复 409）
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (record: SettingItem) => {
    await settingsApi.remove(record.id);
    message.success('删除成功');
    reload();
  };

  const batchRemove = () => {
    const ids = selectedKeys as string[];
    modal.confirm({
      title: `确认删除选中的 ${ids.length} 项设置？`,
      content: '删除后公开接口将不再返回对应配置，线上展示立即生效。',
      okButtonProps: { danger: true },
      onOk: async () => {
        await settingsApi.batchRemove(ids);
        message.success('批量删除成功');
        setSelectedKeys([]);
        reload();
      },
    });
  };

  return (
    <div className="page-container">
      <Card>
        <Space wrap style={{ marginBottom: 16 }}>
          <Input.Search
            allowClear
            placeholder="搜索名称 / 键名 / 值 / 备注"
            style={{ width: 260 }}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={setKeyword}
          />
          <Select
            allowClear
            placeholder="全部分组"
            style={{ width: 140 }}
            options={GROUP_OPTIONS}
            value={groupFilter}
            onChange={reloadWithGroup}
          />
          <Button icon={<ReloadOutlined />} onClick={() => reload()}>
            刷新
          </Button>
          <Auth code="system:settings:add">
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新增设置
            </Button>
          </Auth>
          <Auth code="system:settings:delete">
            <Button danger disabled={!selectedKeys.length} onClick={batchRemove}>
              批量删除{selectedKeys.length ? `（${selectedKeys.length}）` : ''}
            </Button>
          </Auth>
        </Space>

        <Table<SettingItem>
          rowKey="id"
          loading={loading}
          dataSource={list}
          rowSelection={{ selectedRowKeys: selectedKeys, onChange: setSelectedKeys }}
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
            { title: '名称', dataIndex: 'name', width: 160, fixed: 'left' },
            {
              title: '键名',
              dataIndex: 'key',
              width: 180,
              ellipsis: true,
              render: (key: string) => <Tag>{key}</Tag>,
            },
            {
              title: '值',
              dataIndex: 'value',
              width: 220,
              ellipsis: true,
              render: (value?: string) => value || '-',
            },
            {
              title: '分组',
              dataIndex: 'group',
              width: 100,
              render: (group?: string) => (
                <Tag color={GROUP_COLOR[group] || 'default'}>{group || '-'}</Tag>
              ),
            },
            { title: '排序', dataIndex: 'sort', width: 70 },
            {
              title: '启用',
              dataIndex: 'status',
              width: 80,
              render: (status?: number) => (
                <Tag color={status === 1 ? 'success' : 'default'}>
                  {status === 1 ? '启用' : '停用'}
                </Tag>
              ),
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
              width: 130,
              fixed: 'right',
              render: (_, record) => (
                <Space size={0}>
                  <Auth code="system:settings:edit">
                    <Button type="link" size="small" onClick={() => openEdit(record)}>
                      编辑
                    </Button>
                  </Auth>
                  <Auth code="system:settings:delete">
                    <Popconfirm title="确认删除该项设置？" onConfirm={() => remove(record)}>
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
        title={editing ? `编辑设置：${editing.name || editing.key}` : '新增设置'}
        onCancel={() => setOpen(false)}
        onOk={submit}
        confirmLoading={submitting}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" autoComplete="off">
          <Form.Item
            name="name"
            label="设置名称"
            rules={[{ required: true, message: '请输入设置名称' }]}
          >
            <Input placeholder="如：网站名称" />
          </Form.Item>
          <Form.Item
            name="key"
            label="键名"
            rules={[
              { required: true, message: '请输入键名' },
              {
                pattern: /^[a-zA-Z][\w.-]*$/,
                message: '字母开头，仅含字母/数字/./_/-（如 site.name）',
              },
            ]}
          >
            <Input placeholder="如：site.name" disabled={!!editing} />
          </Form.Item>
          <Form.Item name="value" label="设置值">
            <Input.TextArea rows={3} placeholder="如：ReactAdmin 管理系统" />
          </Form.Item>
          <Form.Item name="group" label="分组" rules={[{ required: true, message: '请选择分组' }]}>
            <Select options={GROUP_OPTIONS} />
          </Form.Item>
          <Space size="large">
            <Form.Item name="sort" label="排序">
              <InputNumber min={0} max={9999} style={{ width: 120 }} />
            </Form.Item>
            <Form.Item name="status" label="启用" valuePropName="checked">
              <Switch
                checkedChildren="启用"
                unCheckedChildren="停用"
                onChange={(checked) => form.setFieldValue('status', checked ? 1 : 0)}
              />
            </Form.Item>
          </Space>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="选填" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
