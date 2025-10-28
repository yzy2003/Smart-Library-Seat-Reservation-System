import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Typography, Tag, Modal, message, Alert, Progress } from 'antd';
import { 
  PauseCircleOutlined, 
  PlayCircleOutlined, 
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { reservationService } from '../services/storage';
import type { Reservation } from '../types';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

const TempReleaseManager: React.FC = () => {
  const { user } = useAuth();
  const [tempReleasedReservations, setTempReleasedReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadTempReleasedReservations();
    }
  }, [user]);

  const loadTempReleasedReservations = () => {
    if (!user) return;
    
    const tempReservations = reservationService.getTempReleasedReservations(user.id);
    setTempReleasedReservations(tempReservations);
  };

  const handleResumeSeat = (reservationId: string) => {
    Modal.confirm({
      title: '恢复座位使用',
      content: '确认要恢复该座位的使用吗？',
      icon: <PlayCircleOutlined />,
      onOk: async () => {
        setLoading(true);
        try {
          const success = reservationService.resumeTempReleasedSeat(reservationId);
          if (success) {
            message.success('座位已恢复使用！');
            loadTempReleasedReservations();
          } else {
            message.error('恢复失败，请重试！');
          }
        } catch (error) {
          message.error('操作失败，请重试！');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const getRemainingTime = (expiryTime: string) => {
    const now = dayjs();
    const expiry = dayjs(expiryTime);
    const diffMinutes = expiry.diff(now, 'minute');
    
    if (diffMinutes <= 0) {
      return { text: '已过期', color: 'red', progress: 100 };
    }
    
    const totalMinutes = 30; // 假设默认30分钟
    const remainingPercent = (diffMinutes / totalMinutes) * 100;
    
    let color = 'green';
    if (diffMinutes <= 5) color = 'red';
    else if (diffMinutes <= 10) color = 'orange';
    
    return {
      text: `${diffMinutes}分钟`,
      color,
      progress: 100 - remainingPercent
    };
  };

  const formatTime = (timeString: string) => {
    return dayjs(timeString).format('HH:mm:ss');
  };

  if (!user) {
    return <div>请先登录</div>;
  }

  return (
    <div>
      <Title level={4}>
        <PauseCircleOutlined /> 临时释放管理
      </Title>
      
      {tempReleasedReservations.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <PauseCircleOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
            <div style={{ marginTop: '16px' }}>
              <Text type="secondary">暂无临时释放的座位</Text>
            </div>
          </div>
        </Card>
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {tempReleasedReservations.map((reservation) => {
            const remaining = reservation.tempReleaseExpiryTime 
              ? getRemainingTime(reservation.tempReleaseExpiryTime)
              : { text: '未知', color: 'default', progress: 0 };

            return (
              <Card
                key={reservation.id}
                title={
                  <Space>
                    <PauseCircleOutlined style={{ color: '#1890ff' }} />
                    <span>座位 {reservation.seatId}</span>
                    <Tag color="blue">临时释放</Tag>
                  </Space>
                }
                extra={
                  <Space>
                    <Button
                      type="primary"
                      icon={<PlayCircleOutlined />}
                      onClick={() => handleResumeSeat(reservation.id)}
                      loading={loading}
                    >
                      恢复使用
                    </Button>
                  </Space>
                }
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text strong>释放时间：</Text>
                    <Text>{reservation.tempReleaseTime ? formatTime(reservation.tempReleaseTime) : '未知'}</Text>
                  </div>
                  
                  <div>
                    <Text strong>释放原因：</Text>
                    <Text>{reservation.tempReleaseReason || '未填写'}</Text>
                  </div>
                  
                  <div>
                    <Text strong>释放时长：</Text>
                    <Text>{reservation.tempReleaseDuration || 0}分钟</Text>
                  </div>
                  
                  <div>
                    <Text strong>剩余时间：</Text>
                    <Tag color={remaining.color}>{remaining.text}</Tag>
                  </div>
                  
                  {reservation.tempReleaseExpiryTime && (
                    <div>
                      <Text strong>到期时间：</Text>
                      <Text>{formatTime(reservation.tempReleaseExpiryTime)}</Text>
                    </div>
                  )}
                  
                  <Progress
                    percent={remaining.progress}
                    strokeColor={remaining.color === 'red' ? '#ff4d4f' : remaining.color === 'orange' ? '#faad14' : '#52c41a'}
                    showInfo={false}
                    size="small"
                  />
                  
                  {remaining.text === '已过期' && (
                    <Alert
                      message="座位已过期"
                      description="临时释放时间已到，座位已被自动释放。如需继续使用，请重新预约。"
                      type="warning"
                      icon={<ExclamationCircleOutlined />}
                      showIcon
                    />
                  )}
                  
                  {remaining.color === 'red' && remaining.text !== '已过期' && (
                    <Alert
                      message="即将过期"
                      description="座位临时释放即将到期，请尽快返回或恢复使用。"
                      type="warning"
                      icon={<ClockCircleOutlined />}
                      showIcon
                    />
                  )}
                </Space>
              </Card>
            );
          })}
        </Space>
      )}
    </div>
  );
};

export default TempReleaseManager;
