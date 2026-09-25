/**
 * NotificationDrawer — 通知中心抽屉：列表 / 单条已读 / 全部已读 / 删除 / 加载更多
 */

import { Button, Drawer, Empty, List, Popconfirm, Space, Spin, Tag } from 'antd';
import { CheckOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '@/store/notification';
import type { NotificationItem } from '@/types';

const TYPE_COLOR: Record<string, string> = {
  system: 'default',
  kick: 'red',
  profile: 'blue',
  role: 'purple',
  notice: 'green',
  audit: 'gold',
};

export default function NotificationDrawer() {
  const { t } = useTranslation();
  const open = useNotificationStore((s) => s.drawerOpen);
  const closeDrawer = useNotificationStore((s) => s.closeDrawer);
  const list = useNotificationStore((s) => s.list);
  const loading = useNotificationStore((s) => s.loading);
  const hasMore = useNotificationStore((s) => s.hasMore);
  const fetchList = useNotificationStore((s) => s.fetchList);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const remove = useNotificationStore((s) => s.remove);

  const hasUnread = list.some((n) => !n.read);

  return (
    <Drawer
      title={t('notification.title')}
      open={open}
      onClose={closeDrawer}
      width={380}
      extra={
        <Button
          type="link"
          icon={<CheckOutlined />}
          disabled={!hasUnread}
          onClick={() => void markAllRead()}
        >
          {t('notification.markAllRead')}
        </Button>
      }
    >
      {list.length === 0 && !loading ? (
        <Empty description={t('notification.empty')} style={{ marginTop: 48 }} />
      ) : (
        <List
          dataSource={list}
          renderItem={(item: NotificationItem) => (
            <List.Item
              style={{ cursor: 'pointer', opacity: item.read ? 0.55 : 1 }}
              onClick={() => !item.read && void markRead(item.id)}
              actions={[
                <Popconfirm
                  key="del"
                  title={t('notification.deleteConfirm', '确定删除该通知？')}
                  onConfirm={() => void remove(item.id)}
                  okText={t('common.confirm')}
                  cancelText={t('common.cancel')}
                >
                  <DeleteOutlined style={{ color: 'rgba(0,0,0,0.45)' }} />
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space size={6} wrap>
                    <Tag color={TYPE_COLOR[item.type] ?? 'default'}>
                      {t(`notification.types.${item.type}`, item.type)}
                    </Tag>
                    <span>{item.title}</span>
                  </Space>
                }
                description={
                  <>
                    <div>{item.content}</div>
                    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                    </div>
                  </>
                }
              />
            </List.Item>
          )}
        />
      )}

      {hasMore && (
        <div style={{ textAlign: 'center', padding: 12 }}>
          <Button loading={loading} onClick={() => void fetchList(false)}>
            {t('common.loadMore')}
          </Button>
        </div>
      )}

      {loading && list.length === 0 && (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Spin />
        </div>
      )}
    </Drawer>
  );
}
