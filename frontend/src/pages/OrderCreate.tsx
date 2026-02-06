import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Form,
  Input,
  Radio,
  InputNumber,
  Upload,
  Card,
  Space,
  Steps,
  Message,
  Dialog,
  Divider
} from 'tdesign-react';
import {
  AddIcon,
  UploadIcon,
  CheckCircleFilledIcon,
  InfoCircleIcon,
  CloseIcon
} from 'tdesign-icons-react';
import { api } from '../utils/api';

const { StepItem } = Steps;

export default function OrderCreate() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<any>({});
  
  const [formData, setFormData] = useState({
    isInitial: true,
    quantity: 1,
    companyName: '',
    creditCode: '',
    bankName: '',
    bankAccount: '',
    authName: '',
    authPhone: '',
    authIdcard: ''
  });

  useEffect(() => {
    if (isEdit) {
      loadOrder();
    }
  }, [id]);

  const loadOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      const order = await api.getOrder(token!, parseInt(id!));
      if (order.id) {
        setFormData({
          isInitial: order.isInitial,
          quantity: order.quantity,
          companyName: order.companyName,
          creditCode: order.creditCode,
          bankName: order.bankName,
          bankAccount: order.bankAccount,
          authName: order.authName,
          authPhone: order.authPhone,
          authIdcard: order.authIdcard
        });
        const imgMap: any = {};
        order.images?.forEach((img: any) => {
          imgMap[img.type] = img.url;
        });
        setImages(imgMap);
      }
    } catch (error) {
      Message.error('加载订单失败');
    }
  };

  const handleSave = async (submit = false) => {
    if (submit && currentStep < 3) {
      Message.warning('请完成所有步骤后再提交');
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (isEdit) {
        await api.updateOrder(token!, parseInt(id!), {
          ...formData,
          status: submit ? 'submitted' : 'draft'
        });
      } else {
        const res = await api.createOrder(token!, {
          ...formData,
          status: submit ? 'submitted' : 'draft'
        });
        if (res.id) {
          if (submit) {
            await api.submitOrder(token!, res.id);
          }
          Message.success(submit ? '订单提交成功' : '订单保存成功');
          navigate('/orders');
          return;
        }
      }
      
      if (submit) {
        await api.submitOrder(token!, parseInt(id!));
        Message.success('订单提交成功');
      } else {
        Message.success('订单保存成功');
      }
      
      navigate('/orders');
    } catch (error) {
      Message.error(submit ? '提交失败' : '保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: any, type: string) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('orderId', isEdit ? id! : '0');
      formData.append('type', type);
      
      const res = await api.uploadImage(token!, formData);
      if (res.url) {
        setImages({ ...images, [type]: res.url });
        Message.success('上传成功');
      }
    } catch (error) {
      Message.error('上传失败');
    }
    return false;
  };

  const showSampleImage = (type: string) => {
    Dialog.alert({
      header: '样例图',
      body: (
        <div style={{ textAlign: 'center' }}>
          <img 
            src="/sample-placeholder.png" 
            alt="样例图" 
            style={{ maxWidth: '100%', maxHeight: '400px' }} 
          />
          <p style={{ marginTop: '10px', color: '#999' }}>
            这是{type === 'license' ? '营业执照' : type === 'auth' ? '授权书' : '身份证'}样例图
          </p>
        </div>
      ),
      confirmBtn: '知道了'
    });
  };

  const steps = [
    {
      title: '产品信息',
      content: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card title="产品选择">
            <Form>
              <Form.Item label="是否初装">
                <Radio.Group 
                  value={formData.isInitial} 
                  onChange={(v) => setFormData({ ...formData, isInitial: v })}
                >
                  <Radio value={true}>是</Radio>
                  <Radio value={false}>否</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item label="加购数量">
                <InputNumber 
                  value={formData.quantity}
                  onChange={(v) => setFormData({ ...formData, quantity: v as number })}
                  min={1}
                  max={100}
                />
              </Form.Item>
            </Form>
          </Card>
        </Space>
      )
    },
    {
      title: '公司信息',
      content: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card title="公司基本信息">
            <Form labelWidth="120px">
              <Form.Item label="公司名称">
                <Input 
                  value={formData.companyName}
                  onChange={(v) => setFormData({ ...formData, companyName: v })}
                  placeholder="请输入公司名称"
                />
              </Form.Item>
              <Form.Item label="统一信用代码">
                <Input 
                  value={formData.creditCode}
                  onChange={(v) => setFormData({ ...formData, creditCode: v })}
                  placeholder="请输入统一信用代码"
                />
              </Form.Item>
              <Form.Item label="营业执照">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Upload
                    theme="image"
                    accept="image/*"
                    requestMethod={(file) => handleImageUpload(file, 'license')}
                  >
                    <Button variant="outline" icon={<UploadIcon />}>
                      上传营业执照（盖章）
                    </Button>
                  </Upload>
                  {images.license && (
                    <Space>
                      <img 
                        src={`${import.meta.env.VITE_API_URL}${images.license}`} 
                        alt="营业执照" 
                        style={{ width: '150px', height: '100px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                      <Button 
                        size="small" 
                        variant="text" 
                        icon={<CloseIcon />}
                        onClick={() => setImages({ ...images, license: '' })}
                      >
                        删除
                      </Button>
                    </Space>
                  )}
                  <Button 
                    size="small" 
                    variant="outline" 
                    icon={<InfoCircleIcon />}
                    onClick={() => showSampleImage('license')}
                  >
                    查看样例
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
          <Card title="银行信息">
            <Form labelWidth="120px">
              <Form.Item label="开户银行">
                <Input 
                  value={formData.bankName}
                  onChange={(v) => setFormData({ ...formData, bankName: v })}
                  placeholder="请输入开户银行"
                />
              </Form.Item>
              <Form.Item label="银行账户">
                <Input 
                  value={formData.bankAccount}
                  onChange={(v) => setFormData({ ...formData, bankAccount: v })}
                  placeholder="请输入银行账户"
                />
              </Form.Item>
            </Form>
          </Card>
        </Space>
      )
    },
    {
      title: '授权信息',
      content: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card title="授权人信息">
            <Form labelWidth="120px">
              <Form.Item label="授权书">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Upload
                    theme="image"
                    accept="image/*"
                    requestMethod={(file) => handleImageUpload(file, 'auth')}
                  >
                    <Button variant="outline" icon={<UploadIcon />}>
                      上传授权书（盖章）
                    </Button>
                  </Upload>
                  {images.auth && (
                    <Space>
                      <img 
                        src={`${import.meta.env.VITE_API_URL}${images.auth}`} 
                        alt="授权书" 
                        style={{ width: '150px', height: '100px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                      <Button 
                        size="small" 
                        variant="text" 
                        icon={<CloseIcon />}
                        onClick={() => setImages({ ...images, auth: '' })}
                      >
                        删除
                      </Button>
                    </Space>
                  )}
                  <Button 
                    size="small" 
                    variant="outline" 
                    icon={<InfoCircleIcon />}
                    onClick={() => showSampleImage('auth')}
                  >
                    查看样例
                  </Button>
                </Space>
              </Form.Item>
              <Form.Item label="授权人姓名">
                <Input 
                  value={formData.authName}
                  onChange={(v) => setFormData({ ...formData, authName: v })}
                  placeholder="请输入授权人姓名"
                />
              </Form.Item>
              <Form.Item label="授权人手机号">
                <Input 
                  value={formData.authPhone}
                  onChange={(v) => setFormData({ ...formData, authPhone: v })}
                  placeholder="请输入授权人手机号"
                />
              </Form.Item>
              <Form.Item label="身份证号码">
                <Input 
                  value={formData.authIdcard}
                  onChange={(v) => setFormData({ ...formData, authIdcard: v })}
                  placeholder="请输入身份证号码"
                />
              </Form.Item>
            </Form>
          </Card>
          <Card title="身份证照片">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <div style={{ marginBottom: '10px' }}>身份证正面</div>
                <Upload
                  theme="image"
                  accept="image/*"
                  requestMethod={(file) => handleImageUpload(file, 'idcard_front')}
                >
                  <Button variant="outline" icon={<UploadIcon />}>
                    上传身份证正面
                  </Button>
                </Upload>
                {images.idcard_front && (
                  <Space style={{ marginTop: '10px' }}>
                    <img 
                      src={`${import.meta.env.VITE_API_URL}${images.idcard_front}`} 
                      alt="身份证正面" 
                      style={{ width: '150px', height: '100px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                    <Button 
                      size="small" 
                      variant="text" 
                      icon={<CloseIcon />}
                      onClick={() => setImages({ ...images, idcard_front: '' })}
                    >
                      删除
                    </Button>
                  </Space>
                )}
              </div>
              <Divider />
              <div>
                <div style={{ marginBottom: '10px' }}>身份证反面</div>
                <Upload
                  theme="image"
                  accept="image/*"
                  requestMethod={(file) => handleImageUpload(file, 'idcard_back')}
                >
                  <Button variant="outline" icon={<UploadIcon />}>
                    上传身份证反面
                  </Button>
                </Upload>
                {images.idcard_back && (
                  <Space style={{ marginTop: '10px' }}>
                    <img 
                      src={`${import.meta.env.VITE_API_URL}${images.idcard_back}`} 
                      alt="身份证反面" 
                      style={{ width: '150px', height: '100px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                    <Button 
                      size="small" 
                      variant="text" 
                      icon={<CloseIcon />}
                      onClick={() => setImages({ ...images, idcard_back: '' })}
                    >
                      删除
                    </Button>
                  </Space>
                )}
              </div>
              <Button 
                size="small" 
                variant="outline" 
                icon={<InfoCircleIcon />}
                onClick={() => showSampleImage('idcard')}
              >
                查看样例
              </Button>
            </Space>
          </Card>
        </Space>
      )
    },
    {
      title: '确认提交',
      content: (
        <Card title="订单确认">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <h4>产品信息</h4>
              <p>是否初装: {formData.isInitial ? '是' : '否'}</p>
              <p>加购数量: {formData.quantity}</p>
            </div>
            <Divider />
            <div>
              <h4>公司信息</h4>
              <p>公司名称: {formData.companyName}</p>
              <p>统一信用代码: {formData.creditCode}</p>
              <p>开户银行: {formData.bankName}</p>
              <p>银行账户: {formData.bankAccount}</p>
              {images.license && <p>营业执照: 已上传</p>}
            </div>
            <Divider />
            <div>
              <h4>授权信息</h4>
              <p>授权人姓名: {formData.authName}</p>
              <p>授权人手机号: {formData.authPhone}</p>
              <p>身份证号码: {formData.authIdcard}</p>
              {images.auth && <p>授权书: 已上传</p>}
              {images.idcard_front && <p>身份证正面: 已上传</p>}
              {images.idcard_back && <p>身份证反面: 已上传</p>}
            </div>
          </Space>
        </Card>
      )
    }
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <Card>
        <Steps current={currentStep} onChange={setCurrentStep}>
          {steps.map((step, index) => (
            <StepItem key={index} title={step.title} />
          ))}
        </Steps>
        <div style={{ marginTop: '40px' }}>
          {steps[currentStep].content}
        </div>
        <Divider />
        <Space>
          {currentStep > 0 && (
            <Button 
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              上一步
            </Button>
          )}
          {currentStep < steps.length - 1 && (
            <Button 
              theme="primary"
              onClick={() => setCurrentStep(currentStep + 1)}
            >
              下一步
            </Button>
          )}
          <Button 
            theme="default"
            loading={loading}
            onClick={() => handleSave(false)}
          >
            保存草稿
          </Button>
          {currentStep === steps.length - 1 && (
            <Button 
              theme="primary"
              loading={submitting}
              onClick={() => handleSave(true)}
            >
              提交订单
            </Button>
          )}
          <Button 
            variant="outline"
            onClick={() => navigate('/orders')}
          >
            取消
          </Button>
        </Space>
      </Card>
    </div>
  );
}
