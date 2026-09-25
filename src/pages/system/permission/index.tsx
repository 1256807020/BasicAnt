/**
 * 权限管理 — 菜单 / 按钮 / 接口权限树 CRUD
 * --------------------------------------------------
 * 后端 /api/rbac/permissions 支持 tree=1 直接返回嵌套结构，
 * 前端用 antd Table 的树形模式渲染，并在此维护新增 / 编辑 / 删除。
 */

import { DownOutlined, PlusOutlined, ReloadOutlined, UpOutlined } from '@ant-design/icons';
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
  Switch,
  Table,
  Tag,
  TreeSelect,
} from 'antd';
import { formatUtc } from '@/utils/time';
import { useMemo, useState } from 'react';
import { useRequest } from 'ahooks';
import Auth from '@/components/Auth';
import { createPermission, deletePermission, fetchPermissionTree, updatePermission } from '@/api';
import type { MenuType, PermissionItem } from '@/types';
import type { TableColumnsType } from 'antd';

/** 权限类型 → Tag 颜色与中文名 */
const TYPE_META: Record<MenuType, { color: string; label: string }> = {
  menu: { color: 'blue', label: '菜单' },
  button: { color: 'green', label: '按钮' },
  api: { color: 'purple', label: '接口' },
};

/** 新增 / 编辑表单值 */
interface PermissionFormValues {
  name: string;
  code: string;
  type: MenuType;
  /** 统一为字符串，避免与后端 number 类型的 id 比对失败导致回显裸 id */
  parentId?: string | null;
  path?: string;
  icon?: string;
  sort?: number;
  status?: string;
}

/** TreeSelect / Tree 需要的节点结构（value 统一字符串） */
interface PermissionOption {
  title: string;
  value: string;
  disabled?: boolean;
  children?: PermissionOption[];
}

/** 判断节点是否命中关键字（名称 / 权限码 / 路由） */
function matchKeyword(node: PermissionItem, keyword: string): boolean {
  if (!keyword) return true;
  const text = keyword.trim().toLowerCase();
  if (!text) return true;
  return (
    node.name.toLowerCase().includes(text) ||
    node.code.toLowerCase().includes(text) ||
    (node.path ?? '').toLowerCase().includes(text)
  );
}

/** 按关键字与类型过滤权限树：命中节点保留整棵子树，未命中但有命中子级则保留骨架 */
function filterTree(nodes: PermissionItem[], keyword: string, type?: MenuType): PermissionItem[] {
  const result: PermissionItem[] = [];
  nodes.forEach((node) => {
    const children = filterTree(node.children ?? [], keyword, type);
    const selfMatched = matchKeyword(node, keyword) && (!type || node.type === type);
    if (selfMatched) {
      result.push(node);
      return;
    }
    if (children.length) {
      result.push({ ...node, children });
    }
  });
  return result;
}

/** 收集所有可展开节点的 key（含子级，用于「展开全部」） */
function collectExpandableKeys(nodes: PermissionItem[]): string[] {
  return nodes.flatMap((node) => {
    const own = node.children?.length ? [String(node.id)] : [];
    return [...own, ...collectExpandableKeys(node.children ?? [])];
  });
}

/** 收集某节点的全部后代 id（编辑时不允许把上级改成自己的后代） */
function collectDescendantIds(node: PermissionItem): string[] {
  return (node.children ?? []).flatMap((child) => [
    String(child.id),
    ...collectDescendantIds(child),
  ]);
}

/** 权限树 → TreeSelect 数据；forbidden 中的节点禁用 */
function toParentOptions(
  nodes: PermissionItem[],
  forbidden: ReadonlySet<string>,
): PermissionOption[] {
  return nodes.map((node) => {
    const children = node.children?.length ? toParentOptions(node.children, forbidden) : undefined;
    const option: PermissionOption = { title: node.name, value: String(node.id), children };
    return forbidden.has(String(node.id)) ? { ...option, disabled: true } : option;
  });
}

export default function PermissionListPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm<PermissionFormValues>();

  const treeRequest = useRequest(fetchPermissionTree);

  const tree = useMemo<PermissionItem[]>(() => treeRequest.data ?? [], [treeRequest.data]);

  const [keyword, setKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState<MenuType | undefined>(undefined);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PermissionItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /** 过滤后的树，直接作为 Table 的 dataSource */
  const dataSource = useMemo(
    () => filterTree(tree, keyword, typeFilter),
    [tree, keyword, typeFilter],
  );

  /** 编辑时不可选的上级：自己 + 全部后代 */
  const forbiddenIds = useMemo<ReadonlySet<string>>(() => {
    if (!editing) return new Set<string>();
    return new Set([String(editing.id), ...collectDescendantIds(editing)]);
  }, [editing]);

  const parentOptions = useMemo(() => toParentOptions(tree, forbiddenIds), [tree, forbiddenIds]);

  const reload = () => {
    treeRequest.refresh();
  };

  const openCreate = (parentId: string | number | null = null) => {
    setEditing(null);
    form.resetFields();
    // parentId 统一转字符串，保证与 TreeSelect 的 option.value 类型一致
    form.setFieldsValue({
      parentId: parentId === null ? null : String(parentId),
      type: 'menu',
      sort: 0,
      status: 'active',
    });
    setOpen(true);
  };

  const openEdit = (record: PermissionItem) => {
    setEditing(record);
    form.resetFields();
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      type: record.type,
      parentId:
        record.parentId === null || record.parentId === undefined ? null : String(record.parentId),
      path: record.path ?? undefined,
      icon: record.icon ?? undefined,
      sort: record.sort ?? 0,
      status: record.status === 'disabled' ? 'disabled' : 'active',
    });
    setOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      if (editing) {
        await updatePermission(editing.id, values);
        message.success('修改成功');
      } else {
        await createPermission(values);
        message.success('新增成功');
      }
      setOpen(false);
      reload();
    } catch {
      // 校验失败或请求失败：提示已由 request 层统一处理
    } finally {
      setSubmitting(false);
    }
  };

  const removeOne = async (id: string | number) => {
    try {
      await deletePermission(id);
      message.success('删除成功');
      reload();
    } catch {
      // 后端会携带具体原因，错误提示已统一展示
    }
  };

  const columns: TableColumnsType<PermissionItem> = [
    // 首列固定左侧，配合 scroll.x 生效
    { title: '名称', dataIndex: 'name', width: 200, fixed: 'left', ellipsis: true },
    { title: '权限码', dataIndex: 'code', width: 220, ellipsis: true },
    {
      title: '类型',
      dataIndex: 'type',
      width: 90,
      render: (type: MenuType) => {
        const meta = TYPE_META[type] ?? { color: 'default', label: type };
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: '路由地址',
      dataIndex: 'path',
      width: 200,
      ellipsis: true,
      render: (path?: string) => path || '-',
    },
    {
      title: '图标',
      dataIndex: 'icon',
      width: 120,
      render: (icon?: string) => icon || '-',
    },
    { title: '排序', dataIndex: 'sort', width: 80 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (status?: string) =>
        status === 'disabled' ? <Tag color="red">禁用</Tag> : <Tag color="green">启用</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (value?: string) => formatUtc(value),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Auth code="system:permission:add">
            <Button type="link" size="small" onClick={() => openCreate(record.id)}>
              新增子权限
            </Button>
          </Auth>
          <Auth code="system:permission:edit">
            <Button type="link" size="small" onClick={() => openEdit(record)}>
              编辑
            </Button>
          </Auth>
          <Auth code="system:permission:delete">
            <Popconfirm
              title="确认删除该权限？子权限会一并删除"
              onConfirm={() => removeOne(record.id)}
            >
              <Button type="link" size="small" danger>
                删除
              </Button>
            </Popconfirm>
          </Auth>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <Card>
        <Space wrap style={{ marginBottom: 16 }}>
          <Input.Search
            allowClear
            placeholder="搜索名称 / 权限码 / 路由"
            style={{ width: 240 }}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={setKeyword}
          />
          <Select
            allowClear
            placeholder="类型"
            style={{ width: 120 }}
            value={typeFilter}
            options={[
              { label: '菜单', value: 'menu' },
              { label: '按钮', value: 'button' },
              { label: '接口', value: 'api' },
            ]}
            onChange={(value?: MenuType) => setTypeFilter(value)}
          />
          <Button
            icon={<DownOutlined />}
            onClick={() => setExpandedKeys(collectExpandableKeys(dataSource))}
          >
            展开全部
          </Button>
          <Button icon={<UpOutlined />} onClick={() => setExpandedKeys([])}>
            收起全部
          </Button>
          <Button icon={<ReloadOutlined />} onClick={reload}>
            刷新
          </Button>
          <Auth code="system:permission:add">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreate()}>
              新增顶级权限
            </Button>
          </Auth>
        </Space>

        <Table<PermissionItem>
          rowKey={(record) => String(record.id)}
          size="medium"
          loading={treeRequest.loading}
          dataSource={dataSource}
          columns={columns}
          pagination={false}
          // 列较多：开启横向滚动，保证 fixed 列生效
          scroll={{ x: 1400 }}
          expandable={{
            expandedRowKeys: expandedKeys,
            onExpandedRowsChange: (keys) => setExpandedKeys(keys.map(String)),
          }}
        />
      </Card>

      <Modal
        open={open}
        title={editing ? '编辑权限' : '新增权限'}
        onCancel={() => setOpen(false)}
        onOk={submit}
        confirmLoading={submitting}
        destroyOnHidden
        width={800}
        styles={{ body: { maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' } }}
      >
        <Form form={form} layout="vertical" autoComplete="off">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="name"
                label="名称"
                rules={[{ required: true, message: '请输入权限名称' }]}
              >
                <Input placeholder="如：用户管理" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="code"
                label="权限码"
                rules={[{ required: true, message: '请输入权限码' }]}
                tooltip="按钮级鉴权使用，如 system:user:add"
              >
                <Input placeholder="如：system:user:list" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="type"
                label="类型"
                tooltip="「接口」为预留类型：当前仅作分类存储，供后端接口级鉴权（Nest requirePerm）使用，前端不消费"
                rules={[{ required: true, message: '请选择权限类型' }]}
              >
                <Select
                  style={{ width: '100%' }}
                  options={[
                    { label: '菜单', value: 'menu' },
                    { label: '按钮', value: 'button' },
                    { label: '接口', value: 'api' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="parentId"
                label="上级权限"
                rules={[
                  {
                    validator: (_rule, value: string | null | undefined) => {
                      if (!editing || value === null || value === undefined)
                        return Promise.resolve();
                      if (String(value) === String(editing.id)) {
                        return Promise.reject(new Error('上级权限不能是自己'));
                      }
                      if (forbiddenIds.has(String(value))) {
                        return Promise.reject(new Error('上级权限不能是自己的子级'));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <TreeSelect
                  allowClear
                  showSearch
                  style={{ width: '100%' }}
                  treeDefaultExpandAll
                  treeNodeFilterProp="title"
                  placeholder="顶级权限"
                  treeData={parentOptions}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="path" label="路由地址">
                <Input placeholder="如：/system/user" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="icon" label="图标" tooltip="antd 图标名，如 UserOutlined">
                <Input placeholder="如：UserOutlined" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="sort" label="排序">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="status"
                label="状态"
                valuePropName="checked"
                getValueProps={(value: unknown) => ({ checked: value !== 'disabled' })}
                normalize={(checked: unknown) => (checked ? 'active' : 'disabled')}
              >
                <Switch checkedChildren="启用" unCheckedChildren="禁用" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
