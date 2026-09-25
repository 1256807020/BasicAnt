/**
 * Forbidden — 403 无权限页
 * 路由守卫（§7.5-3）或后端接口 403 兜底的统一展示。
 */

import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function Forbidden() {
  const nav = useNavigate();
  return (
    <div className="flex-center" style={{ height: '100%', padding: 24 }}>
      <Result
        status="403"
        title="403"
        subTitle="抱歉，您没有访问该页面的权限。"
        extra={
          <Button type="primary" onClick={() => nav('/dashboard')}>
            返回首页
          </Button>
        }
      />
    </div>
  );
}
