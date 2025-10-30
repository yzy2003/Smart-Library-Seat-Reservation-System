import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Space, Button, message } from 'antd';
import SeatVisualization from './SeatVisualization';
import { seatService, areaService } from '../services/storage';
import type { Seat, Area } from '../types';
import { FEATURE_META } from '../constants/seatFeatures';
import type { SeatFeature } from '../constants/seatFeatures';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

const SeatManagement: React.FC = () => {
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allAreas = areaService.getAllAreas();
    const allSeats = seatService.getAllSeats();
    setAreas(allAreas);
    setSeats(allSeats);
  };

  const handleSeatSelect = (seat: Seat) => {
    setSelectedSeat(seat);
  };

  const refreshAfterAdminUpdate = (updatedId: string) => {
    const allSeats = seatService.getAllSeats();
    setSeats(allSeats);
    if (selectedSeat && selectedSeat.id === updatedId) {
      const latest = allSeats.find(s => s.id === updatedId) || null;
      setSelectedSeat(latest);
    }
  };

  const adminSetStatus = (status: Seat['status']) => {
    if (!user || user.role !== 'admin' || !selectedSeat) return;
    const updated = seatService.adminUpdateSeatStatus(selectedSeat.id, status);
    if (updated) {
      message.success('座位状态已更新');
      refreshAfterAdminUpdate(selectedSeat.id);
    } else {
      message.error('更新失败');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>座位管理</Title>
        <Text type="secondary">
          点击座位查看详细信息，绿色表示可用，橙色表示占用，紫色表示已预约，红色表示维护中
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <SeatVisualization 
            onSeatSelect={handleSeatSelect}
            selectedSeat={selectedSeat}
            seatsList={seats}
          />
        </Col>
        
        <Col xs={24} lg={8}>
          <Card title="座位信息" style={{ marginBottom: '16px' }}>
            {selectedSeat ? (
              <div>
                <div style={{ marginBottom: '12px' }}>
                  <Text strong>座位号: </Text>
                  <Text>{selectedSeat.number}</Text>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <Text strong>区域: </Text>
                  <Text>{areas.find(a => a.id === selectedSeat.area)?.name || selectedSeat.area}</Text>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <Text strong>楼层: </Text>
                  <Text>{selectedSeat.floor}</Text>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <Text strong>位置: </Text>
                  <Text>第{selectedSeat.row}行 第{selectedSeat.col}列</Text>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <Text strong>状态: </Text>
                  <Text style={{ 
                    color: selectedSeat.status === 'available' ? '#52c41a' : 
                           selectedSeat.status === 'occupied' ? '#fa8c16' :
                           selectedSeat.status === 'reserved' ? '#722ed1' : '#f5222d'
                  }}>
                    {selectedSeat.status === 'available' ? '可用' :
                     selectedSeat.status === 'occupied' ? '占用' :
                     selectedSeat.status === 'reserved' ? '已预约' : '维护中'}
                  </Text>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <Text strong>可预约: </Text>
                  <Text>{selectedSeat.isReservable ? '是' : '否'}</Text>
                </div>
                <div>
                  <Text strong>特性: </Text>
                  <Text>
                    {selectedSeat.features && selectedSeat.features.length > 0
                      ? selectedSeat.features.map(f => FEATURE_META[f as SeatFeature]?.label || f).join(', ')
                      : '无'
                    }
                  </Text>
                </div>
                {user && user.role === 'admin' && (
                  <div style={{ marginTop: '16px' }}>
                    <Typography.Text strong>管理员操作：</Typography.Text>
                    <div style={{ marginTop: '8px' }}>
                      <Space wrap>
                        <Button size="small" onClick={() => adminSetStatus('available')}>设为可用</Button>
                        <Button size="small" onClick={() => adminSetStatus('occupied')}>设为占用</Button>
                        <Button size="small" onClick={() => adminSetStatus('reserved')}>设为已预约</Button>
                        <Button size="small" danger onClick={() => adminSetStatus('maintenance')}>设为维护中</Button>
                      </Space>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Text type="secondary">请选择一个座位查看详细信息</Text>
            )}
          </Card>

          <Card title="区域统计">
            {areas.map(area => {
              const areaSeats = seats.filter(seat => seat.area === area.id);
              const availableSeats = areaSeats.filter(seat => seat.status === 'available').length;
              const occupiedSeats = areaSeats.filter(seat => seat.status === 'occupied').length;
              const reservedSeats = areaSeats.filter(seat => seat.status === 'reserved').length;
              
              return (
                <div key={area.id} style={{ 
                  marginBottom: '16px', 
                  padding: '12px', 
                  border: '1px solid #f0f0f0', 
                  borderRadius: '6px' 
                }}>
                  <Text strong>{area.name}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {area.description}
                  </Text>
                  <br />
                  <div style={{ marginTop: '8px' }}>
                    <Text style={{ fontSize: '12px' }}>
                      总座位: {areaSeats.length} | 
                      可用: <Text style={{ color: '#52c41a' }}>{availableSeats}</Text> | 
                      占用: <Text style={{ color: '#fa8c16' }}>{occupiedSeats}</Text> | 
                      预约: <Text style={{ color: '#722ed1' }}>{reservedSeats}</Text>
                    </Text>
                  </div>
                </div>
              );
            })}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SeatManagement;