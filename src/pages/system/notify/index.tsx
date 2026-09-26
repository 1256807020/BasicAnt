/**
 * 通知广播
 * --------------------------------------------------
 * 管理员向在线用户广播通知（全员或指定用户）。需 system:notify 权限。
 */
import { useEffect, useState } from 'react';
import { App, Button, Card, Checkbox, Form, Input, Select } from 'antd';
import Auth from '@/components/Auth';
import { broadcastNotification, fetchUsers } from '@/api/rbac';

interface FormValues {
  title: string;
  content?: string;
  broadcastAll: boolean;
  userIds?: string[];
}

export default function NotifyBroadcastPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [users, setUsers] = useState<{ label: string; value: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const broadcastAll = Form.useWatch('broadcastAll', form);

  useEffect(() => {
    fetchUsers({ page: 1, pageSize: 500 })
      .then((res) =>
        setUsers(
          res.list.map((u) => ({ label: `${u.nickname}(${u.username})`, value: String(u.id) })),
        ),
      )
      .catch(() => {
        // 拦截器已提示
      });
  }, []);

  const submit = async () => {
    const v = await form.validateFields();
    setSubmitting(true);
    try {
      await broadcastNotification({
        title: v.title,
        content: v.content,
        broadcastAll: v.broadcastAll,
        userIds: v.broadcastAll ? undefined : (v.userIds ?? []),
      });
      message.success('通知已发送');
      form.resetFields();
    } catch {
      // 拦截器已提示
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <Card title="通知广播" style={{ maxWidth: 720 }}>
        <Form form={form} layout="vertical" initialValues={{ broadcastAll: true }}>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="通知标题" />
          </Form.Item>
          <Form.Item name="content" label="内容">
            <Input.TextArea rows={4} placeholder="通知内容" />
          </Form.Item>
          <Form.Item name="broadcastAll" valuePropName="checked">
            <Checkbox>广播给所有用户</Checkbox>
          </Form.Item>
          {!broadcastAll && (
            <Form.Item
              name="userIds"
              label="指定用户"
              rules={[{ required: true, message: '请选择接收用户' }]}
            >
              <Select mode="multiple" options={users} placeholder="选择接收用户" allowClear />
            </Form.Item>
          )}
          <Auth code="system:notify:send">
            <Button type="primary" loading={submitting} onClick={submit}>
              发送通知
            </Button>
          </Auth>
        </Form>
      </Card>
    </div>
  );
}
