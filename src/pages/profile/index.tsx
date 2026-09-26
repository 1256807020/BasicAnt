/**
 * 个人中心
 * --------------------------------------------------
 * 基本信息展示 + 修改资料 + 修改密码 + 退出登录
 */

import { LogoutOutlined, SaveOutlined } from '@ant-design/icons';
import {
  App,
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Form,
  Input,
  Row,
  Space,
  Tag,
  Typography,
  Upload,
} from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updatePassword, updateProfile, uploadFile } from '@/api/rbac';
import { useAppStore } from '@/store/useAppStore';
import { usePermission } from '@/hooks/usePermission';

interface ProfileFormValues {
  nickname: string;
  email: string;
  phone: string;
}

interface PasswordFormValues {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const DATA_SCOPE_TEXT: Record<string, string> = {
  all: '全部数据',
  deptAndBelow: '本部门及以下',
  dept: '本部门',
  self: '仅本人',
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const userInfo = useAppStore((state) => state.userInfo);
  const setAuth = useAppStore((state) => state.setAuth);
  const logout = useAppStore((state) => state.logout);
  const { isAdmin, permissions } = usePermission();

  const [saving, setSaving] = useState(false);
  const [changing, setChanging] = useState(false);
  const [form] = Form.useForm<ProfileFormValues>();
  const [passwordForm] = Form.useForm<PasswordFormValues>();

  if (!userInfo) {
    return <Card>请先登录</Card>;
  }

  const saveProfile = async (values: ProfileFormValues) => {
    setSaving(true);
    try {
      const updated = await updateProfile(userInfo.id, values);
      // 局部更新登录态，保持 token 不变
      setAuth(useAppStore.getState().token, { ...userInfo, ...updated });
      message.success('资料已更新');
    } catch {
      // 统一提示已处理
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (values: PasswordFormValues) => {
    setChanging(true);
    try {
      await updatePassword({
        userId: userInfo.id,
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      message.success('密码修改成功，请重新登录');
      passwordForm.resetFields();
    } catch {
      // 统一提示已处理
    } finally {
      setChanging(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="page-container">
      <Card>
        <Space size="large" align="center">
          <Upload
            showUploadList={false}
            beforeUpload={async (file) => {
              try {
                const { url } = await uploadFile(file);
                await updateProfile(userInfo.id, { avatar: url });
                setAuth(useAppStore.getState().token, { ...userInfo, avatar: url });
                message.success('头像已更新');
              } catch {
                // 拦截器已统一提示
              }
              return false;
            }}
          >
            <Avatar
              size={72}
              src={userInfo.avatar}
              style={{ backgroundColor: '#1677ff', fontSize: 28, cursor: 'pointer' }}
            >
              {!userInfo.avatar ? (userInfo.nickname?.slice(0, 1) ?? 'U') : ''}
            </Avatar>
          </Upload>
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {userInfo.nickname}
              {isAdmin ? (
                <Tag color="gold" style={{ marginLeft: 8 }}>
                  超级管理员
                </Tag>
              ) : null}
            </Typography.Title>
            <Typography.Text type="secondary">账号：{userInfo.username}</Typography.Text>
          </div>
        </Space>

        <Divider />

        <Descriptions
          bordered
          column={2}
          size="medium"
          items={[
            { key: 'dept', label: '所属部门', children: userInfo.deptName || '-' },
            { key: 'post', label: '岗位', children: '-' },
            {
              key: 'role',
              label: '角色',
              children: userInfo.roleNames.map((name) => (
                <Tag key={name} color="blue">
                  {name}
                </Tag>
              )),
            },
            {
              key: 'scope',
              label: '数据范围',
              children: DATA_SCOPE_TEXT[userInfo.dataScope] ?? userInfo.dataScope,
            },
            { key: 'email', label: '邮箱', children: userInfo.email || '-' },
            { key: 'phone', label: '手机号', children: userInfo.phone || '-' },
            {
              key: 'perm',
              label: '权限数量',
              span: 2,
              children: (
                <>
                  <Tag color="green">{permissions.length} 项</Tag>
                  <Typography.Text type="secondary">
                    {permissions.slice(0, 6).join('、')}
                    {permissions.length > 6 ? ' …' : ''}
                  </Typography.Text>
                </>
              ),
            },
          ]}
        />
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="修改资料">
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                nickname: userInfo.nickname,
                email: userInfo.email,
                phone: userInfo.phone,
              }}
              onFinish={saveProfile}
            >
              <Form.Item
                name="nickname"
                label="昵称"
                rules={[{ required: true, message: '请输入昵称' }]}
              >
                <Input placeholder="请输入昵称" />
              </Form.Item>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[{ type: 'email', message: '邮箱格式不正确' }]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
              <Form.Item name="phone" label="手机号">
                <Input placeholder="请输入手机号" />
              </Form.Item>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
                保存资料
              </Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="修改密码">
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={changePassword}
              autoComplete="off"
            >
              <Form.Item
                name="oldPassword"
                label="原密码"
                rules={[{ required: true, message: '请输入原密码' }]}
              >
                <Input.Password placeholder="请输入原密码" />
              </Form.Item>
              <Form.Item
                name="newPassword"
                label="新密码"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 8, message: '密码至少 8 位' },
                  { pattern: /[A-Za-z]/, message: '密码需包含字母' },
                  { pattern: /\d/, message: '密码需包含数字' },
                ]}
              >
                <Input.Password placeholder="请输入新密码" />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                label="确认新密码"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: '请确认新密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value)
                        return Promise.resolve();
                      return Promise.reject(new Error('两次输入的密码不一致'));
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="请再次输入新密码" />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={changing}>
                修改密码
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>

      <Card>
        <Button danger icon={<LogoutOutlined />} onClick={handleLogout}>
          退出登录
        </Button>
      </Card>
    </div>
  );
}
