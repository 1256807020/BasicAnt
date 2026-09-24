/**
 * 登录 / 注册页
 * --------------------------------------------------
 * 登录走 /api/rbac/auth/login，返回 token + 角色 + 权限码，
 * 登录后由后端权限决定可见菜单与可用按钮。
 */

import { LockOutlined, MailOutlined, MobileOutlined, UserOutlined } from '@ant-design/icons';
import { App, Button, Card, Form, Input, Tabs, Typography } from 'antd';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { login, register } from '@/api/rbac';
import { useAppStore } from '@/store/useAppStore';

interface LoginFormValues {
  username: string;
  password: string;
}

interface RegisterFormValues {
  username: string;
  password: string;
  confirmPassword: string;
  nickname?: string;
  email?: string;
  phone?: string;
}

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAppStore((state) => state.setAuth);
  const { message } = App.useApp();

  const onLogin = async (values: LoginFormValues) => {
    setSubmitting(true);
    try {
      const { token, userInfo } = await login(values);
      setAuth(token, userInfo);
      message.success(`欢迎回来，${userInfo.nickname}`);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? '/dashboard', { replace: true });
    } catch {
      // 失败原因已由 request 拦截器统一提示
    } finally {
      setSubmitting(false);
    }
  };

  const onRegister = async (values: RegisterFormValues) => {
    setSubmitting(true);
    try {
      await register({
        username: values.username,
        password: values.password,
        nickname: values.nickname,
        email: values.email,
        phone: values.phone,
      });
      message.success('注册成功，请登录');
      setActiveTab('login');
    } catch {
      // 统一提示已处理
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-center" style={{ height: '100vh', padding: 16 }}>
      <Card style={{ width: 420 }} title="ReactAdmin 后台管理系统">
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as 'login' | 'register')}
          items={[
            { key: 'login', label: '账号登录' },
            { key: 'register', label: '注册账号' },
          ]}
        />

        {activeTab === 'login' ? (
          <Form<LoginFormValues>
            size="large"
            initialValues={{ username: 'admin', password: '123456' }}
            onFinish={onLogin}
          >
            <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
              <Input
                prefix={<UserOutlined />}
                placeholder="用户名 / 邮箱 / 手机号"
                autoComplete="username"
              />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码"
                autoComplete="current-password"
              />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={submitting}>
              登录
            </Button>
            <Typography.Paragraph
              type="secondary"
              style={{ marginTop: 16, marginBottom: 0, fontSize: 12 }}
            >
              演示账号：admin / 123456（超级管理员），zhangsan / 123456（部门经理），lisi /
              123456（普通用户）
            </Typography.Paragraph>
          </Form>
        ) : (
          <Form<RegisterFormValues> size="large" onFinish={onRegister} autoComplete="off">
            <Form.Item
              name="username"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, message: '用户名至少 3 个字符' },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="用户名（至少 3 位）" />
            </Form.Item>
            <Form.Item name="nickname">
              <Input prefix={<UserOutlined />} placeholder="昵称（选填）" />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少 6 位' },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="密码（至少 6 位）" />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) return Promise.resolve();
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
            </Form.Item>
            <Form.Item name="email" rules={[{ type: 'email', message: '邮箱格式不正确' }]}>
              <Input prefix={<MailOutlined />} placeholder="邮箱（选填）" />
            </Form.Item>
            <Form.Item name="phone">
              <Input prefix={<MobileOutlined />} placeholder="手机号（选填）" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={submitting}>
              注册
            </Button>
          </Form>
        )}
      </Card>
    </div>
  );
}
