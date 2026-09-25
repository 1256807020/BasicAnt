/**
 * NotificationBell — 顶栏铃铛（未读红点）+ 点击打开通知抽屉
 */

import { Badge, Button, Tooltip } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '@/store/notification';
import NotificationDrawer from './NotificationDrawer';

export default function NotificationBell() {
  const unread = useNotificationStore((s) => s.unread);
  const openDrawer = useNotificationStore((s) => s.openDrawer);
  const { t } = useTranslation();

  return (
    <>
      <Tooltip title={t('notification.title')}>
        <Badge count={unread} size="small" offset={[-2, 2]}>
          <Button type="text" aria-label="notifications" icon={<BellOutlined />} onClick={openDrawer} />
        </Badge>
      </Tooltip>
      <NotificationDrawer />
    </>
  );
}
