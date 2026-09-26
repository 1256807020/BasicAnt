/**
 * 找回密码（公开页）
 * --------------------------------------------------
 * 输入用户名 → 后端返回重置令牌（生产应经邮件/短信下发）→ 跳转重置页。
 */
import { useState } from 'react';
import { App, Button, Card, Form, Input } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword } from '@/api/rbac';

export default function ForgotPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm<{ username: string }>();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async () => {
    const v = await form.validateFields();
    setLoading(true);
    try {
      const { token } = await forgotPassword(v.username);
      message.success('已生成重置令牌');
      navigate(`/reset?token=${encodeURIComponent(token)}`);
    } catch {
      // 拦截器已提示
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f0f2f5',
      }}
    >
      <Card title="找回密码" style={{ width: 360 }}>
        <Form form={form} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入登录账号" />
          </Form.Item>
          <Button type="primary" block loading={loading} onClick={submit}>
            下一步
          </Button>
          <div style={{ marginTop: 12 }}>
            <Link to="/login">返回登录</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}
