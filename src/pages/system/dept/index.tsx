/**
 * 部门管理 — 左侧组织树 + 右侧部门列表
 * --------------------------------------------------
 * 后端 /api/rbac/depts?tree=1 返回嵌套结构（已 JOIN 负责人与人数），
 * 左侧 Tree 用于快速筛选，右侧 Table 展示该部门及其子部门。
 */

import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Col,
  Empty,
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
  Tree,
  TreeSelect,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { useRequest } from 'ahooks';
import Auth from '@/components/Auth';
import { createDept, deleteDept, fetchDeptTree, fetchUsers, updateDept } from '@/api';
import type { DeptItem } from '@/types';
import type { TableColumnsType, TreeDataNode, TreeProps } from 'antd';

/** 新增 / 编辑表单值 */
interface DeptFormValues {
  name: string;
  /** 统一为字符串，避免与后端 number 类型的 id 比对失败导致回显裸 id */
  parentId?: string | null;
  leader?: string | null;
  phone?: string;
  email?: string;
  sort?: number;
  status?: string;
}

/** TreeSelect 需要的节点结构（value 统一字符串） */
interface DeptOption {
  title: string;
  value: string;
  disabled?: boolean;
  children?: DeptOption[];
}

/** 部门树 → antd Tree 数据（人数作为次要信息展示） */
function toTreeData(nodes: DeptItem[]): TreeDataNode[] {
  return nodes.map((node) => ({
    key: String(node.id),
    title: (
      <Space size={6}>
        <span>{node.name}</span>
        <Typography.Text type="secondary">{node.userCount ?? 0} 人</Typography.Text>
      </Space>
    ),
    children: node.children?.length ? toTreeData(node.children) : undefined,
  }));
}

/** 部门树 → TreeSelect 数据；forbidden 中的节点禁用 */
function toParentOptions(nodes: DeptItem[], forbidden: ReadonlySet<string>): DeptOption[] {
  return nodes.map((node) => {
    const children = node.children?.length ? toParentOptions(node.children, forbidden) : undefined;
    const option: DeptOption = { title: node.name, value: String(node.id), children };
    return forbidden.has(String(node.id)) ? { ...option, disabled: true } : option;
  });
}

/** 取出某节点的子树（id 为空时返回整棵树） */
function findSubtree(nodes: DeptItem[], id: string | number | null): DeptItem[] {
  if (id === null) return nodes;
  const target = String(id);
  for (const node of nodes) {
    if (String(node.id) === target) return [node];
    const found = findSubtree(node.children ?? [], id);
    if (found.length) return found;
  }
  return [];
}

/** 关键字过滤部门树：命中节点保留整棵子树，未命中但有命中子级则保留骨架 */
function filterTree(nodes: DeptItem[], keyword: string): DeptItem[] {
  const text = keyword.trim().toLowerCase();
  if (!text) return nodes;
  const result: DeptItem[] = [];
  nodes.forEach((node) => {
    const children = filterTree(node.children ?? [], keyword);
    const selfMatched =
      node.name.toLowerCase().includes(text) ||
      (node.leaderName ?? '').toLowerCase().includes(text) ||
      (node.phone ?? '').toLowerCase().includes(text) ||
      (node.email ?? '').toLowerCase().includes(text);
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

/** 收集某节点的全部后代 id（编辑时不允许把上级改成自己的后代） */
function collectDescendantIds(node: DeptItem): string[] {
  return (node.children ?? []).flatMap((child) => [
    String(child.id),
    ...collectDescendantIds(child),
  ]);
}

export default function DeptListPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm<DeptFormValues>();

  const treeRequest = useRequest(fetchDeptTree);
  const userRequest = useRequest(() => fetchUsers({ pageSize: 500 }));

  const tree = useMemo<DeptItem[]>(() => treeRequest.data ?? [], [treeRequest.data]);
  const users = useMemo(() => userRequest.data?.list ?? [], [userRequest.data]);

  const [keyword, setKeyword] = useState('');
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DeptItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /** 右侧表格数据：选中部门的子树 + 关键字过滤 */
  const dataSource = useMemo(
    () => filterTree(findSubtree(tree, selectedId), keyword),
    [tree, selectedId, keyword],
  );

  /** 编辑时不可选的上级：自己 + 全部后代 */
  const forbiddenIds = useMemo<ReadonlySet<string>>(() => {
    if (!editing) return new Set<string>();
    return new Set([String(editing.id), ...collectDescendantIds(editing)]);
  }, [editing]);

  const parentOptions = useMemo(() => toParentOptions(tree, forbiddenIds), [tree, forbiddenIds]);

  /** 负责人下拉：value 统一字符串，保证与回填的 leader 类型一致 */
  const userOptions = useMemo(
    () =>
      users.map((user) => ({
        label: user.nickname ? `${user.username}（${user.nickname}）` : user.username,
        value: String(user.id),
      })),
    [users],
  );

  const reload = () => {
    treeRequest.refresh();
  };

  const openCreate = (parentId: string | number | null = null) => {
    setEditing(null);
    form.resetFields();
    // parentId 统一转字符串，保证与 TreeSelect 的 option.value 类型一致
    form.setFieldsValue({
      parentId: parentId === null ? null : String(parentId),
      sort: 0,
      status: 'active',
    });
    setOpen(true);
  };

  const openEdit = (record: DeptItem) => {
    setEditing(record);
    form.resetFields();
    form.setFieldsValue({
      name: record.name,
      parentId:
        record.parentId === null || record.parentId === undefined ? null : String(record.parentId),
      leader: record.leader === null || record.leader === undefined ? null : String(record.leader),
      phone: record.phone ?? undefined,
      email: record.email ?? undefined,
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
        await updateDept(editing.id, values);
        message.success('修改成功');
      } else {
        await createDept(values);
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
      await deleteDept(id);
      message.success('删除成功');
      reload();
    } catch {
      // 后端会在有子部门或成员时报错，错误提示已统一展示
    }
  };

  /** 左侧树：点击节点筛选，再次点击同一节点则取消筛选 */
  const handleSelect: TreeProps['onSelect'] = (keys) => {
    const id = keys[0];
    const next = id === undefined ? null : (id as string | number);
    setSelectedId(next !== null && String(next) === String(selectedId) ? null : next);
  };

  const columns: TableColumnsType<DeptItem> = [
    // 首列固定左侧，配合 scroll.x 生效
    { title: '部门名称', dataIndex: 'name', width: 200, fixed: 'left', ellipsis: true },
    {
      title: '负责人',
      dataIndex: 'leaderName',
      width: 120,
      render: (leaderName?: string) => leaderName || '-',
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      width: 140,
      render: (phone?: string) => phone || '-',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 200,
      ellipsis: true,
      render: (email?: string) => email || '-',
    },
    { title: '排序', dataIndex: 'sort', width: 80 },
    {
      title: '成员数',
      dataIndex: 'userCount',
      width: 100,
      render: (count?: number) => <Tag color="blue">{count ?? 0}</Tag>,
    },
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
      render: (value?: string) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Auth code="system:dept:add">
            <Button type="link" size="small" onClick={() => openCreate(record.id)}>
              新增子部门
            </Button>
          </Auth>
          <Auth code="system:dept:edit">
            <Button type="link" size="small" onClick={() => openEdit(record)}>
              编辑
            </Button>
          </Auth>
          <Auth code="system:dept:delete">
            <Popconfirm title="确认删除该部门？" onConfirm={() => removeOne(record.id)}>
              <Button type="link" size="small" danger>
                删除
              </Button>
            </Popconfirm>
          </Auth>
        </Space>
      ),
    },
  ];

  const treePanel = (
    <Card
      title="组织架构"
      size="small"
      loading={treeRequest.loading}
      extra={
        <Button
          type="link"
          size="small"
          disabled={selectedId === null}
          onClick={() => setSelectedId(null)}
        >
          全部
        </Button>
      }
    >
      {tree.length ? (
        <Tree
          blockNode
          showLine
          defaultExpandAll
          treeData={toTreeData(tree)}
          selectedKeys={selectedId === null ? [] : [String(selectedId)]}
          onSelect={handleSelect}
        />
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无部门数据" />
      )}
    </Card>
  );

  return (
    <div className="page-container">
      <Typography.Title level={4} style={{ margin: 0 }}>
        部门管理
      </Typography.Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={6}>
          {treePanel}
        </Col>

        <Col xs={24} lg={18}>
          <Card>
            <Space wrap style={{ marginBottom: 16 }}>
              <Input.Search
                allowClear
                placeholder="搜索部门 / 负责人 / 电话 / 邮箱"
                style={{ width: 260 }}
                onSearch={setKeyword}
              />
              <Button icon={<ReloadOutlined />} onClick={reload}>
                刷新
              </Button>
              <Auth code="system:dept:add">
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreate()}>
                  新增顶级部门
                </Button>
              </Auth>
            </Space>

            <Table<DeptItem>
              key={String(selectedId ?? 'all')}
              rowKey="id"
              size="middle"
              loading={treeRequest.loading}
              dataSource={dataSource}
              columns={columns}
              pagination={false}
              defaultExpandAllRows
              // 列较多：开启横向滚动，保证 fixed 列生效
              scroll={{ x: 1100 }}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        open={open}
        title={editing ? '编辑部门' : '新增部门'}
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
                label="部门名称"
                rules={[{ required: true, message: '请输入部门名称' }]}
              >
                <Input placeholder="如：技术部" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="parentId"
                label="上级部门"
                rules={[
                  {
                    validator: (_rule, value: string | null | undefined) => {
                      if (!editing || value === null || value === undefined)
                        return Promise.resolve();
                      if (String(value) === String(editing.id)) {
                        return Promise.reject(new Error('上级部门不能是自己'));
                      }
                      if (forbiddenIds.has(String(value))) {
                        return Promise.reject(new Error('上级部门不能是自己的子部门'));
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
                  placeholder="顶级部门"
                  treeData={parentOptions}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="leader" label="负责人">
                <Select
                  allowClear
                  showSearch
                  style={{ width: '100%' }}
                  optionFilterProp="label"
                  placeholder="请选择负责人"
                  options={userOptions}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="phone" label="联系电话">
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
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
