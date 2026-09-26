/**
 * 在线用户监控
 * --------------------------------------------------
 * 展示当前在线会话（黑名单之外的有效会话），支持强制下线（踢人）。
 * 需 system:user 权限（与用户管理同级）。
 */
import { useEffect, useState } from 'react';
import { App, Button, Card, Space, Table, Popconfirm, Tag } from 'antd';
import { LogoutOutlined, ReloadOutlined } from '@ant-design/icons';
import Auth from '@/components/Auth';
import { fetchOnlineUsers, kickOnlineUser } from '@/api/rbac';
import type { OnlineUser } from '@/types/rbac';

export default function OnlineListPage() {
  const { message } = App.useApp();
  const [list, setList] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setList(await fetchOnlineUsers());
    } catch {
      // 拦截器已统一提示
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchOnlineUsers();
        if (active) setList(data);
      } catch {
        // 拦截器已统一提示
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const kick = async (userId: string) => {
    await kickOnlineUser(userId);
    message.success('已强制下线');
    load();
  };

  return (
    <div className="page-container">
      <Card title="在线用户">
        <Space wrap style={{ marginBottom: 16 }}>
          <Button icon={<ReloadOutlined />} onClick={load}>
            刷新
          </Button>
        </Space>
        <Table<OnlineUser>
          rowKey="userId"
          loading={loading}
          dataSource={list}
          pagination={false}
          columns={[
            { title: '用户名', dataIndex: 'username', width: 200 },
            { title: '昵称', dataIndex: 'nickname', render: (v?: string) => v ?? '-' },
            {
              title: '状态',
              key: 'status',
              width: 120,
              render: () => <Tag color="green">在线</Tag>,
            },
            {
              title: '操作',
              key: 'action',
              width: 140,
              render: (_, record) => (
                <Auth code="system:user">
                  <Popconfirm title="确认强制该用户下线？" onConfirm={() => kick(record.userId)}>
                    <Button type="link" size="small" danger icon={<LogoutOutlined />}>
                      强制下线
                    </Button>
                  </Popconfirm>
                </Auth>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
