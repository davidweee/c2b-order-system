import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Table,
  Card,
  Space,
  Tag,
  Dialog,
  Message,
  Popconfirm
} from 'tdesign-react';
import { AddIcon, ViewIcon, RollbackIcon } from 'tdesign-icons-react';
import { api } from '../utils/api';

export default function OrderList() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const data = await api.getOrders(token!);
      setOrders(data);
    } catch (error) {
      Message.error('加载订单失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      await api.revokeOrder(token!, id);
      Message.success('订单已撤回');
      loadOrders();
    } catch (error) {
      Message.error('撤回失败');
    }
  };

  const getStatusTag = (status: string) => {
    if (status === 'draft') return <Tag theme="default">草稿</Tag>;
    if (status === 'submitted') return <Tag theme="success">已提交</Tag>;
    return <Tag>{status}</Tag>;
  };

  const getPayStatusTag = (status: string) => {
    if (status === 'unpaid') return <Tag theme="warning">未支付</Tag>;
    if (status === 'paid') return <Tag theme="success">已支付</Tag>;
    return <Tag>{status}</Tag>;
  };

  const getDeliveryStatusTag = (status: string) => {
    if (status === 'undelivered') return <Tag theme="default">未交付</Tag>;
    if (status === 'delivered') return <Tag theme="success">已交付</Tag>;
    return <Tag>{status}</Tag>;
  };

  const columns = [
    {
      colKey: 'orderNo',
      title: '订单号',
      render: (data: any) => data.orderNo || '-'
    },
    {
      colKey: 'companyName',
      title: '公司名称'
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
      colKey: 'status',
      title: '状态',
      render: (data: any) => getStatusTag(data.status)
    },
    {
      colKey: 'payStatus',
      title: '支付状态',
      render: (data: any) => data.status === 'submitted' ? getPayStatusTag(data.payStatus) : '-'
    },
    {
      colKey: 'deliveryStatus',
      title: '交付状态',
      render: (data: any) => data.status === 'submitted' ? getDeliveryStatusTag(data.deliveryStatus) : '-'
    },
    {
      colKey: 'createdAt',
      title: '创建时间',
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
            icon={<ViewIcon />}
            onClick={() => navigate(`/orders/${data.id}`)}
          >
            查看
          </Button>
          {data.status === 'submitted' && data.payStatus === 'unpaid' && (
            <Popconfirm
              content="确定要撤回此订单吗？撤回后订单将变为草稿状态，后台将无法看到。"
              onConfirm={() => handleRevoke(data.id)}
            >
              <Button
                size="small"
                variant="text"
                theme="warning"
                icon={<RollbackIcon />}
              >
                撤回
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>我的订单</h2>
          <Button
            theme="primary"
            icon={<AddIcon />}
            onClick={() => navigate('/orders/new')}
          >
            创建订单
          </Button>
        </div>
        <Table
          columns={columns}
          data={orders}
          loading={loading}
          rowKey="id"
        />
      </Card>
    </div>
  );
}
