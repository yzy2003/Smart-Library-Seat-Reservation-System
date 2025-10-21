import React, { useState, useEffect } from 'react';
import { Card, Table, Switch, Button, Space, Typography, Tag, Modal, Form, Input, Select, message, Row, Col, Statistic } from 'antd';
import {
  SettingOutlined,
  EditOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { violationDetector } from '../services/violationDetector';
import type { ViolationRule } from '../services/violationDetector';

const { Title, Text } = Typography;
const { Option } = Select;

const ViolationRules: React.FC = () => {
  const [rules, setRules] = useState<ViolationRule[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<ViolationRule | null>(null);
  const [detectionStatus, setDetectionStatus] = useState({
    isRunning: false,
    rulesCount: 0,
    enabledRulesCount: 0
  });
  const [form] = Form.useForm();

  useEffect(() => {
    loadRules();
    updateDetectionStatus();
  }, []);

  const loadRules = () => {
    const allRules = violationDetector.getViolationRules();
    setRules(allRules);
  };

  const updateDetectionStatus = () => {
    const status = violationDetector.getDetectionStatus();
    setDetectionStatus(status);
  };

  const handleToggleRule = (ruleId: string, enabled: boolean) => {
    violationDetector.updateViolationRule(ruleId, { enabled });
    loadRules();
    updateDetectionStatus();
    message.success(`规则已${enabled ? '启用' : '禁用'}`);
  };

  const handleEditRule = (rule: ViolationRule) => {
    setEditingRule(rule);
    form.setFieldsValue(rule);
    setEditModalVisible(true);
  };

  const handleSaveRule = async (values: any) => {
    if (editingRule) {
      violationDetector.updateViolationRule(editingRule.id, values);
      message.success('规则已更新');
    }
    setEditModalVisible(false);
    loadRules();
  };

  const handleStartDetection = () => {
    violationDetector.startAutoDetection();
    updateDetectionStatus();
    message.success('违规检测已启动');
  };

  const handleStopDetection = () => {
    violationDetector.stopAutoDetection();
    updateDetectionStatus();
    message.success('违规检测已停止');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'green';
      case 'medium': return 'orange';
      case 'high': return 'red';
      default: return 'default';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'low': return '低';
      case 'medium': return '中';
      case 'high': return '高';
      default: return severity;
    }
  };

  const columns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => (
        <Tag color={getSeverityColor(severity)}>
          {getSeverityText(severity)}
        </Tag>
      )
    },
    {
      title: '自动处理',
      dataIndex: 'autoResolve',
      key: 'autoResolve',
      render: (autoResolve: boolean) => (
        <Tag color={autoResolve ? 'green' : 'default'}>
          {autoResolve ? '是' : '否'}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean, record: ViolationRule) => (
        <Switch
          checked={enabled}
          onChange={(checked) => handleToggleRule(record.id, checked)}
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ViolationRule) => (
        <Space>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEditRule(record)}
          >
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>违规检测规则</Title>
      
      {/* 检测状态 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="检测状态"
              value={detectionStatus.isRunning ? '运行中' : '已停止'}
              prefix={detectionStatus.isRunning ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
              valueStyle={{ 
                color: detectionStatus.isRunning ? '#52c41a' : '#fa8c16' 
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="总规则数"
              value={detectionStatus.rulesCount}
              prefix={<SettingOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="启用规则"
              value={detectionStatus.enabledRulesCount}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 控制按钮 */}
      <Card style={{ marginBottom: '24px' }}>
        <Space>
          <Button 
            type="primary" 
            icon={<PlayCircleOutlined />}
            onClick={handleStartDetection}
            disabled={detectionStatus.isRunning}
          >
            启动检测
          </Button>
          <Button 
            icon={<PauseCircleOutlined />}
            onClick={handleStopDetection}
            disabled={!detectionStatus.isRunning}
          >
            停止检测
          </Button>
        </Space>
        <div style={{ marginTop: '12px' }}>
          <Text type="secondary">
            自动检测系统会每分钟检查一次违规情况，发现违规时自动创建违规记录。
          </Text>
        </div>
      </Card>

      {/* 规则列表 */}
      <Card title="检测规则">
        <Table
          dataSource={rules}
          columns={columns}
          rowKey="id"
          pagination={false}
        />
      </Card>

      {/* 编辑规则模态框 */}
      <Modal
        title="编辑规则"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveRule}
        >
          <Form.Item
            name="name"
            label="规则名称"
            rules={[{ required: true, message: '请输入规则名称!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入描述!' }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item
            name="severity"
            label="严重程度"
            rules={[{ required: true, message: '请选择严重程度!' }]}
          >
            <Select>
              <Option value="low">低</Option>
              <Option value="medium">中</Option>
              <Option value="high">高</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="autoResolve"
            label="自动处理"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
              <Button onClick={() => setEditModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ViolationRules;