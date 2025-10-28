import React from 'react';
import { Modal, Form, InputNumber, Input, Button, message, Space, Typography } from 'antd';
import { PauseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { TempReleaseForm } from '../types';

const { Text } = Typography;

interface TempReleaseModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (values: TempReleaseForm) => void;
  loading?: boolean;
}

const TempReleaseModal: React.FC<TempReleaseModalProps> = ({
  visible,
  onCancel,
  onConfirm,
  loading = false
}) => {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onConfirm(values);
      form.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={
        <Space>
          <PauseCircleOutlined style={{ color: '#1890ff' }} />
          <span>临时释放座位</span>
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
          icon={<PauseCircleOutlined />}
        >
          确认释放
        </Button>,
      ]}
      width={500}
    >
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">
          <ClockCircleOutlined /> 临时释放座位后，其他用户可以预约该座位。
          请在设定时间内返回，否则座位将被自动释放。
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          duration: 30,
          reason: ''
        }}
      >
        <Form.Item
          name="duration"
          label="临时释放时长"
          rules={[
            { required: true, message: '请选择临时释放时长' },
            { type: 'number', min: 5, max: 120, message: '时长必须在5-120分钟之间' }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={5}
            max={120}
            addonAfter="分钟"
            placeholder="请输入临时释放时长"
          />
        </Form.Item>

        <Form.Item
          name="reason"
          label="临时释放原因"
          rules={[
            { required: true, message: '请输入临时释放原因' },
            { max: 100, message: '原因描述不能超过100个字符' }
          ]}
        >
          <Input.TextArea
            rows={3}
            placeholder="请简要说明临时释放的原因（如：用餐、休息、接电话等）"
            maxLength={100}
            showCount
          />
        </Form.Item>
      </Form>

      <div style={{ 
        padding: '12px', 
        backgroundColor: '#f6ffed', 
        border: '1px solid #b7eb8f', 
        borderRadius: '6px',
        marginTop: '16px'
      }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          <strong>注意事项：</strong><br />
          • 临时释放期间，座位可能被其他用户预约<br />
          • 请在设定时间内返回并重新签到<br />
          • 超时未返回将自动取消预约<br />
          • 临时释放期间不计入使用时间
        </Text>
      </div>
    </Modal>
  );
};

export default TempReleaseModal;
