/**
 * 重置密码（公开页）
 * --------------------------------------------------
 * 持找回令牌设置新密码；新密码需满足后端校验（≥8 位且含字母与数字）。
 */
import { useState } from 'react';
import { App, Button, Card, Form, Input } from 'antd';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPasswordByToken } from '@/api/rbac';

const passwordRules = [
  { required: true, message: '请输入新密码' },
  { min: 8, message: '密码至少 8 位' },
  { pattern: /[A-Za-z]/, message: '密码需包含字母' },
  { pattern: /\d/, message: '密码需包含数字' },
];

export default function ResetPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm<{ newPassword: string; confirm: string }>();
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();

  const submit = async () => {
    const v = await form.validateFields();
    if (v.newPassword !== v.confirm) {
      message.error('两次输入的密码不一致');
      return;
    }
    setLoading(true);
    try {
      await resetPasswordByToken(token, v.newPassword);
      message.success('密码已重置，请重新登录');
      navigate('/login');
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
      <Card title="重置密码" style={{ width: 360 }}>
        {!token && <p style={{ color: '#cf1322' }}>缺少重置令牌，请从「找回密码」流程进入。</p>}
        <Form form={form} layout="vertical">
          <Form.Item name="newPassword" label="新密码" rules={passwordRules}>
            <Input.Password placeholder="至少 8 位，含字母与数字" />
          </Form.Item>
          <Form.Item
            name="confirm"
            label="确认密码"
            rules={[{ required: true, message: '请再次输入密码' }]}
          >
            <Input.Password placeholder="请再次输入" />
          </Form.Item>
          <Button type="primary" block loading={loading} disabled={!token} onClick={submit}>
            重置密码
          </Button>
          <div style={{ marginTop: 12 }}>
            <Link to="/login">返回登录</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}
