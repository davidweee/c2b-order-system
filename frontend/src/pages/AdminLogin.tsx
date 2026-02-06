import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Input, Message, Card, Space } from 'tdesign-react';
import { LockOnIcon, DesktopIcon } from 'tdesign-icons-react';
import { api } from '../utils/api';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: any) => {
    e.preventDefault();
    if (!username || !password) {
      Message.error('请填写用户名和密码');
      return;
    }
    setLoading(true);
    try {
      const res = await api.adminLogin(username, password);
      if (res.token) {
        localStorage.setItem('adminToken', res.token);
        localStorage.setItem('admin', JSON.stringify(res.admin));
        Message.success('登录成功');
        navigate('/admin');
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
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      padding: '20px'
    }}>
      <Card style={{ width: '100%', maxWidth: '400px' }} title="后台管理系统">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Form onSubmit={handleLogin} labelWidth={0}>
            <Form.Item>
              <Input
                size="large"
                placeholder="请输入用户名"
                value={username}
                onChange={setUsername}
                prefixIcon={<DesktopIcon />}
              />
            </Form.Item>
            <Form.Item>
              <Input
                size="large"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={setPassword}
                prefixIcon={<LockOnIcon />}
              />
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
          <Button
            variant="text"
            theme="default"
            block
            onClick={() => navigate('/login')}
          >
            返回用户登录
          </Button>
        </Space>
      </Card>
    </div>
  );
}
