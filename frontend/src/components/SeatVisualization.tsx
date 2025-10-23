import React, { useState, useEffect } from 'react';
import { Card, Select, Button, Space, Typography, Tag, Modal, Form, DatePicker, message } from 'antd';
import {
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ToolOutlined,
  PauseCircleOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { seatService, reservationService, areaService } from '../services/storage';
import type { Seat, Area, Reservation, SeatStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface SeatVisualizationProps {
  onSeatSelect?: (seat: Seat) => void;
  selectedSeat?: Seat | null;
}

const SeatVisualization: React.FC<SeatVisualizationProps> = ({ onSeatSelect, selectedSeat }) => {
  const { user } = useAuth();
  const [areas, setAreas] = useState<Area[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [timeRange, setTimeRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [reservationModalVisible, setReservationModalVisible] = useState(false);
  const [reservationForm] = Form.useForm();

  useEffect(() => {
    loadAreas();
  }, []);

  useEffect(() => {
    if (selectedArea) {
      loadSeats();
    }
  }, [selectedArea, timeRange]);

  const loadAreas = () => {
    const allAreas = areaService.getAllAreas();
    setAreas(allAreas);
    if (allAreas.length > 0) {
      setSelectedArea(allAreas[0].id);
    }
  };

  const loadSeats = (areaId?: string) => {
    const targetArea = areaId || selectedArea;
    if (!targetArea) return;
    
    const areaSeats = seatService.getSeatsByArea(targetArea);
    setSeats(areaSeats);
  };

  const getSeatStatusColor = (status: SeatStatus) => {
    switch (status) {
      case 'available': return '#52c41a';
      case 'occupied': return '#fa8c16';
      case 'reserved': return '#722ed1';
      case 'maintenance': return '#f5222d';
      case 'temporarily_released': return '#1890ff';
      default: return '#d9d9d9';
    }
  };

  const getSeatStatusIcon = (status: SeatStatus) => {
    switch (status) {
      case 'available': return <CheckCircleOutlined />;
      case 'occupied': return <CloseCircleOutlined />;
      case 'reserved': return <ClockCircleOutlined />;
      case 'maintenance': return <ToolOutlined />;
      case 'temporarily_released': return <PauseCircleOutlined />;
      default: return <BookOutlined />;
    }
  };

  const getSeatStatusText = (status: SeatStatus) => {
    switch (status) {
      case 'available': return '可用';
      case 'occupied': return '占用';
      case 'reserved': return '已预约';
      case 'maintenance': return '维护中';
      case 'temporarily_released': return '临时释放';
      default: return '未知';
    }
  };

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === 'available' && seat.isReservable) {
      onSeatSelect?.(seat);
    }
  };

  const handleReservation = () => {
    if (!selectedSeat || !user) return;

    reservationForm.setFieldsValue({
      seatId: selectedSeat.id,
      startTime: timeRange?.[0],
      endTime: timeRange?.[1]
    });
    setReservationModalVisible(true);
  };

  const onReservationSubmit = async (values: any) => {
    if (!user || !selectedSeat) return;

    try {
      const reservation: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: user.id,
        seatId: selectedSeat.id,
        startTime: values.startTime.toISOString(),
        endTime: values.endTime.toISOString(),
        status: 'pending',
        notes: values.notes
      };

      reservationService.createReservation(reservation);
      message.success('预约申请已提交！');
      setReservationModalVisible(false);
      loadSeats(); // 刷新座位状态
    } catch (error) {
      message.error('预约失败，请重试！');
    }
  };

  const renderSeatGrid = () => {
    if (!selectedArea) return null;

    const areaSeats = seats.filter(seat => seat.area === selectedArea && seat.floor === selectedFloor);
    
    if (areaSeats.length === 0) {
      return (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#999' 
        }}>
          该区域暂无座位数据
        </div>
      );
    }
    
    const maxRow = Math.max(...areaSeats.map(seat => seat.row));
    const maxCol = Math.max(...areaSeats.map(seat => seat.col));

    return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: `repeat(${maxCol}, 1fr)`,
        gap: '8px',
        maxWidth: '100%',
        overflow: 'auto'
      }}>
        {Array.from({ length: maxRow * maxCol }, (_, index) => {
          const row = Math.floor(index / maxCol) + 1;
          const col = (index % maxCol) + 1;
          const seat = areaSeats.find(s => s.row === row && s.col === col);
          
          if (!seat) {
            return <div key={index} style={{ width: '60px', height: '60px' }} />;
          }

          const isSelected = selectedSeat?.id === seat.id;
          const isClickable = seat.status === 'available' && seat.isReservable;

          return (
            <div
              key={seat.id}
              onClick={() => handleSeatClick(seat)}
              style={{
                width: '60px',
                height: '60px',
                border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: getSeatStatusColor(seat.status),
                color: 'white',
                cursor: isClickable ? 'pointer' : 'not-allowed',
                opacity: isClickable ? 1 : 0.6,
                transition: 'all 0.3s',
                fontSize: '10px',
                textAlign: 'center',
                padding: '4px'
              }}
              onMouseEnter={(e) => {
                if (isClickable) {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (isClickable) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              <div style={{ fontSize: '8px', fontWeight: 'bold' }}>
                {seat.number.split('-').pop()}
              </div>
              <div style={{ fontSize: '8px' }}>
                {getSeatStatusIcon(seat.status)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const currentArea = areas.find(area => area.id === selectedArea);

  return (
    <div>
      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Title level={4}>座位可视化</Title>
          
          <Space wrap style={{ marginBottom: '16px' }}>
            <Select
              value={selectedArea}
              onChange={(value) => {
                setSelectedArea(value);
                loadSeats(value);
              }}
              style={{ width: 200 }}
              placeholder="选择区域"
            >
              {areas.map(area => (
                <Option key={area.id} value={area.id}>
                  {area.name} (楼层 {area.floor})
                </Option>
              ))}
            </Select>

            <Select
              value={selectedFloor}
              onChange={(value) => {
                setSelectedFloor(value);
                loadSeats();
              }}
              style={{ width: 120 }}
              placeholder="选择楼层"
            >
              {Array.from(new Set(seats.filter(s => s.area === selectedArea).map(s => s.floor)))
                .sort()
                .map(floor => (
                  <Option key={floor} value={floor}>
                    楼层 {floor}
                  </Option>
                ))}
            </Select>

            <RangePicker
              showTime
              value={timeRange}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setTimeRange([dates[0], dates[1]]);
                } else {
                  setTimeRange(null);
                }
              }}
              placeholder={['开始时间', '结束时间']}
            />
          </Space>

          {/* 图例 */}
          <div style={{ marginBottom: '16px' }}>
            <Text strong>图例：</Text>
            <Space style={{ marginLeft: '16px' }}>
              <Tag color="green" icon={<CheckCircleOutlined />}>可用</Tag>
              <Tag color="orange" icon={<CloseCircleOutlined />}>占用</Tag>
              <Tag color="purple" icon={<ClockCircleOutlined />}>已预约</Tag>
              <Tag color="red" icon={<ToolOutlined />}>维护中</Tag>
            </Space>
          </div>
        </div>

        {/* 座位网格 */}
        <div style={{ 
          border: '1px solid #d9d9d9', 
          borderRadius: '8px', 
          padding: '16px',
          backgroundColor: '#fafafa',
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {renderSeatGrid()}
        </div>

        {/* 区域信息 */}
        {currentArea && (
          <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f0f0f0', borderRadius: '6px' }}>
            <Text strong>{currentArea.name}</Text>
            <br />
            <Text type="secondary">{currentArea.description}</Text>
            <br />
            <Text>总座位数: {currentArea.totalSeats} | 可用座位: {currentArea.availableSeats}</Text>
          </div>
        )}

        {/* 选中座位操作 */}
        {selectedSeat && (
          <div style={{ 
            marginTop: '16px', 
            padding: '16px', 
            border: '1px solid #1890ff', 
            borderRadius: '8px',
            backgroundColor: '#f6ffed'
          }}>
            <Title level={5}>选中座位: {selectedSeat.number}</Title>
            <Text>状态: {getSeatStatusText(selectedSeat.status)}</Text>
            <br />
            <Text>特性: {selectedSeat.features.join(', ') || '无'}</Text>
            
            {selectedSeat.status === 'available' && selectedSeat.isReservable && user && (
              <div style={{ marginTop: '12px' }}>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={handleReservation}
                >
                  预约此座位
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* 预约模态框 */}
      <Modal
        title="预约座位"
        open={reservationModalVisible}
        onCancel={() => setReservationModalVisible(false)}
        footer={null}
      >
        <Form
          form={reservationForm}
          layout="vertical"
          onFinish={onReservationSubmit}
        >
          <Form.Item
            name="startTime"
            label="开始时间"
            rules={[{ required: true, message: '请选择开始时间!' }]}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="endTime"
            label="结束时间"
            rules={[{ required: true, message: '请选择结束时间!' }]}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="notes"
            label="备注"
          >
            <textarea 
              style={{ width: '100%', minHeight: '80px', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
              placeholder="请输入备注信息（可选）"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确认预约
              </Button>
              <Button onClick={() => setReservationModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SeatVisualization;