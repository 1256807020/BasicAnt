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
import { useMemo, useState, type Key } from 'react';
import { useDebounceFn, useRequest } from 'ahooks';
import {
  assignRoleUsers,
  createRole,
  deleteRole,
  fetchPermissionTree,
  fetchRolePermissions,
  fetchRoles,
  fetchUserRoles,
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
  const {
    data: roles,
    loading,
    refresh,
  } = useRequest(() => fetchRoles({ keyword }), {
    refreshDeps: [keyword],
  });

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

  // 权限树父级关系：用于「保存时向上推导父级」「回显时过滤父级只留叶子」
  // 对齐企业级基座方案（README §5）：级联勾选 + 存完整树状 ID（父+子都存）。
  const { parentOf, parentIdSet } = useMemo(() => {
    const parentOf = new Map<string, string>();
    const parentIdSet = new Set<string>();
    const walk = (nodes: PermissionItem[]) => {
      nodes.forEach((n) => {
        if (n.children?.length) {
          parentIdSet.add(String(n.id));
          n.children.forEach((c) => parentOf.set(String(c.id), String(n.id)));
          walk(n.children);
        }
      });
    };
    walk(permissionTree ?? []);
    return { parentOf, parentIdSet };
  }, [permissionTree]);

  /** 回显：过滤掉父级节点，只勾叶子，半选状态由 antd 自动推导 */
  const toLeafIds = (ids: string[]): string[] => ids.filter((id) => !parentIdSet.has(id));

  /** 保存：从已勾叶子向上推导所有祖先，得到完整树状 ID（父+子都入库） */
  const deriveParents = (ids: string[]): string[] => {
    const out = new Set(ids);
    ids.forEach((id) => {
      let p = parentOf.get(id);
      while (p) {
        out.add(p);
        p = parentOf.get(p);
      }
    });
    return [...out];
  };

  /* ---------- 分配用户（服务端分页 + 服务端搜索，支撑大用户量） ---------- */
  const [userDrawer, setUserDrawer] = useState(false);
  const [userTarget, setUserTarget] = useState<RoleItem | null>(null);
  const [userKeyword, setUserKeyword] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [userOperating, setUserOperating] = useState(false);

  // 已授权用户：后端 /rbac/users 原生支持 roleId 过滤 + keyword 搜索 + 分页，
  // 前端任何时刻只持有一页数据，几千用户也不怕。
  const {
    data: roleUsers,
    loading: roleUsersLoading,
    refresh: refreshRoleUsers,
  } = useRequest(
    () =>
      userTarget
        ? fetchUsers({
            roleId: userTarget.id,
            keyword: userKeyword,
            page: userPage,
            pageSize: userPageSize,
          })
        : Promise.resolve({ list: [], total: 0, page: 1, pageSize: userPageSize, totalPages: 0 }),
    { refreshDeps: [userTarget?.id, userKeyword, userPage, userPageSize], ready: !!userTarget },
  );

  // 添加用户：远程搜索（防抖 300ms），按需取 20 条，不整页拉用户
  const [addUserIds, setAddUserIds] = useState<{ label: string; value: string }[]>([]);
  const [remoteOptions, setRemoteOptions] = useState<{ label: string; value: string }[]>([]);
  const { run: searchUsers } = useDebounceFn(
    async (kw: string) => {
      if (!kw) {
        setRemoteOptions([]);
        return;
      }
      const res = await fetchUsers({ keyword: kw, page: 1, pageSize: 20 });
      setRemoteOptions(
        res.list.map((u) => ({
          label: `${u.nickname ?? u.username}（${u.username}）`,
          value: String(u.id),
        })),
      );
    },
    { wait: 300 },
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
    // 回显过滤父级，只勾叶子，半选由 antd 级联自动推导
    setCheckedKeys(toLeafIds(ids.map(String)));
    setExpandedKeys(allPermKeys);
    setPermDrawer(true);
  };

  const savePermissions = async () => {
    if (!permTarget) return;
    setPermSaving(true);
    try {
      // 保存时向上推导父级，入库完整树状 ID（父+子齐全，便于后端按权限 ID 反查菜单）
      await saveRolePermissions(permTarget.id, deriveParents(checkedKeys));
      message.success('权限分配成功');
      setPermDrawer(false);
      refresh();
    } catch {
      // 统一提示已处理
    } finally {
      setPermSaving(false);
    }
  };

  const openAssignUsers = (record: RoleItem) => {
    setUserTarget(record);
    setUserKeyword('');
    setUserPage(1);
    setSelectedRowKeys([]);
    setAddUserIds([]);
    setUserDrawer(true);
  };

  /** 从角色移除用户：覆盖式改写该用户的 roleIds（无需专用后端接口） */
  const removeUsersFromRole = async (userIds: Key[]) => {
    if (!userTarget || userIds.length === 0) return;
    setUserOperating(true);
    try {
      await Promise.all(
        userIds.map(async (uid) => {
          const roleIds = await fetchUserRoles(uid);
          await assignUserRoles(
            uid,
            roleIds.filter((r) => String(r) !== String(userTarget.id)),
          );
        }),
      );
      message.success(userIds.length > 1 ? `已移除 ${userIds.length} 个用户` : '已移除');
      setSelectedRowKeys([]);
      setUserPage(1);
      refreshRoleUsers();
      refresh();
    } catch {
      // 统一提示已处理
    } finally {
      setUserOperating(false);
    }
  };

  /** 追加授权：assignRoleUsers 为追加语义，不影响用户已有其它角色 */
  const addUsersToRole = async () => {
    if (!userTarget || addUserIds.length === 0) return;
    setUserOperating(true);
    try {
      await assignRoleUsers(
        userTarget.id,
        addUserIds.map((v) => v.value),
      );
      message.success(`已添加 ${addUserIds.length} 个用户`);
      setAddUserIds([]);
      setRemoteOptions([]);
      setUserPage(1);
      refreshRoleUsers();
      refresh();
    } catch {
      // 统一提示已处理
    } finally {
      setUserOperating(false);
    }
  };

  const removeOne = async (id: string | number) => {
    await deleteRole(id);
    message.success('删除成功');
    refresh();
  };

  return (
    <div className="page-container">
      <Card>
        <Space wrap style={{ marginBottom: 16 }}>
          <Input
            allowClear
            placeholder="搜索角色名称 / 编码"
            style={{ width: 240 }}
            suffix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
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
        size={520}
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
            <Typography.Text type="secondary">
              已选 {checkedKeys.length} 项 · 勾选父级会级联选中子级，取消子级后父级自动半选
            </Typography.Text>
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

      {/* 分配用户：远程搜索添加 + 已授权用户分页表格（大用户量友好） */}
      <Drawer
        open={userDrawer}
        title={userTarget ? `给「${userTarget.name}」分配用户` : '分配用户'}
        onClose={() => setUserDrawer(false)}
        size={680}
      >
        <Space orientation="vertical" style={{ width: '100%' }} size="middle">
          <Typography.Text type="secondary">
            上方搜索添加用户（追加授权，不影响用户已有其它角色）；下方为已授权用户，可单个或批量移除。
          </Typography.Text>

          {/* 添加用户：服务端搜索，按需加载，不整页拉取 */}
          <Space.Compact style={{ width: '100%' }}>
            <Select
              mode="multiple"
              labelInValue
              style={{ flex: 1, minWidth: 0 }}
              placeholder="输入用户名 / 昵称搜索（服务端搜索）"
              value={addUserIds}
              onChange={(vals) => setAddUserIds(vals as { label: string; value: string }[])}
              options={remoteOptions}
              onSearch={(kw) => searchUsers(kw)}
              filterOption={false}
              notFoundContent={null}
              allowClear
            />
            <Button
              type="primary"
              loading={userOperating}
              disabled={addUserIds.length === 0}
              onClick={addUsersToRole}
            >
              添加
            </Button>
          </Space.Compact>

          {/* 已授权用户：服务端分页 + 搜索 */}
          <Input.Search
            allowClear
            enterButton
            placeholder="搜索已授权用户（用户名 / 昵称）"
            onSearch={(v) => {
              setUserKeyword(v);
              setUserPage(1);
            }}
          />

          <Table<UserItem>
            rowKey="id"
            size="small"
            loading={roleUsersLoading}
            dataSource={roleUsers?.list ?? []}
            rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
            pagination={{
              current: userPage,
              pageSize: userPageSize,
              total: roleUsers?.total ?? 0,
              showSizeChanger: true,
              showTotal: (v) => `共 ${v} 人`,
              onChange: (p, ps) => {
                setUserPage(p);
                setUserPageSize(ps);
              },
            }}
            columns={[
              { title: '用户名', dataIndex: 'username', width: 110, ellipsis: true },
              {
                title: '昵称',
                dataIndex: 'nickname',
                width: 110,
                ellipsis: true,
                render: (v) => v || '-',
              },
              {
                title: '部门',
                dataIndex: 'deptName',
                width: 110,
                ellipsis: true,
                render: (v) => v || '-',
              },
              {
                title: '操作',
                key: 'op',
                width: 70,
                render: (_, record) => (
                  <Popconfirm
                    title="确认将该用户移出此角色？"
                    onConfirm={() => removeUsersFromRole([record.id])}
                  >
                    <Button type="link" size="small" danger>
                      移除
                    </Button>
                  </Popconfirm>
                ),
              },
            ]}
          />

          {selectedRowKeys.length > 0 && (
            <Popconfirm
              title={`确认将选中的 ${selectedRowKeys.length} 个用户移出此角色？`}
              onConfirm={() => removeUsersFromRole(selectedRowKeys)}
            >
              <Button danger loading={userOperating}>
                批量移除（{selectedRowKeys.length}）
              </Button>
            </Popconfirm>
          )}
        </Space>
      </Drawer>
    </div>
  );
}
