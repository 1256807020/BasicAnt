/**
 * 登录 / 注册页（分屏 + 动效主题）
 * --------------------------------------------------
 * 左：品牌介绍区（GSAP 入场 + 浮动光斑 + 鼠标视差）
 * 右：登录 / 注册表单（现代卡片）
 * 主题：蓝白 / 金橙 双预设，切换写入 store.colorPrimary，
 *       antd 组件与左侧渐变背景（CSS 变量 --brand）同步变色。
 * 动效：GSAP（入场 / 循环浮动 / 视差）+ Lenis（平滑滚动）。
 */

import {
  AppstoreOutlined,
  LockOutlined,
  MailOutlined,
  MobileOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { App, Button, Form, Input, Tabs, Typography } from 'antd';
import { useRef, useState, type CSSProperties } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import Lenis from 'lenis';
import { login, register } from '@/api/rbac';
import { useAppStore } from '@/store/useAppStore';
import { THEME_PRESETS, resolvePreset } from '@/theme/presets';
import './login.css';

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

const FEATURES = [
  { icon: <SafetyCertificateOutlined />, text: '细粒度 RBAC 权限，按钮级控制' },
  { icon: <ThunderboltOutlined />, text: 'Vite 极速热更新，开发体验拉满' },
  { icon: <AppstoreOutlined />, text: '用户 / 角色 / 字典等完整业务示例' },
];

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAppStore((state) => state.setAuth);
  const colorPrimary = useAppStore((state) => state.colorPrimary);
  const setColorPrimary = useAppStore((state) => state.setColorPrimary);
  const { message } = App.useApp();
  const root = useRef<HTMLDivElement>(null);
  const activeKey = resolvePreset(colorPrimary).key;

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      // Lenis 平滑滚动，挂到 gsap 的 ticker 上驱动
      const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
      const raf = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);

      // 入场时间线
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('.intro-badge', { y: 24, autoAlpha: 0, duration: 0.6 })
        .from('.intro-title .line', { y: 40, autoAlpha: 0, duration: 0.8, stagger: 0.12 }, '-=0.25')
        .from('.intro-desc', { y: 20, autoAlpha: 0, duration: 0.6 }, '-=0.4')
        .from('.intro-feature', { x: -24, autoAlpha: 0, duration: 0.5, stagger: 0.1 }, '-=0.3')
        .from('.intro-footer', { autoAlpha: 0, duration: 0.6 }, '-=0.2')
        .from('.auth-card', { y: 40, autoAlpha: 0, duration: 0.8 }, '-=0.6');

      // 光斑循环浮动（x/y，与鼠标视差的 xPercent/yPercent 叠加不冲突）
      gsap.to('.blob-1', {
        y: -34,
        x: 22,
        duration: 5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
      gsap.to('.blob-2', {
        y: 28,
        x: -18,
        duration: 6,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
      gsap.to('.blob-3', { y: -22, duration: 7, repeat: -1, yoyo: true, ease: 'sine.inOut' });

      // 鼠标视差
      const onMove = (e: MouseEvent) => {
        const dx = (e.clientX / window.innerWidth - 0.5) * 2;
        const dy = (e.clientY / window.innerHeight - 0.5) * 2;
        gsap.to('.blob-1', {
          xPercent: dx * 14,
          yPercent: dy * 14,
          duration: 0.8,
          ease: 'power2.out',
        });
        gsap.to('.blob-2', {
          xPercent: dx * -18,
          yPercent: dy * -18,
          duration: 0.8,
          ease: 'power2.out',
        });
        gsap.to('.blob-3', {
          xPercent: dx * 10,
          yPercent: dy * 10,
          duration: 0.8,
          ease: 'power2.out',
        });
      };
      window.addEventListener('mousemove', onMove);

      return () => {
        window.removeEventListener('mousemove', onMove);
        gsap.ticker.remove(raf);
        lenis.destroy();
      };
    },
    { scope: root },
  );

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
    <div className="auth-page" ref={root} style={{ '--brand': colorPrimary } as CSSProperties}>
      {/* 主题切换 */}
      <div className="theme-switch">
        <span className="theme-switch-label">主题</span>
        {THEME_PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            className={`theme-dot${activeKey === p.key ? ' active' : ''}`}
            style={{ background: p.swatch }}
            title={p.label}
            aria-label={p.label}
            onClick={() => setColorPrimary(p.color)}
          />
        ))}
      </div>

      {/* 左侧介绍区 */}
      <section className="auth-aside">
        <div className="intro-bg" />
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="intro-content">
          <span className="intro-badge">✨ React 19 · Ant Design 6</span>
          <h1 className="intro-title">
            <span className="line">现代化企业级</span>
            <span className="line">中后台管理脚手架</span>
          </h1>
          <p className="intro-desc">
            基于 React 19 + Vite + Ant Design 6 构建，内置 RBAC 权限、动态菜单与丰富的业务示例，
            让你专注于业务本身。
          </p>
          <ul className="intro-features">
            {FEATURES.map((f) => (
              <li className="intro-feature" key={f.text}>
                <span className="anticon">{f.icon}</span>
                {f.text}
              </li>
            ))}
          </ul>
          <div className="intro-footer">© 2026 ReactAdmin · 演示账号 admin / 123456</div>
        </div>
      </section>

      {/* 右侧表单区 */}
      <section className="auth-main">
        <div className="auth-card">
          <div className="auth-brand">
            <div className="brand-logo">R</div>
            <div>
              <div className="brand-name">ReactAdmin</div>
              <div className="brand-sub">企业级中后台管理系统</div>
            </div>
          </div>

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

          <Typography.Paragraph
            type="secondary"
            style={{ marginTop: 16, marginBottom: 0, fontSize: 12 }}
          >
            演示账号：admin / 123456（超级管理员），zhangsan / 123456（部门经理），lisi /
            123456（普通用户）
          </Typography.Paragraph>
        </div>
      </section>
    </div>
  );
}
