// 用户角色类型
export type UserRole = 'admin' | 'student' | 'teacher';

// 座位状态类型
export type SeatStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';

// 预约状态类型
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'expired';

// 违规类型
export type ViolationType = 'no_show' | 'overstay' | 'late_checkin' | 'unauthorized_use';

// 用户接口
export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  name: string;
  studentId?: string; // 学生学号
  teacherId?: string; // 教师工号
  email: string;
  phone: string;
  violationCount: number; // 违规次数
  isBanned: boolean; // 是否被禁用
  createdAt: string;
  lastLoginAt?: string;
}

// 座位接口
export interface Seat {
  id: string;
  number: string; // 座位号
  area: string; // 区域
  floor: number; // 楼层
  row: number; // 行
  col: number; // 列
  status: SeatStatus;
  features: string[]; // 座位特性，如['power', 'window', 'quiet']
  isReservable: boolean; // 是否可预约
  createdAt: string;
}

// 预约接口
export interface Reservation {
  id: string;
  userId: string;
  seatId: string;
  startTime: string; // ISO 8601 格式
  endTime: string; // ISO 8601 格式
  status: ReservationStatus;
  checkInTime?: string; // 签到时间
  checkOutTime?: string; // 签退时间
  qrCode?: string; // 二维码数据
  notes?: string; // 备注
  createdAt: string;
  updatedAt: string;
}

// 违规记录接口
export interface Violation {
  id: string;
  userId: string;
  reservationId?: string;
  type: ViolationType;
  description: string;
  penalty: string; // 处罚措施
  isResolved: boolean;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string; // 处理人员ID
}

// 区域接口
export interface Area {
  id: string;
  name: string;
  floor: number;
  description: string;
  totalSeats: number;
  availableSeats: number;
  isActive: boolean;
}

// 统计数据接口
export interface SeatUsageStats {
  date: string;
  totalSeats: number;
  occupiedSeats: number;
  reservedSeats: number;
  availableSeats: number;
  utilizationRate: number; // 使用率
  popularAreas: Array<{
    areaId: string;
    areaName: string;
    usageCount: number;
  }>;
}

// 登录表单接口
export interface LoginForm {
  username: string;
  password: string;
}

// 预约表单接口
export interface ReservationForm {
  seatId: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

// 座位查询参数接口
export interface SeatQueryParams {
  area?: string;
  floor?: number;
  startTime?: string;
  endTime?: string;
  features?: string[];
}