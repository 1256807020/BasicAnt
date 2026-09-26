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
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { App, Form, Input, Tabs, Typography } from 'antd';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import Lenis from 'lenis';
import { Lottie } from 'lottie-react';
import { fetchCaptcha, login, register } from '@/api/rbac';
import { useAppStore } from '@/store/useAppStore';
import MotionButton from '@/components/MotionButton';
import LangSwitch from '@/components/LangSwitch';
import ThemeSwitch from '@/components/ThemeSwitch';
import { setRefreshToken } from '@/utils/auth';
import './login.css';

interface LoginFormValues {
  username: string;
  password: string;
  captchaId?: string;
  captcha?: string;
}

interface RegisterFormValues {
  username: string;
  password: string;
  confirmPassword: string;
  nickname?: string;
  captchaId?: string;
  captcha?: string;
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
  const resolvedTheme = useAppStore((state) => state.theme);
  const { message } = App.useApp();
  const [captcha, setCaptcha] = useState<{ captchaId: string; image: string } | null>(null);

  const refreshCaptcha = async () => {
    try {
      setCaptcha(await fetchCaptcha());
    } catch {
      // 验证码获取失败不阻断登录
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const c = await fetchCaptcha();
        if (active) setCaptcha(c);
      } catch {
        // 验证码获取失败不阻断登录
      }
    })();
    return () => {
      active = false;
    };
  }, [activeTab]);

  const root = useRef<HTMLDivElement>(null);

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
      tl.from('.intro-lottie', {
        scale: 0.55,
        autoAlpha: 0,
        duration: 0.9,
        ease: 'back.out(1.5)',
      })
        .from('.intro-badge', { y: 24, autoAlpha: 0, duration: 0.6 }, '-=0.5')
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
      // Lottie 装饰：极缓慢浮动，与光斑节奏错开，避免整体同步显得机械
      gsap.to('.intro-lottie', { y: -18, duration: 8, repeat: -1, yoyo: true, ease: 'sine.inOut' });

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
      const res = await login(values);
      setAuth(res.token, res.userInfo);
      if (res.refreshToken) setRefreshToken(res.refreshToken);
      message.success(`欢迎回来，${res.userInfo.nickname}`);
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
        captchaId: captcha?.captchaId,
        captcha: values.captcha,
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
    <div
      className={`auth-page${resolvedTheme === 'dark' ? ' dark' : ''}`}
      ref={root}
      style={{ '--brand': colorPrimary } as CSSProperties}
    >
      {/* 语言 / 主题切换（与 AppHeader 共用组件） */}
      <div className="theme-switch">
        <LangSwitch />
        <ThemeSwitch />
      </div>

      {/* 左侧介绍区 */}
      <section className="auth-aside">
        <div className="intro-bg" />
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        {/* 品牌装饰动画：Lottie（仅在有滚动/视差的介绍区作为氛围点缀，不参与布局） */}
        <div className="intro-lottie" aria-hidden>
          <Lottie src="/lottie/hero.json" loop autoplay />
        </div>
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
          <div className="intro-footer">© 2026 ReactAdmin · 演示账号 admin / BasicNest@123</div>
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
              initialValues={{ username: 'admin', password: 'BasicNest@123' }}
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
              <div style={{ textAlign: 'right', marginBottom: 12 }}>
                <Link to="/forgot">忘记密码？</Link>
              </div>
              <Form.Item name="captcha" rules={[{ required: true, message: '请输入验证码' }]}>
                <Input
                  prefix={<SafetyCertificateOutlined />}
                  placeholder="图形验证码"
                  addonAfter={
                    <span
                      style={{ cursor: 'pointer', display: 'inline-block', lineHeight: 0 }}
                      onClick={refreshCaptcha}
                      dangerouslySetInnerHTML={{ __html: captcha?.image ?? '' }}
                    />
                  }
                />
              </Form.Item>
              <MotionButton type="primary" htmlType="submit" block loading={submitting}>
                登录
              </MotionButton>
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
                  { min: 8, message: '密码至少 8 位' },
                  { pattern: /[A-Za-z]/, message: '密码需包含字母' },
                  { pattern: /\d/, message: '密码需包含数字' },
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
              <Form.Item name="captcha" rules={[{ required: true, message: '请输入验证码' }]}>
                <Input
                  prefix={<SafetyCertificateOutlined />}
                  placeholder="图形验证码"
                  addonAfter={
                    <span
                      style={{ cursor: 'pointer', display: 'inline-block', lineHeight: 0 }}
                      onClick={refreshCaptcha}
                      dangerouslySetInnerHTML={{ __html: captcha?.image ?? '' }}
                    />
                  }
                />
              </Form.Item>
              <MotionButton type="primary" htmlType="submit" block loading={submitting}>
                注册
              </MotionButton>
            </Form>
          )}

          <Typography.Paragraph
            type="secondary"
            style={{ marginTop: 16, marginBottom: 0, fontSize: 12 }}
          >
            演示账号：admin / BasicNest@123（超级管理员），zhangsan /
            BasicNest@123（部门经理），lisi / BasicNest@123（普通用户）
          </Typography.Paragraph>
        </div>
      </section>
    </div>
  );
}
