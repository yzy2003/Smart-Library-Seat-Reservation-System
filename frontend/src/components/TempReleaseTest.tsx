import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Typography, Tag, Alert, Divider, Row, Col } from 'antd';
import { 
  PauseCircleOutlined, 
  PlayCircleOutlined, 
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { reservationService, seatService, areaService } from '../services/storage';
import type { Reservation } from '../types';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const TempReleaseTest: React.FC = () => {
  const { user } = useAuth();
  const [testReservations, setTestReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadTestReservations();
    }
  }, [user]);

  const loadTestReservations = () => {
    if (!user) return;
    
    const reservations = reservationService.getUserReservations(user.id);
    setTestReservations(reservations);
  };

  const createTestReservation = () => {
    if (!user) return;
    
    const now = new Date();
    const startTime = new Date(now.getTime() + 5 * 60 * 1000); // 5分钟后开始
    const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2小时后结束
    
    const testReservation: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: user.id,
      seatId: 'seat-area-001-001',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      status: 'pending',
      notes: '测试预约'
    };
    
    try {
      reservationService.createReservation(testReservation);
      message.success('测试预约创建成功！');
      loadTestReservations();
    } catch (error) {
      message.error('创建测试预约失败！');
    }
  };

  const testCheckIn = (reservation: Reservation) => {
    try {
      reservationService.checkIn(reservation.id);
      message.success('签到成功！');
      loadTestReservations();
    } catch (error) {
      message.error('签到失败！');
    }
  };

  const testTempRelease = (reservation: Reservation) => {
    try {
      const success = reservationService.tempReleaseSeat(
        reservation.id,
        30, // 30分钟
        '测试临时释放'
      );
      
      if (success) {
        message.success('临时释放成功！');
        loadTestReservations();
      } else {
        message.error('临时释放失败！');
      }
    } catch (error) {
      message.error('临时释放失败！');
    }
  };

  const testResume = (reservation: Reservation) => {
    try {
      const success = reservationService.resumeTempReleasedSeat(reservation.id);
      
      if (success) {
        message.success('恢复使用成功！');
        loadTestReservations();
      } else {
        message.error('恢复使用失败！');
      }
    } catch (error) {
      message.error('恢复使用失败！');
    }
  };

  const testCheckOut = (reservation: Reservation) => {
    try {
      reservationService.checkOut(reservation.id);
      message.success('签退成功！');
      loadTestReservations();
    } catch (error) {
      message.error('签退失败！');
    }
  };

  const getReservationStatus = (reservation: Reservation) => {
    const now = dayjs();
    const startTime = dayjs(reservation.startTime);
    const endTime = dayjs(reservation.endTime);
    
    if (reservation.status === 'temporarily_released') {
      if (reservation.tempReleaseExpiryTime) {
        const expiryTime = dayjs(reservation.tempReleaseExpiryTime);
        if (now.isAfter(expiryTime)) {
          return { text: '临时释放已过期', color: 'red' };
        }
        return { text: '临时释放中', color: 'blue' };
      }
      return { text: '临时释放中', color: 'blue' };
    }
    
    if (reservation.checkOutTime) {
      return { text: '已完成', color: 'gray' };
    }
    
    if (reservation.checkInTime) {
      if (now.isAfter(endTime)) {
        return { text: '已超时', color: 'red' };
      }
      return { text: '已签到', color: 'green' };
    }
    
    if (now.isBefore(startTime.subtract(15, 'minute'))) {
      return { text: '即将开始', color: 'blue' };
    }
    
    return { text: '可签到', color: 'green' };
  };

  const getRemainingTime = (expiryTime: string) => {
    const now = dayjs();
    const expiry = dayjs(expiryTime);
    const diffMinutes = expiry.diff(now, 'minute');
    
    if (diffMinutes <= 0) {
      return '已过期';
    }
    
    return `${diffMinutes}分钟`;
  };

  if (!user) {
    return <div>请先登录</div>;
  }

  return (
    <div>
      <Title level={4}>
        <PauseCircleOutlined /> 临时释放功能测试
      </Title>
      
      <Alert
        message="测试说明"
        description="此页面用于测试临时释放座位功能。请按顺序执行：1. 创建测试预约 2. 签到 3. 临时释放 4. 恢复使用 5. 签退"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button type="primary" onClick={createTestReservation}>
            创建测试预约
          </Button>
          <Button onClick={loadTestReservations}>
            刷新数据
          </Button>
        </Space>
      </Card>

      {testReservations.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <ClockCircleOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
            <div style={{ marginTop: '16px' }}>
              <Text type="secondary">暂无预约记录</Text>
            </div>
          </div>
        </Card>
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {testReservations.map((reservation) => {
            const status = getReservationStatus(reservation);
            const canCheckIn = reservation.status === 'pending' && !reservation.checkInTime;
            const canCheckOut = reservation.status === 'confirmed' && reservation.checkInTime && !reservation.checkOutTime;
            const canTempRelease = reservation.status === 'confirmed' && reservation.checkInTime && !reservation.checkOutTime;
            const canResume = reservation.status === 'temporarily_released';
            
            return (
              <Card
                key={reservation.id}
                title={
                  <Space>
                    <ClockCircleOutlined />
                    <span>预约 {reservation.id}</span>
                    <Tag color={status.color}>{status.text}</Tag>
                  </Space>
                }
              >
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <div>
                      <Text strong>座位ID：</Text>
                      <Text>{reservation.seatId}</Text>
                    </div>
                    <div>
                      <Text strong>开始时间：</Text>
                      <Text>{dayjs(reservation.startTime).format('MM-DD HH:mm')}</Text>
                    </div>
                    <div>
                      <Text strong>结束时间：</Text>
                      <Text>{dayjs(reservation.endTime).format('MM-DD HH:mm')}</Text>
                    </div>
                    {reservation.checkInTime && (
                      <div>
                        <Text strong>签到时间：</Text>
                        <Text>{dayjs(reservation.checkInTime).format('MM-DD HH:mm')}</Text>
                      </div>
                    )}
                    {reservation.tempReleaseTime && (
                      <div>
                        <Text strong>临时释放时间：</Text>
                        <Text>{dayjs(reservation.tempReleaseTime).format('MM-DD HH:mm')}</Text>
                      </div>
                    )}
                    {reservation.tempReleaseExpiryTime && (
                      <div>
                        <Text strong>到期时间：</Text>
                        <Text>{dayjs(reservation.tempReleaseExpiryTime).format('MM-DD HH:mm')}</Text>
                        <Text type="secondary">（剩余：{getRemainingTime(reservation.tempReleaseExpiryTime)}）</Text>
                      </div>
                    )}
                  </Col>
                  
                  <Col span={12}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {canCheckIn && (
                        <Button
                          type="primary"
                          icon={<CheckCircleOutlined />}
                          onClick={() => testCheckIn(reservation)}
                          block
                        >
                          签到
                        </Button>
                      )}
                      
                      {canTempRelease && (
                        <Button
                          type="default"
                          icon={<PauseCircleOutlined />}
                          onClick={() => testTempRelease(reservation)}
                          block
                        >
                          临时释放（30分钟）
                        </Button>
                      )}
                      
                      {canResume && (
                        <Button
                          type="primary"
                          icon={<PlayCircleOutlined />}
                          onClick={() => testResume(reservation)}
                          block
                        >
                          恢复使用
                        </Button>
                      )}
                      
                      {canCheckOut && (
                        <Button
                          type="default"
                          icon={<ClockCircleOutlined />}
                          onClick={() => testCheckOut(reservation)}
                          block
                        >
                          签退
                        </Button>
                      )}
                    </Space>
                  </Col>
                </Row>
                
                {reservation.tempReleaseReason && (
                  <Divider />
                  <div>
                    <Text strong>临时释放原因：</Text>
                    <Text>{reservation.tempReleaseReason}</Text>
                  </div>
                )}
              </Card>
            );
          })}
        </Space>
      )}
    </div>
  );
};

export default TempReleaseTest;
