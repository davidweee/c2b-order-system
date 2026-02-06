import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tabs,
  Button,
  Table,
  Card,
  Space,
  Tag,
  Dialog,
  Form,
  Input,
  Select,
  Message,
  Popconfirm
} from 'tdesign-react';
import { LogoutIcon, BrowseIcon } from 'tdesign-icons-react';
import { api } from '../utils/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [formData, setFormData] = useState({
    payStatus: '',
    deliveryStatus: '',
    remark: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (activeTab === 'users') {
        const data = await api.adminGetUsers(token!);
        setUsers(data);
      } else {
        const data = await api.adminGetOrders(token!);
        setOrders(data);
      }
    } catch (error) {
      Message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    navigate('/admin/login');
  };

  const handleEditOrder = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await api.adminUpdateOrder(token!, selectedOrder.id, formData);
      Message.success('订单更新成功');
      setEditDialogVisible(false);
      loadData();
    } catch (error) {
      Message.error('更新失败');
    }
  };

  const openEditDialog = (order: any) => {
    setSelectedOrder(order);
    setFormData({
      payStatus: order.payStatus,
      deliveryStatus: order.deliveryStatus,
      remark: order.remark || ''
    });
    setEditDialogVisible(true);
  };

  const userColumns = [
    {
      colKey: 'phone',
      title: '手机号'
    },
    {
      colKey: 'createdAt',
      title: '注册时间',
      render: (data: any) => new Date(data.createdAt).toLocaleString('zh-CN')
    },
    {
      colKey: 'orderCount',
      title: '订单数',
      render: (data: any) => data.orders?.length || 0
    }
  ];

  const orderColumns = [
    {
      colKey: 'orderNo',
      title: '订单号'
    },
    {
      colKey: 'companyName',
      title: '公司名称'
    },
    {
      colKey: 'phone',
      title: '手机号',
      render: (data: any) => data.user?.phone || '-'
    },
    {
      colKey: 'isInitial',
      title: '是否初装',
      render: (data: any) => data.isInitial ? '是' : '否'
    },
    {
      colKey: 'quantity',
      title: '数量'
    },
    {
      colKey: 'payStatus',
      title: '支付状态',
      render: (data: any) => (
        data.payStatus === 'paid' ? <Tag theme="success">已支付</Tag> : <Tag theme="warning">未支付</Tag>
      )
    },
    {
      colKey: 'deliveryStatus',
      title: '交付状态',
      render: (data: any) => (
        data.deliveryStatus === 'delivered' ? <Tag theme="success">已交付</Tag> : <Tag theme="default">未交付</Tag>
      )
    },
    {
      colKey: 'createdAt',
      title: '提交时间',
      render: (data: any) => new Date(data.createdAt).toLocaleString('zh-CN')
    },
    {
      colKey: 'action',
      title: '操作',
      render: (data: any) => (
        <Space>
          <Button
            size="small"
            variant="text"
            theme="primary"
            icon={<BrowseIcon />}
            onClick={() => navigate(`/admin/orders/${data.id}`)}
          >
            详情
          </Button>
          <Button
            size="small"
            variant="text"
            theme="default"
            onClick={() => openEditDialog(data)}
          >
            状态
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '1600px', margin: '0 auto' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>后台管理系统</h2>
          <Button
            theme="default"
            icon={<LogoutIcon />}
            onClick={handleLogout}
          >
            退出登录
          </Button>
        </div>

        <Tabs value={activeTab} onChange={setActiveTab} panelList={[
          {
            value: 'orders',
            label: '订单管理',
            content: <Table
              columns={orderColumns}
              data={orders}
              loading={loading}
              rowKey="id"
            />
          },
          {
            value: 'users',
            label: '用户管理',
            content: <Table
              columns={userColumns}
              data={users}
              loading={loading}
              rowKey="id"
            />
          }
        ]} />
      </Card>

      <Dialog
        header="更新订单状态"
        visible={editDialogVisible}
        onClose={() => setEditDialogVisible(false)}
        onConfirm={handleEditOrder}
        confirmBtn="保存"
      >
        <Form>
          <Form.Item label="支付状态">
            <Select
              value={formData.payStatus}
              onChange={(v) => setFormData({ ...formData, payStatus: v })}
              options={[
                { label: '未支付', value: 'unpaid' },
                { label: '已支付', value: 'paid' }
              ]}
            />
          </Form.Item>
          <Form.Item label="交付状态">
            <Select
              value={formData.deliveryStatus}
              onChange={(v) => setFormData({ ...formData, deliveryStatus: v })}
              options={[
                { label: '未交付', value: 'undelivered' },
                { label: '已交付', value: 'delivered' }
              ]}
            />
          </Form.Item>
          <Form.Item label="备注">
            <Input
              value={formData.remark}
              onChange={(v) => setFormData({ ...formData, remark: v })}
              placeholder="请输入备注"
              multiline
              rows={3}
            />
          </Form.Item>
        </Form>
      </Dialog>
    </div>
  );
}
