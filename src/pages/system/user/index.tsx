/**
 * 用户管理（RBAC）
 * --------------------------------------------------
 * 左侧部门树筛选，右侧用户表格。
 * 部门名 / 岗位名 / 角色名全部由后端 JOIN 返回，前端不拼装。
 * 关键操作：分配角色、重置密码、启用/禁用。
 */

import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Col,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Tree,
  TreeSelect,
  Typography,
  type TreeDataNode,
} from 'antd';
import { useMemo, useState } from 'react';
import { useRequest } from 'ahooks';
import {
  assignUserRoles,
  createUser,
  deleteUser,
  fetchAllDepts,
  fetchAllRoles,
  fetchUsers,
  resetUserPassword,
  updateUser,
  updateUserStatus,
} from '@/api/rbac';
import { postApi } from '@/api';
import { useCrudList } from '@/hooks/useCrudList';
import type { DeptItem, RoleItem, UserItem } from '@/types';
import Auth from '@/components/Auth';

interface UserFormValues {
  username: string;
  password?: string;
  nickname?: string;
  email?: string;
  phone?: string;
  deptId?: string | number | null;
  postId?: string | number | null;
  roleIds?: Array<string | number>;
  status?: string;
}

/** 部门树 → antd Tree 数据 */
const toTreeData = (nodes: DeptItem[]): TreeDataNode[] =>
  nodes.map((node) => ({
    key: String(node.id),
    title: node.name,
    children: node.children?.length ? toTreeData(node.children) : undefined,
  }));

export default function UserListPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm<UserFormValues>();

  const [deptId, setDeptId] = useState<string | number | undefined>(undefined);
  const [status, setStatus] = useState<string | undefined>(undefined);

  const { list, total, loading, page, pageSize, setPage, setPageSize, setKeyword, reload } =
    useCrudList<UserItem>((params) => fetchUsers({ ...params, deptId, status }), {
      keywordFields: 'username,nickname,email,phone',
    });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 分配角色抽屉
  const [roleDrawer, setRoleDrawer] = useState(false);
  const [roleTarget, setRoleTarget] = useState<UserItem | null>(null);
  const [roleIds, setRoleIds] = useState<Array<string | number>>([]);
  const [roleSaving, setRoleSaving] = useState(false);

  const { data: depts } = useRequest(fetchAllDepts);
  const { data: roles } = useRequest(fetchAllRoles);
  const { data: posts } = useRequest(() => postApi.list({ pageSize: 500 }));

  /**
   * 注意：后端 JSON 里 id 可能是 number，而 user.roleIds 存的是 string，
   * 两侧类型不一致会让 Select/TreeSelect 匹配不上、直接把 id 显示出来。
   * 因此所有 option 的 value 统一转成字符串，回填表单时也统一转字符串。
   */
  const deptTreeData = useMemo(() => toTreeData(depts ?? []), [depts]);
  const postOptions = useMemo(
    () => (posts?.list ?? []).map((p) => ({ label: p.name, value: String(p.id) })),
    [posts],
  );
  const roleOptions = useMemo(
    () => (roles ?? []).map((r: RoleItem) => ({ label: r.name, value: String(r.id) })),
    [roles],
  );

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ status: '1' });
    setOpen(true);
  };

  const openEdit = (record: UserItem) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      password: undefined,
      // 与 option.value 的字符串类型保持一致，否则回显会变成裸 id
      deptId:
        record.deptId === null || record.deptId === undefined ? undefined : String(record.deptId),
      postId:
        record.postId === null || record.postId === undefined ? undefined : String(record.postId),
      roleIds: (record.roleIds ?? []).map(String),
    });
    setOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      if (editing) {
        await updateUser(editing.id, {
          nickname: values.nickname,
          email: values.email,
          phone: values.phone,
          deptId: values.deptId ?? null,
          postId: values.postId ?? null,
          status: values.status,
        });
        if (values.roleIds) await assignUserRoles(editing.id, values.roleIds);
        message.success('修改成功');
      } else {
        if (!values.password) {
          message.warning('新增用户必须设置密码');
          return;
        }
        await createUser({ ...values, password: values.password });
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

  const openAssignRoles = (record: UserItem) => {
    setRoleTarget(record);
    // roleIds 在后端是字符串数组，统一 String 以匹配 roleOptions 的 value
    setRoleIds((record.roleIds ?? []).map(String));
    setRoleDrawer(true);
  };

  const saveRoles = async () => {
    if (!roleTarget) return;
    setRoleSaving(true);
    try {
      await assignUserRoles(roleTarget.id, roleIds);
      message.success('角色分配成功');
      setRoleDrawer(false);
      reload();
    } catch {
      // 统一提示已处理
    } finally {
      setRoleSaving(false);
    }
  };

  const removeOne = async (id: string | number) => {
    await deleteUser(id);
    message.success('删除成功');
    reload();
  };

  return (
    <div className="page-container">
      <Typography.Title level={4} style={{ margin: 0 }}>
        用户管理
      </Typography.Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={5}>
          <Card title="组织架构" size="small">
            <Tree
              treeData={deptTreeData}
              selectedKeys={deptId !== undefined ? [String(deptId)] : []}
              onSelect={(keys) => setDeptId(keys.length ? String(keys[0]) : undefined)}
              defaultExpandAll
            />
          </Card>
        </Col>

        <Col xs={24} lg={19}>
          <Card>
            <Space wrap style={{ marginBottom: 16 }}>
              <Input
                allowClear
                placeholder="搜索用户名 / 昵称 / 邮箱 / 手机号"
                style={{ width: 260 }}
                suffix={<SearchOutlined />}
                onPressEnter={(e) => setKeyword((e.target as HTMLInputElement).value)}
              />
              <Select
                allowClear
                placeholder="状态"
                style={{ width: 120 }}
                options={[
                  { label: '启用', value: '1' },
                  { label: '禁用', value: '0' },
                ]}
                onChange={(value) => setStatus(value)}
              />
              <Button icon={<ReloadOutlined />} onClick={reload}>
                刷新
              </Button>
              <Auth code="system:user:add">
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  新增
                </Button>
              </Auth>
            </Space>

            <Table<UserItem>
              rowKey="id"
              loading={loading}
              dataSource={list}
              // 列较多时横向滚动，配合首列 fixed:left、操作列 fixed:right
              scroll={{ x: 1440 }}
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
                { title: '用户名', dataIndex: 'username', width: 110, fixed: 'left' },
                { title: '昵称', dataIndex: 'nickname', width: 110 },
                {
                  title: '部门',
                  dataIndex: 'deptName',
                  width: 120,
                  render: (value?: string) => value || '-',
                },
                {
                  title: '岗位',
                  dataIndex: 'postName',
                  width: 110,
                  render: (value?: string) => value || '-',
                },
                {
                  title: '角色',
                  dataIndex: 'roleNames',
                  width: 160,
                  render: (names?: string[]) =>
                    names?.length
                      ? names.map((n) => (
                          <Tag key={n} color="blue">
                            {n}
                          </Tag>
                        ))
                      : '-',
                },
                {
                  title: '邮箱',
                  dataIndex: 'email',
                  width: 200,
                  ellipsis: true,
                  render: (v?: string) => v || '-',
                },
                {
                  title: '手机号',
                  dataIndex: 'phone',
                  width: 130,
                  render: (v?: string) => v || '-',
                },
                {
                  title: '状态',
                  dataIndex: 'status',
                  width: 80,
                  render: (value?: string) =>
                    value === '0' ? <Tag color="red">禁用</Tag> : <Tag color="green">启用</Tag>,
                },
                {
                  title: '操作',
                  key: 'action',
                  width: 240,
                  fixed: 'right',
                  render: (_, record) => (
                    <Space size={0}>
                      <Auth code="system:user:edit">
                        <Button type="link" size="small" onClick={() => openEdit(record)}>
                          编辑
                        </Button>
                      </Auth>
                      <Auth code="system:user:assign">
                        <Button type="link" size="small" onClick={() => openAssignRoles(record)}>
                          分配角色
                        </Button>
                      </Auth>
                      <Auth code="system:user:reset">
                        <Popconfirm
                          title="重置为 123456？"
                          onConfirm={() => resetUserPassword(record.id).then(reload)}
                        >
                          <Button type="link" size="small">
                            重置密码
                          </Button>
                        </Popconfirm>
                      </Auth>
                      <Auth code="system:user:edit">
                        <Button
                          type="link"
                          size="small"
                          onClick={() =>
                            updateUserStatus(record.id, record.status === '0' ? '1' : '0').then(
                              reload,
                            )
                          }
                        >
                          {record.status === '0' ? '启用' : '禁用'}
                        </Button>
                      </Auth>
                      <Auth code="system:user:delete">
                        <Popconfirm title="确认删除该用户？" onConfirm={() => removeOne(record.id)}>
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
        </Col>
      </Row>

      {/* 新增 / 编辑 */}
      <Modal
        open={open}
        title={editing ? '编辑用户' : '新增用户'}
        onCancel={() => setOpen(false)}
        onOk={submit}
        confirmLoading={submitting}
        destroyOnHidden
        width={800}
        // 小屏时弹窗内容区可滚动，避免超出视口
        styles={{ body: { maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' } }}
      >
        {/* 双列栅格：一行放两个字段，弹窗高度比单列少一半 */}
        <Form form={form} layout="vertical" autoComplete="off">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="username"
                label="用户名"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input placeholder="请输入用户名" disabled={!!editing} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="nickname" label="昵称">
                <Input placeholder="请输入昵称" />
              </Form.Item>
            </Col>

            {!editing && (
              <Col span={24}>
                <Form.Item
                  name="password"
                  label="密码"
                  rules={[
                    { required: true, message: '请输入密码' },
                    { min: 6, message: '密码至少 6 位' },
                  ]}
                >
                  <Input.Password placeholder="请输入初始密码" />
                </Form.Item>
              </Col>
            )}

            <Col xs={24} sm={12}>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[{ type: 'email', message: '邮箱格式不正确' }]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="phone" label="手机号">
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="deptId" label="所属部门">
                <TreeSelect
                  allowClear
                  style={{ width: '100%' }}
                  placeholder="请选择部门"
                  treeData={deptTreeData}
                  treeDefaultExpandAll
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="postId" label="岗位">
                <Select allowClear placeholder="请选择岗位" options={postOptions} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="roleIds" label="角色">
                <Select mode="multiple" allowClear placeholder="请选择角色" options={roleOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="status" label="状态">
                <Select
                  options={[
                    { label: '启用', value: '1' },
                    { label: '禁用', value: '0' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 分配角色 */}
      <Drawer
        open={roleDrawer}
        title={
          roleTarget ? `给「${roleTarget.nickname ?? roleTarget.username}」分配角色` : '分配角色'
        }
        onClose={() => setRoleDrawer(false)}
        width={420}
        extra={
          <Tooltip title="保存">
            <Button type="primary" loading={roleSaving} onClick={saveRoles}>
              保存
            </Button>
          </Tooltip>
        }
      >
        <Space orientation="vertical" style={{ width: '100%' }}>
          <Typography.Text type="secondary">
            勾选该用户拥有的角色，一个用户可拥有多个角色。
          </Typography.Text>
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="请选择角色"
            value={roleIds}
            onChange={setRoleIds}
            options={roleOptions}
          />
        </Space>
      </Drawer>
    </div>
  );
}
