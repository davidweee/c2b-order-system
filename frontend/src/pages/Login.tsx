import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Input, Message, Card, Space, Divider, Tag } from 'tdesign-react';
import { LockOnIcon, UserIcon } from 'tdesign-icons-react';
import { api } from '../utils/api';

export default function Login() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleSendCode = async () => {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      Message.error('手机号格式不正确');
      return;
    }
    setSendLoading(true);
    try {
      const res = await api.sendCode(phone);
      if (res.code) {
        Message.success(`验证码：${res.code}（开发阶段）`);
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((c) => {
            if (c <= 1) {
              clearInterval(timer);
              return 0;
            }
            return c - 1;
          });
        }, 1000);
      }
    } catch (error) {
      Message.error('发送验证码失败');
    } finally {
      setSendLoading(false);
    }
  };

  const handleLogin = async (e: any) => {
    e.preventDefault();
    if (!phone || !code) {
      Message.error('请填写手机号和验证码');
      return;
    }
    setLoading(true);
    try {
      const res = await api.login(phone, code);
      if (res.token) {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        Message.success('登录成功');
        navigate('/orders');
      } else {
        Message.error(res.error || '登录失败');
      }
    } catch (error) {
      Message.error('登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <Card style={{ width: '100%', maxWidth: '420px' }} title="C2B订单管理系统">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Tag theme="primary" size="large">用户登录</Tag>
          </div>
          <Form onSubmit={handleLogin} labelWidth={0}>
            <Form.Item>
              <Input
                size="large"
                placeholder="请输入手机号"
                value={phone}
                onChange={setPhone}
                prefixIcon={<UserIcon />}
                maxLength={11}
              />
            </Form.Item>
            <Form.Item>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Input
                  size="large"
                  placeholder="请输入验证码"
                  value={code}
                  onChange={setCode}
                  prefixIcon={<LockOnIcon />}
                  maxLength={6}
                />
                <Button
                  theme="primary"
                  variant="outline"
                  size="small"
                  onClick={handleSendCode}
                  loading={sendLoading}
                  disabled={countdown > 0}
                  style={{ width: '100%' }}
                >
                  {countdown > 0 ? `${countdown}秒后重发` : '获取验证码'}
                </Button>
              </Space>
            </Form.Item>
            <Form.Item>
              <Button
                type="submit"
                theme="primary"
                size="large"
                loading={loading}
                block
              >
                登录
              </Button>
            </Form.Item>
          </Form>
          <Divider />
          <Button
            variant="text"
            theme="primary"
            block
            onClick={() => navigate('/admin/login')}
          >
            管理员登录
          </Button>
        </Space>
      </Card>
    </div>
  );
}
