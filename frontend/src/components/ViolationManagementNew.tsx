import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Typography, Tag, Modal, Form, Input, Select, message, Row, Col, Statistic, Tabs } from 'antd';
import {
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  UserOutlined,
  ClockCircleOutlined,
  SettingOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { violationService, userService, reservationService } from '../services/storage';
import { violationDetector } from '../services/violationDetector';
import ViolationRules from './ViolationRules';
import RealTimeMonitor from './RealTimeMonitor';
import type { Violation, User } from '../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const ViolationManagement: React.FC = () => {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [violationForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('records');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allViolations = violationService.getAllViolations();
    const allUsers = userService.getAllUsers();
    
    setViolations(allViolations);
    setUsers(allUsers);
  };

  const handleAddViolation = () => {
    violationForm.resetFields();
    setAddModalVisible(true);
  };

  const handleResolveViolation = (violationId: string) => {
    const currentUser = userService.getAllUsers().find(u => u.role === 'admin');
    if (currentUser) {
      violationService.resolveViolation(violationId, currentUser.id);
      message.success('违规记录已处理！');
      loadData();
    }
  };

  const handleAddViolationSubmit = async (values: any) => {
    try {
      violationService.addViolation(values);
      message.success('违规记录添加成功！');
      setAddModalVisible(false);
      loadData();
    } catch (error) {
      message.error('添加失败，请重试！');
    }
  };

  const getViolationTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      'no_show': '未签到',
      'overstay': '超时占用',
      'late_checkin': '迟到',
      'unauthorized_use': '未授权使用',
      'frequent_cancellation': '频繁取消',
      'unauthorized_extension': '未授权延长'
    };
    return typeMap[type] || type;
  };

  const getViolationTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      'no_show': 'orange',
      'overstay': 'red',
      'late_checkin': 'blue',
      'unauthorized_use': 'purple',
      'frequent_cancellation': 'volcano',
      'unauthorized_extension': 'red'
    };
    return colorMap[type] || 'default';
  };

  const violationColumns = [
    {
      title: '用户',
      dataIndex: 'userId',
      key: 'userId',
      render: (userId: string) => {
        const user = users.find(u => u.id === userId);
        return (
          <div>
            <div>{user?.name || '未知用户'}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {user?.username}
            </Text>
          </div>
        );
      }
    },
    {
      title: '违规类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={getViolationTypeColor(type)}>
          {getViolationTypeText(type)}
        </Tag>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '处罚措施',
      dataIndex: 'penalty',
      key: 'penalty',
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'isResolved',
      key: 'isResolved',
      render: (isResolved: boolean) => (
        <Tag color={isResolved ? 'green' : 'red'}>
          {isResolved ? '已处理' : '待处理'}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '处理时间',
      dataIndex: 'resolvedAt',
      key: 'resolvedAt',
      render: (time: string) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Violation) => (
        <Space>
          {!record.isResolved && (
            <Button 
              type="link" 
              icon={<CheckCircleOutlined />}
              onClick={() => handleResolveViolation(record.id)}
            >
              处理
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const stats = {
    total: violations.length,
    resolved: violations.filter(v => v.isResolved).length,
    pending: violations.filter(v => !v.isResolved).length,
    today: violations.filter(v => dayjs(v.createdAt).isSame(dayjs(), 'day')).length
  };

  const tabItems = [
    {
      key: 'records',
      label: '违规记录',
      icon: <ExclamationCircleOutlined />,
      children: (
        <div>
          {/* 统计信息 */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="总违规数"
                  value={stats.total}
                  prefix={<ExclamationCircleOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="已处理"
                  value={stats.resolved}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="待处理"
                  value={stats.pending}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="今日新增"
                  value={stats.today}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>

          {/* 违规记录表格 */}
          <Card 
            title="违规记录"
            extra={
              <Button type="primary" onClick={handleAddViolation}>
                添加违规记录
              </Button>
            }
          >
            <Table
              dataSource={violations}
              columns={violationColumns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 800 }}
            />
          </Card>
        </div>
      )
    },
    {
      key: 'rules',
      label: '检测规则',
      icon: <SettingOutlined />,
      children: <ViolationRules />
    },
    {
      key: 'monitor',
      label: '实时监控',
      icon: <EyeOutlined />,
      children: <RealTimeMonitor />
    }
  ];

  return (
    <div>
      <Title level={2}>违规管理</Title>
      
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
      />

      {/* 添加违规记录模态框 */}
      <Modal
        title="添加违规记录"
        open={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        footer={null}
      >
        <Form
          form={violationForm}
          layout="vertical"
          onFinish={handleAddViolationSubmit}
        >
          <Form.Item
            name="userId"
            label="用户"
            rules={[{ required: true, message: '请选择用户!' }]}
          >
            <Select placeholder="选择用户">
              {users.map(user => (
                <Option key={user.id} value={user.id}>
                  {user.name} ({user.username})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="type"
            label="违规类型"
            rules={[{ required: true, message: '请选择违规类型!' }]}
          >
            <Select placeholder="选择违规类型">
              <Option value="no_show">未签到</Option>
              <Option value="overstay">超时占用</Option>
              <Option value="late_checkin">迟到</Option>
              <Option value="unauthorized_use">未授权使用</Option>
              <Option value="frequent_cancellation">频繁取消</Option>
              <Option value="unauthorized_extension">未授权延长</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入描述!' }]}
          >
            <Input.TextArea rows={3} placeholder="请输入违规描述" />
          </Form.Item>

          <Form.Item
            name="penalty"
            label="处罚措施"
            rules={[{ required: true, message: '请输入处罚措施!' }]}
          >
            <Input.TextArea rows={2} placeholder="请输入处罚措施" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                添加
              </Button>
              <Button onClick={() => setAddModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ViolationManagement;