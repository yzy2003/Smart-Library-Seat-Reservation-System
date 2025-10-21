import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Space, Button, Table, Tag, Progress } from 'antd';
import {
  BookOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { seatService, reservationService, violationService } from '../services/storage';
import { Reservation, Seat, Violation } from '../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalSeats: 0,
    availableSeats: 0,
    occupiedSeats: 0,
    reservedSeats: 0,
    myReservations: 0,
    violations: 0
  });
  const [recentReservations, setRecentReservations] = useState<Reservation[]>([]);
  const [recentViolations, setRecentViolations] = useState<Violation[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = () => {
    // 获取座位统计
    const seats = seatService.getAllSeats();
    const totalSeats = seats.length;
    const availableSeats = seats.filter(seat => seat.status === 'available').length;
    const occupiedSeats = seats.filter(seat => seat.status === 'occupied').length;
    const reservedSeats = seats.filter(seat => seat.status === 'reserved').length;

    // 获取用户预约统计
    const myReservations = user ? reservationService.getUserReservations(user.id) : [];
    const myReservationCount = myReservations.length;

    // 获取违规统计
    const violations = violationService.getAllViolations();
    const userViolations = user ? violations.filter(v => v.userId === user.id) : [];
    const violationCount = userViolations.length;

    setStats({
      totalSeats,
      availableSeats,
      occupiedSeats,
      reservedSeats,
      myReservations: myReservationCount,
      violations: violationCount
    });

    // 获取最近的预约记录
    const allReservations = reservationService.getAllReservations();
    const recentReservations = allReservations
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    setRecentReservations(recentReservations);

    // 获取最近的违规记录
    const recentViolations = violations
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    setRecentViolations(recentViolations);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'green';
      case 'pending': return 'blue';
      case 'cancelled': return 'red';
      case 'completed': return 'gray';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return '已确认';
      case 'pending': return '待确认';
      case 'cancelled': return '已取消';
      case 'completed': return '已完成';
      default: return status;
    }
  };

  const reservationColumns = [
    {
      title: '座位号',
      dataIndex: 'seatId',
      key: 'seatId',
      render: (seatId: string) => {
        const seat = seatService.getAllSeats().find(s => s.id === seatId);
        return seat?.number || seatId;
      }
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    }
  ];

  const violationColumns = [
    {
      title: '违规类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          'no_show': '未签到',
          'overstay': '超时占用',
          'late_checkin': '迟到',
          'unauthorized_use': '未授权使用'
        };
        return typeMap[type] || type;
      }
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: '处罚',
      dataIndex: 'penalty',
      key: 'penalty'
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
    }
  ];

  return (
    <div>
      <Title level={2}>仪表板</Title>
      
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总座位数"
              value={stats.totalSeats}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="可用座位"
              value={stats.availableSeats}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已占用"
              value={stats.occupiedSeats}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已预约"
              value={stats.reservedSeats}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 使用率 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="座位使用率" extra={<BarChartOutlined />}>
            <div style={{ marginBottom: '16px' }}>
              <Text>总体使用率</Text>
              <Progress
                percent={Math.round(((stats.occupiedSeats + stats.reservedSeats) / stats.totalSeats) * 100)}
                strokeColor="#1890ff"
              />
            </div>
            <div>
              <Text>我的预约数量: {stats.myReservations}</Text>
            </div>
            {stats.violations > 0 && (
              <div style={{ marginTop: '8px' }}>
                <Text type="danger">违规次数: {stats.violations}</Text>
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="快速操作">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button type="primary" block href="/seats">
                预约座位
              </Button>
              <Button block href="/seats">
                查看座位状态
              </Button>
              {user?.role === 'admin' && (
                <>
                  <Button block href="/admin">
                    用户管理
                  </Button>
                  <Button block href="/violations">
                    违规管理
                  </Button>
                </>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 最近预约记录 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="最近预约记录" extra={<BookOutlined />}>
            <Table
              dataSource={recentReservations}
              columns={reservationColumns}
              pagination={false}
              size="small"
              rowKey="id"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="最近违规记录" extra={<ExclamationCircleOutlined />}>
            <Table
              dataSource={recentViolations}
              columns={violationColumns}
              pagination={false}
              size="small"
              rowKey="id"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;