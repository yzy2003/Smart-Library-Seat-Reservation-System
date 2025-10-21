import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Select, DatePicker, Table, Progress } from 'antd';
import {
  BookOutlined,
  UserOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  RiseOutlined
} from '@ant-design/icons';
import { seatService, reservationService, userService, areaService } from '../services/storage';
import { Seat, Reservation, User, Area } from '../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const Statistics: React.FC = () => {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs()
  ]);
  const [stats, setStats] = useState({
    totalSeats: 0,
    totalUsers: 0,
    totalReservations: 0,
    utilizationRate: 0,
    popularAreas: [] as Array<{ areaId: string; areaName: string; count: number }>,
    dailyStats: [] as Array<{ date: string; reservations: number; utilization: number }>
  });

  useEffect(() => {
    loadStatistics();
  }, [dateRange]);

  const loadStatistics = () => {
    const seats = seatService.getAllSeats();
    const users = userService.getAllUsers();
    const reservations = reservationService.getAllReservations();
    const areas = areaService.getAllAreas();

    // 基础统计
    const totalSeats = seats.length;
    const totalUsers = users.length;
    const totalReservations = reservations.length;
    
    // 使用率计算
    const occupiedSeats = seats.filter(seat => seat.status === 'occupied' || seat.status === 'reserved').length;
    const utilizationRate = totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0;

    // 热门区域统计
    const areaStats = areas.map(area => {
      const areaReservations = reservations.filter(res => {
        const seat = seats.find(s => s.id === res.seatId);
        return seat?.area === area.id;
      });
      return {
        areaId: area.id,
        areaName: area.name,
        count: areaReservations.length
      };
    }).sort((a, b) => b.count - a.count);

    // 每日统计
    const dailyStats = [];
    const startDate = dateRange[0];
    const endDate = dateRange[1];
    
    for (let date = startDate; date.isBefore(endDate) || date.isSame(endDate, 'day'); date = date.add(1, 'day')) {
      const dayReservations = reservations.filter(res => 
        dayjs(res.createdAt).isSame(date, 'day')
      );
      
      const dayOccupiedSeats = seats.filter(seat => {
        const seatReservations = reservations.filter(res => 
          res.seatId === seat.id && 
          dayjs(res.createdAt).isSame(date, 'day')
        );
        return seatReservations.length > 0;
      }).length;
      
      dailyStats.push({
        date: date.format('YYYY-MM-DD'),
        reservations: dayReservations.length,
        utilization: totalSeats > 0 ? Math.round((dayOccupiedSeats / totalSeats) * 100) : 0
      });
    }

    setStats({
      totalSeats,
      totalUsers,
      totalReservations,
      utilizationRate,
      popularAreas: areaStats,
      dailyStats
    });
  };

  const dailyColumns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: '预约数量',
      dataIndex: 'reservations',
      key: 'reservations',
      render: (count: number) => (
        <Text style={{ color: count > 0 ? '#1890ff' : '#999' }}>
          {count}
        </Text>
      )
    },
    {
      title: '使用率',
      dataIndex: 'utilization',
      key: 'utilization',
      render: (rate: number) => (
        <div>
          <Progress 
            percent={rate} 
            size="small" 
            strokeColor={rate > 80 ? '#52c41a' : rate > 50 ? '#fa8c16' : '#f5222d'}
          />
          <Text style={{ marginLeft: '8px' }}>{rate}%</Text>
        </div>
      )
    }
  ];

  const areaColumns = [
    {
      title: '区域名称',
      dataIndex: 'areaName',
      key: 'areaName',
    },
    {
      title: '预约次数',
      dataIndex: 'count',
      key: 'count',
      render: (count: number) => (
        <Text style={{ color: '#1890ff', fontWeight: 'bold' }}>
          {count}
        </Text>
      )
    },
    {
      title: '占比',
      key: 'percentage',
      render: (_: any, record: any) => {
        const percentage = stats.totalReservations > 0 
          ? Math.round((record.count / stats.totalReservations) * 100) 
          : 0;
        return (
          <div>
            <Progress 
              percent={percentage} 
              size="small" 
              strokeColor="#1890ff"
            />
            <Text style={{ marginLeft: '8px' }}>{percentage}%</Text>
          </div>
        );
      }
    }
  ];

  return (
    <div>
      <Title level={2}>数据统计</Title>
      
      {/* 时间范围选择 */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col>
            <Text strong>统计时间范围：</Text>
          </Col>
          <Col>
            <RangePicker
              value={dateRange}
              onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
            />
          </Col>
        </Row>
      </Card>

      {/* 总体统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="总座位数"
              value={stats.totalSeats}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="总预约数"
              value={stats.totalReservations}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="使用率"
              value={stats.utilizationRate}
              suffix="%"
              prefix={<RiseOutlined />}
              valueStyle={{ 
                color: stats.utilizationRate > 80 ? '#52c41a' : 
                       stats.utilizationRate > 50 ? '#fa8c16' : '#f5222d' 
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* 使用率图表 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="整体使用率" extra={<BarChartOutlined />}>
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Progress
                type="circle"
                percent={stats.utilizationRate}
                strokeColor={stats.utilizationRate > 80 ? '#52c41a' : 
                           stats.utilizationRate > 50 ? '#fa8c16' : '#f5222d'}
                size={120}
              />
              <div style={{ marginTop: '16px' }}>
                <Text type="secondary">
                  {stats.utilizationRate > 80 ? '使用率较高' : 
                   stats.utilizationRate > 50 ? '使用率中等' : '使用率较低'}
                </Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="热门区域排行" extra={<BarChartOutlined />}>
            <Table
              dataSource={stats.popularAreas.slice(0, 5)}
              columns={areaColumns}
              pagination={false}
              size="small"
              rowKey="areaId"
            />
          </Card>
        </Col>
      </Row>

      {/* 每日统计 */}
      <Card title="每日使用统计">
        <Table
          dataSource={stats.dailyStats}
          columns={dailyColumns}
          pagination={{ pageSize: 10 }}
          rowKey="date"
        />
      </Card>
    </div>
  );
};

export default Statistics;