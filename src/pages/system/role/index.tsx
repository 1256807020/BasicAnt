/**
 * 角色管理（RBAC 枢纽）
 * --------------------------------------------------
 * 一个角色三件事：
 *   1. 配置数据范围（全部 / 本部门及以下 / 本部门 / 仅本人）
 *   2. 分配权限（勾选权限树，写入 role_permission）
 *   3. 分配用户（勾选用户，写入 user.roleIds）
 */

import {
  PlusOutlined,
  ReloadOutlined,
  SafetyOutlined,
  SearchOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Col,
  Drawer,
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
  Tooltip,
  Tree,
  Typography,
  type TreeDataNode,
} from 'antd';
import { useMemo, useState } from 'react';
import { useRequest } from 'ahooks';
import {
  assignRoleUsers,
  createRole,
  deleteRole,
  fetchPermissionTree,
  fetchRolePermissions,
  fetchRoleUsers,
  fetchRoles,
  fetchUsers,
  saveRolePermissions,
  updateRole,
} from '@/api/rbac';
import type { DataScope, PermissionItem, RoleItem, UserItem } from '@/types';
import Auth from '@/components/Auth';

interface RoleFormValues {
  name: string;
  code: string;
  description?: string;
  dataScope: DataScope;
  status: string;
  sort?: number;
}

const DATA_SCOPE_OPTIONS = [
  { label: '全部数据', value: 'all' },
  { label: '本部门及以下', value: 'deptAndBelow' },
  { label: '本部门', value: 'dept' },
  { label: '仅本人', value: 'self' },
];

const DATA_SCOPE_TAG: Record<string, { text: string; color: string }> = {
  all: { text: '全部数据', color: 'blue' },
  deptAndBelow: { text: '本部门及以下', color: 'cyan' },
  dept: { text: '本部门', color: 'orange' },
  self: { text: '仅本人', color: 'default' },
};

/** 权限树 → antd Tree 数据 */
const toPermissionTreeData = (nodes: PermissionItem[]): TreeDataNode[] =>
  nodes.map((node) => ({
    key: String(node.id),
    title: `${node.name}（${node.code}）`,
    children: node.children?.length ? toPermissionTreeData(node.children) : undefined,
  }));

/** 递归收集所有权限 id */
const collectKeys = (nodes: PermissionItem[]): string[] =>
  nodes.reduce<string[]>(
    (acc, node) => [
      ...acc,
      String(node.id),
      ...(node.children?.length ? collectKeys(node.children) : []),
    ],
    [],
  );

export default function RoleListPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm<RoleFormValues>();

  const [keyword, setKeyword] = useState('');
  const { data: roles, loading, refresh } = useRequest(() => fetchRoles({ keyword }));

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RoleItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /* ---------- 分配权限 ---------- */
  const [permDrawer, setPermDrawer] = useState(false);
  const [permTarget, setPermTarget] = useState<RoleItem | null>(null);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [permSaving, setPermSaving] = useState(false);

  const { data: permissionTree } = useRequest(fetchPermissionTree);
  const permTreeData = useMemo(() => toPermissionTreeData(permissionTree ?? []), [permissionTree]);
  const allPermKeys = useMemo(() => collectKeys(permissionTree ?? []), [permissionTree]);

  /* ---------- 分配用户 ---------- */
  const [userDrawer, setUserDrawer] = useState(false);
  const [userTarget, setUserTarget] = useState<RoleItem | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSaving, setUserSaving] = useState(false);

  const { data: allUsers } = useRequest(() => fetchUsers({ pageSize: 500 }));
  const userOptions = useMemo(
    () =>
      (allUsers?.list ?? []).map((u: UserItem) => ({
        label: `${u.nickname ?? u.username}（${u.username}）`,
        value: String(u.id),
      })),
    [allUsers],
  );

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ dataScope: 'self', status: '1', sort: 0 });
    setOpen(true);
  };

  const openEdit = (record: RoleItem) => {
    setEditing(record);
    form.setFieldsValue(record);
    setOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      if (editing) {
        await updateRole(editing.id, values);
        message.success('修改成功');
      } else {
        await createRole(values);
        message.success('新增成功');
      }
      setOpen(false);
      refresh();
    } catch {
      // 统一提示已处理
    } finally {
      setSubmitting(false);
    }
  };

  const openAssignPermissions = async (record: RoleItem) => {
    setPermTarget(record);
    const ids = await fetchRolePermissions(record.id);
    setCheckedKeys(ids.map(String));
    setExpandedKeys(allPermKeys);
    setPermDrawer(true);
  };

  const savePermissions = async () => {
    if (!permTarget) return;
    setPermSaving(true);
    try {
      await saveRolePermissions(permTarget.id, checkedKeys);
      message.success('权限分配成功');
      setPermDrawer(false);
      refresh();
    } catch {
      // 统一提示已处理
    } finally {
      setPermSaving(false);
    }
  };

  const openAssignUsers = async (record: RoleItem) => {
    setUserTarget(record);
    const list = await fetchRoleUsers(record.id);
    setSelectedUserIds(list.map((u) => String(u.id)));
    setUserDrawer(true);
  };

  const saveUsers = async () => {
    if (!userTarget) return;
    setUserSaving(true);
    try {
      await assignRoleUsers(userTarget.id, selectedUserIds);
      message.success('用户分配成功');
      setUserDrawer(false);
      refresh();
    } catch {
      // 统一提示已处理
    } finally {
      setUserSaving(false);
    }
  };

  const removeOne = async (id: string | number) => {
    await deleteRole(id);
    message.success('删除成功');
    refresh();
  };

  return (
    <div className="page-container">
      <Typography.Title level={4} style={{ margin: 0 }}>
        角色管理
      </Typography.Title>

      <Card>
        <Space wrap style={{ marginBottom: 16 }}>
          <Input
            allowClear
            placeholder="搜索角色名称 / 编码"
            style={{ width: 240 }}
            suffix={<SearchOutlined />}
            onPressEnter={(e) => setKeyword((e.target as HTMLInputElement).value)}
          />
          <Button icon={<ReloadOutlined />} onClick={refresh}>
            刷新
          </Button>
          <Auth code="system:role:add">
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新增角色
            </Button>
          </Auth>
        </Space>

        <Table<RoleItem>
          rowKey="id"
          loading={loading}
          dataSource={roles ?? []}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (v) => `共 ${v} 条` }}
          // 列较多：开启横向滚动，并固定首列与操作列（fixed 必须配合 scroll.x 才生效）
          scroll={{ x: 1200 }}
          columns={[
            { title: '角色名称', dataIndex: 'name', width: 140, fixed: 'left' },
            { title: '角色编码', dataIndex: 'code', width: 130, ellipsis: true },
            {
              title: '数据范围',
              dataIndex: 'dataScope',
              width: 130,
              render: (value?: string) => {
                const item = DATA_SCOPE_TAG[value ?? 'self'];
                return <Tag color={item?.color}>{item?.text ?? value}</Tag>;
              },
            },
            {
              title: '权限数',
              dataIndex: 'permissionCount',
              width: 90,
              render: (value?: number) => <Tag color="green">{value ?? 0}</Tag>,
            },
            {
              title: '用户数',
              dataIndex: 'userCount',
              width: 90,
              render: (value?: number) => <Tag color="blue">{value ?? 0}</Tag>,
            },
            {
              title: '状态',
              dataIndex: 'status',
              width: 80,
              render: (value?: string) =>
                value === '0' ? <Tag color="red">禁用</Tag> : <Tag color="green">启用</Tag>,
            },
            {
              title: '描述',
              dataIndex: 'description',
              width: 220,
              ellipsis: true,
              render: (v?: string) => v || '-',
            },
            {
              title: '操作',
              key: 'action',
              width: 260,
              fixed: 'right',
              render: (_, record) => (
                <Space size={0}>
                  <Auth code="system:role:assign">
                    <Button
                      type="link"
                      size="small"
                      icon={<SafetyOutlined />}
                      onClick={() => openAssignPermissions(record)}
                    >
                      分配权限
                    </Button>
                  </Auth>
                  <Auth code="system:role:assign">
                    <Button
                      type="link"
                      size="small"
                      icon={<TeamOutlined />}
                      onClick={() => openAssignUsers(record)}
                    >
                      分配用户
                    </Button>
                  </Auth>
                  <Auth code="system:role:edit">
                    <Button type="link" size="small" onClick={() => openEdit(record)}>
                      编辑
                    </Button>
                  </Auth>
                  <Auth code="system:role:delete">
                    <Popconfirm title="确认删除该角色？" onConfirm={() => removeOne(record.id)}>
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

      {/* 新增 / 编辑角色 */}
      <Modal
        open={open}
        title={editing ? '编辑角色' : '新增角色'}
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
                label="角色名称"
                rules={[{ required: true, message: '请输入角色名称' }]}
              >
                <Input placeholder="如：部门经理" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="code"
                label="角色编码"
                rules={[{ required: true, message: '请输入角色编码' }]}
              >
                <Input placeholder="如：manager" disabled={editing?.code === 'admin'} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="dataScope" label="数据范围">
                <Select style={{ width: '100%' }} options={DATA_SCOPE_OPTIONS} />
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
                  options={[
                    { label: '启用', value: '1' },
                    { label: '禁用', value: '0' },
                  ]}
                />
              </Form.Item>
            </Col>
            {/* 描述为长文本，单独占满整行 */}
            <Col span={24}>
              <Form.Item name="description" label="描述">
                <Input.TextArea rows={3} placeholder="角色职责说明" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 分配权限 */}
      <Drawer
        open={permDrawer}
        title={permTarget ? `给「${permTarget.name}」分配权限` : '分配权限'}
        onClose={() => setPermDrawer(false)}
        width={520}
        extra={
          <Tooltip title="保存">
            <Button type="primary" loading={permSaving} onClick={savePermissions}>
              保存
            </Button>
          </Tooltip>
        }
      >
        <Space orientation="vertical" style={{ width: '100%' }} size="middle">
          <Space>
            <Button size="small" onClick={() => setCheckedKeys(allPermKeys)}>
              全选
            </Button>
            <Button size="small" onClick={() => setCheckedKeys([])}>
              清空
            </Button>
            <Typography.Text type="secondary">已选 {checkedKeys.length} 项</Typography.Text>
          </Space>
          <Tree
            checkable
            selectable={false}
            treeData={permTreeData}
            checkedKeys={checkedKeys}
            expandedKeys={expandedKeys}
            onExpand={(keys) => setExpandedKeys(keys as string[])}
            onCheck={(keys) => setCheckedKeys(keys as string[])}
          />
        </Space>
      </Drawer>

      {/* 分配用户 */}
      <Drawer
        open={userDrawer}
        title={userTarget ? `给「${userTarget.name}」分配用户` : '分配用户'}
        onClose={() => setUserDrawer(false)}
        width={520}
        extra={
          <Tooltip title="保存">
            <Button type="primary" loading={userSaving} onClick={saveUsers}>
              保存
            </Button>
          </Tooltip>
        }
      >
        <Space orientation="vertical" style={{ width: '100%' }} size="middle">
          <Typography.Text type="secondary">
            勾选属于该角色的用户（保存为追加操作，不会移除用户已有的其它角色）。
          </Typography.Text>
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="请选择用户"
            value={selectedUserIds}
            onChange={setSelectedUserIds}
            options={userOptions}
            optionFilterProp="label"
            showSearch
          />
        </Space>
      </Drawer>
    </div>
  );
}
