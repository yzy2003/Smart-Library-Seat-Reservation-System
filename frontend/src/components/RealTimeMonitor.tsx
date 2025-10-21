import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Table, Tag, Button, Space, Progress, Alert } from 'antd';
import {
  EyeOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  UserOutlined,
  BookOutlined
} from '@ant-design/icons';
import { reservationService, violationService, seatService, userService } from '../services/storage';
import { violationDetector } from '../services/violationDetector';
import type { Reservation, Violation } from '../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const RealTimeMonitor: React.FC = () => {
  const [monitoringData, setMonitoringData] = useState({
    activeReservations: 0,
    totalSeats: 0,
    occupiedSeats: 0,
    recentViolations: [] as Violation[],
    detectionStatus: {
      isRunning: false,
      rulesCount: 0,
      enabledRulesCount: 0
    }
  });
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadMonitoringData();
    
    if (autoRefresh) {
      const interval = setInterval(loadMonitoringData, 30000); // 30秒刷新一次
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadMonitoringData = () => {
    // 获取活跃预约
    const allReservations = reservationService.getAllReservations();
    const now = dayjs();
    const activeReservations = allReservations.filter(reservation => {
      const startTime = dayjs(reservation.startTime);
      const endTime = dayjs(reservation.endTime);
      return reservation.status === 'confirmed' && 
             now.isAfter(startTime.subtract(30, 'minute')) && 
             now.isBefore(endTime.add(30, 'minute'));
    });

    // 获取座位统计
    const allSeats = seatService.getAllSeats();
    const occupiedSeats = allSeats.filter(seat => 
      seat.status === 'occupied' || seat.status === 'reserved'
    ).length;

    // 获取最近违规
    const allViolations = violationService.getAllViolations();
    const recentViolations = allViolations
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    // 获取检测状态
    const detectionStatus = violationDetector.getDetectionStatus();

    setMonitoringData({
      activeReservations: activeReservations.length,
      totalSeats: allSeats.length,
      occupiedSeats,
      recentViolations,
      detectionStatus
    });
  };

  const handleStartDetection = () => {
    violationDetector.startAutoDetection();
    loadMonitoringData();
  };

  const handleStopDetection = () => {
    violationDetector.stopAutoDetection();
    loadMonitoringData();
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
        const user = userService.getAllUsers().find(u => u.id === userId);
        return user?.name || userId;
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
      title: '检测时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time: string) => dayjs(time).format('MM-DD HH:mm')
    }
  ];

  const utilizationRate = monitoringData.totalSeats > 0 
    ? Math.round((monitoringData.occupiedSeats / monitoringData.totalSeats) * 100) 
    : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2}>实时监控</Title>
        <Space>
          <Button 
            type={monitoringData.detectionStatus.isRunning ? 'default' : 'primary'}
            onClick={monitoringData.detectionStatus.isRunning ? handleStopDetection : handleStartDetection}
          >
            {monitoringData.detectionStatus.isRunning ? '停止检测' : '启动检测'}
          </Button>
          <Button 
            type={autoRefresh ? 'primary' : 'default'}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? '停止自动刷新' : '开启自动刷新'}
          </Button>
        </Space>
      </div>

      {/* 检测状态提示 */}
      {monitoringData.detectionStatus.isRunning && (
        <Alert
          message="违规检测系统正在运行"
          description={`已启用 ${monitoringData.detectionStatus.enabledRulesCount} 个检测规则，系统会每分钟自动检查违规情况`}
          type="success"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* 实时统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="活跃预约"
              value={monitoringData.activeReservations}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="总座位数"
              value={monitoringData.totalSeats}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="已占用"
              value={monitoringData.occupiedSeats}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="使用率"
              value={utilizationRate}
              suffix="%"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ 
                color: utilizationRate > 80 ? '#52c41a' : 
                       utilizationRate > 50 ? '#fa8c16' : '#f5222d' 
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* 使用率图表 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="座位使用率" extra={<EyeOutlined />}>
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Progress
                type="circle"
                percent={utilizationRate}
                strokeColor={utilizationRate > 80 ? '#52c41a' : 
                           utilizationRate > 50 ? '#fa8c16' : '#f5222d'}
                size={120}
              />
              <div style={{ marginTop: '16px' }}>
                <Text type="secondary">
                  {utilizationRate > 80 ? '使用率较高' : 
                   utilizationRate > 50 ? '使用率中等' : '使用率较低'}
                </Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="检测规则状态" extra={<ExclamationCircleOutlined />}>
            <div style={{ marginBottom: '16px' }}>
              <Text>总规则数: {monitoringData.detectionStatus.rulesCount}</Text>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <Text>启用规则: {monitoringData.detectionStatus.enabledRulesCount}</Text>
            </div>
            <div>
              <Text>检测状态: </Text>
              <Tag color={monitoringData.detectionStatus.isRunning ? 'green' : 'red'}>
                {monitoringData.detectionStatus.isRunning ? '运行中' : '已停止'}
              </Tag>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 最近违规记录 */}
      <Card 
        title="最近违规记录" 
        extra={
          <Space>
            <Text type="secondary">自动刷新: {autoRefresh ? '开启' : '关闭'}</Text>
            <Button size="small" onClick={loadMonitoringData}>
              手动刷新
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={monitoringData.recentViolations}
          columns={violationColumns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default RealTimeMonitor;