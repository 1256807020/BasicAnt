/**
 * FullscreenButton — 全屏 / 退出全屏切换（登录后右上角）
 */

import { useEffect, useState } from 'react';
import { Button, Tooltip } from 'antd';
import { FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';

export default function FullscreenButton() {
  const [isFull, setIsFull] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggle = () => {
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen?.();
    } else {
      void document.exitFullscreen?.();
    }
  };

  return (
    <Tooltip title={isFull ? '退出全屏' : '全屏'}>
      <Button
        type="text"
        aria-label="toggle-fullscreen"
        icon={isFull ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
        onClick={toggle}
      />
    </Tooltip>
  );
}
