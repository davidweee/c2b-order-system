import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  Space,
  Tag,
  Descriptions,
  Image,
  Divider,
  Message
} from 'tdesign-react';
import { EditIcon, RollbackIcon } from 'tdesign-icons-react';
import { api } from '../utils/api';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const data = await api.getOrder(token!, parseInt(id!));
      setOrder(data);
    } catch (error) {
      Message.error('加载订单失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/orders/${id}/edit`);
  };

  const handleRevoke = async () => {
    try {
      const token = localStorage.getItem('token');
      await api.revokeOrder(token!, parseInt(id!));
      Message.success('订单已撤回');
      navigate('/orders');
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

  if (!order) return null;

  const imagesByType: any = {};
  order.images?.forEach((img: any) => {
    imagesByType[img.type] = img.url;
  });

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <Card loading={loading}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>订单详情</h2>
          <Space>
            <Button
              theme="default"
              icon={<EditIcon />}
              onClick={handleEdit}
              disabled={order.status === 'submitted'}
            >
              编辑
            </Button>
            {order.status === 'submitted' && order.payStatus === 'unpaid' && (
              <Button
                theme="warning"
                icon={<RollbackIcon />}
                onClick={handleRevoke}
              >
                撤回订单
              </Button>
            )}
            <Button onClick={() => navigate('/orders')}>
              返回
            </Button>
          </Space>
        </div>

        <Descriptions column={2} bordered>
          <Descriptions.Item label="订单号" span={2}>{order.orderNo || '-'}</Descriptions.Item>
          <Descriptions.Item label="状态" span={2}>{getStatusTag(order.status)}</Descriptions.Item>
          {order.status === 'submitted' && (
            <>
              <Descriptions.Item label="支付状态">{getPayStatusTag(order.payStatus)}</Descriptions.Item>
              <Descriptions.Item label="交付状态">{getDeliveryStatusTag(order.deliveryStatus)}</Descriptions.Item>
            </>
          )}
          {order.remark && (
            <Descriptions.Item label="备注" span={2}>{order.remark}</Descriptions.Item>
          )}
          <Descriptions.Item label="是否初装">{order.isInitial ? '是' : '否'}</Descriptions.Item>
          <Descriptions.Item label="加购数量">{order.quantity}</Descriptions.Item>
          <Descriptions.Item label="公司名称" span={2}>{order.companyName}</Descriptions.Item>
          <Descriptions.Item label="统一信用代码" span={2}>{order.creditCode}</Descriptions.Item>
          <Descriptions.Item label="开户银行">{order.bankName}</Descriptions.Item>
          <Descriptions.Item label="银行账户">{order.bankAccount}</Descriptions.Item>
          <Descriptions.Item label="授权人姓名">{order.authName}</Descriptions.Item>
          <Descriptions.Item label="授权人手机号">{order.authPhone}</Descriptions.Item>
          <Descriptions.Item label="身份证号码" span={2}>{order.authIdcard}</Descriptions.Item>
          <Descriptions.Item label="创建时间" span={2}>{new Date(order.createdAt).toLocaleString('zh-CN')}</Descriptions.Item>
        </Descriptions>

        <Divider />

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <h4>营业执照</h4>
            {imagesByType.license ? (
              <Image
                src={`${import.meta.env.VITE_API_URL}${imagesByType.license}`}
                alt="营业执照"
                style={{ width: '300px' }}
              />
            ) : (
              <p style={{ color: '#999' }}>未上传</p>
            )}
          </div>

          <div>
            <h4>授权书</h4>
            {imagesByType.auth ? (
              <Image
                src={`${import.meta.env.VITE_API_URL}${imagesByType.auth}`}
                alt="授权书"
                style={{ width: '300px' }}
              />
            ) : (
              <p style={{ color: '#999' }}>未上传</p>
            )}
          </div>

          <div>
            <h4>身份证照片</h4>
            <Space direction="vertical">
              {imagesByType.idcard_front ? (
                <div>
                  <div style={{ marginBottom: '8px' }}>正面</div>
                  <Image
                    src={`${import.meta.env.VITE_API_URL}${imagesByType.idcard_front}`}
                    alt="身份证正面"
                    style={{ width: '300px' }}
                  />
                </div>
              ) : (
                <p style={{ color: '#999' }}>正面未上传</p>
              )}
              {imagesByType.idcard_back ? (
                <div>
                  <div style={{ marginBottom: '8px' }}>反面</div>
                  <Image
                    src={`${import.meta.env.VITE_API_URL}${imagesByType.idcard_back}`}
                    alt="身份证反面"
                    style={{ width: '300px' }}
                  />
                </div>
              ) : (
                <p style={{ color: '#999' }}>反面未上传</p>
              )}
            </Space>
          </div>
        </Space>
      </Card>
    </div>
  );
}
