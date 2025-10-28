import React, { useState, useEffect } from 'react';
import { Card, Select, Button, Space, Typography, Tag, Modal, Form, DatePicker, message } from 'antd';
import {
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ToolOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { seatService, reservationService, areaService } from '../services/storage';
import type { Seat, Area, Reservation, SeatStatus } from '../types';
import { FEATURE_META } from '../constants/seatFeatures';
import type { SeatFeature } from '../constants/seatFeatures';
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
  // 默认选择楼层 1
  const [selectedFloor, setSelectedFloor] = useState<number | null>(1);
  const [timeRange, setTimeRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [reservationModalVisible, setReservationModalVisible] = useState(false);
  const [reservationForm] = Form.useForm();

  useEffect(() => {
    loadAreas();
  }, []);

  // 当选中区域或者时间范围变化时加载座位
  useEffect(() => {
    if (selectedArea) {
      loadSeats();
    } else {
      setSeats([]);
    }
  }, [selectedArea, timeRange]);

  const loadAreas = () => {
    const allAreas = areaService.getAllAreas();
    setAreas(allAreas);
    // 不自动选择区域；用户需要先选择楼层
  };

  // 当 areas 或 selectedFloor 改变时，如果当前未选择区域，则自动选择该楼层的第一个区域并加载座位
  useEffect(() => {
    if (!areas || areas.length === 0) return;
    if (selectedFloor === null) return;

    const floorAreas = areas.filter(a => a.floor === selectedFloor);
    if (floorAreas.length > 0) {
      const firstArea = floorAreas[0];
      // 仅当未选择区域或选择的区域不属于该楼层时，自动选择第一个区域
      if (!selectedArea || areas.find(a => a.id === selectedArea)?.floor !== selectedFloor) {
        setSelectedArea(firstArea.id);
        loadSeats(firstArea.id);
      }
    } else {
      setSelectedArea('');
      setSeats([]);
    }
  }, [areas, selectedFloor]);

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
      default: return '#d9d9d9';
    }
  };

  const getSeatStatusIcon = (status: SeatStatus) => {
    switch (status) {
      case 'available': return <CheckCircleOutlined />;
      case 'occupied': return <CloseCircleOutlined />;
      case 'reserved': return <ClockCircleOutlined />;
      case 'maintenance': return <ToolOutlined />;
      default: return <BookOutlined />;
    }
  };

  const getSeatStatusText = (status: SeatStatus) => {
    switch (status) {
      case 'available': return '可用';
      case 'occupied': return '占用';
      case 'reserved': return '已预约';
      case 'maintenance': return '维护中';
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
            {/* 先选择楼层，再选择对应楼层的区域 */}
            <Select
              value={selectedFloor ?? undefined}
              onChange={(value: number) => {
                setSelectedFloor(value);
                // 选择楼层后，自动选中该楼层的第一个区域（若存在），并加载该区域座位
                const floorAreas = areas.filter(a => a.floor === value);
                if (floorAreas.length > 0) {
                  const firstArea = floorAreas[0];
                  setSelectedArea(firstArea.id);
                  loadSeats(firstArea.id);
                } else {
                  // 若该楼层无区域，则清空区域与座位数据
                  setSelectedArea('');
                  setSeats([]);
                }
              }}
              style={{ width: 120 }}
              placeholder="选择楼层"
            >
              {Array.from(new Set(areas.map(a => a.floor)))
                .sort()
                .map(floor => (
                  <Option key={floor} value={floor as number}>
                    楼层 {floor}
                  </Option>
                ))}
            </Select>

            <Select
              value={selectedArea}
              onChange={(value) => {
                setSelectedArea(value);
                // 仅在区域被选中时加载该区域的座位
                loadSeats(value);
              }}
              style={{ width: 200 }}
              placeholder="选择区域"
              disabled={selectedFloor === null}
            >
              {areas
                .filter(area => selectedFloor === null ? true : area.floor === selectedFloor)
                .map(area => (
                  <Option key={area.id} value={area.id}>
                    {area.name}
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
            <Text>
              特性: {selectedSeat.features && selectedSeat.features.length > 0
                ? selectedSeat.features.map(f => FEATURE_META[f as SeatFeature]?.label || f).join(', ')
                : '无'
              }
            </Text>
            
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