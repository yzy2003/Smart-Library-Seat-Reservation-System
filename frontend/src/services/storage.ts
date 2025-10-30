import type {
  User,
  Seat,
  Reservation,
  Violation,
  Area,
  SeatStatus,
  SeatUsageStats,
} from "../types";

// 本地存储键名
const STORAGE_KEYS = {
  USERS: "library_users",
  SEATS: "library_seats",
  RESERVATIONS: "library_reservations",
  VIOLATIONS: "library_violations",
  AREAS: "library_areas",
  STATS: "library_stats",
  CURRENT_USER: "current_user",
};

// 初始化默认数据
const initializeDefaultData = () => {
  // 默认用户数据 - 包含管理员、学生、教师
  const defaultUsers: User[] = [
    {
      id: "admin-001",
      username: "admin",
      password: "admin123",
      role: "admin",
      name: "系统管理员",
      email: "admin@library.edu",
      phone: "13800138000",
      violationCount: 0,
      isBanned: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: "student-001",
      username: "student001",
      password: "123456",
      role: "student",
      name: "张三",
      studentId: "2021001001",
      email: "zhangsan@student.edu",
      phone: "13800138001",
      violationCount: 0,
      isBanned: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: "student-002",
      username: "student002",
      password: "123456",
      role: "student",
      name: "李四",
      studentId: "2021001002",
      email: "lisi@student.edu",
      phone: "13800138002",
      violationCount: 1,
      isBanned: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: "teacher-001",
      username: "teacher001",
      password: "123456",
      role: "teacher",
      name: "王教授",
      teacherId: "T001",
      email: "wang@teacher.edu",
      phone: "13800138003",
      violationCount: 0,
      isBanned: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: "teacher-002",
      username: "teacher002",
      password: "123456",
      role: "teacher",
      name: "李老师",
      teacherId: "T002",
      email: "li@teacher.edu",
      phone: "13800138004",
      violationCount: 0,
      isBanned: false,
      createdAt: new Date().toISOString(),
    },
  ];

  // 默认区域数据 - 更详细的区域划分
  const defaultAreas: Area[] = [
    {
      id: "area-001",
      name: "安静阅览区A",
      floor: 1,
      description: "安静阅览区，适合学习，禁止大声交流",
      totalSeats: 60,
      availableSeats: 45,
      isActive: true,
    },
    {
      id: "area-002",
      name: "讨论区B",
      floor: 1,
      description: "讨论区，允许轻声交流，适合小组学习",
      totalSeats: 40,
      availableSeats: 35,
      isActive: true,
    },
    {
      id: "area-003",
      name: "电子阅览区",
      floor: 2,
      description: "配备电脑的电子阅览区，提供网络服务",
      totalSeats: 50,
      availableSeats: 30,
      isActive: true,
    },
    {
      id: "area-004",
      name: "VIP阅览区",
      floor: 2,
      description: "高级阅览区，环境优雅，适合研究学习",
      totalSeats: 20,
      availableSeats: 15,
      isActive: true,
    },
    {
      id: "area-005",
      name: "24小时自习区",
      floor: 3,
      description: "24小时开放的自习区域",
      totalSeats: 80,
      availableSeats: 60,
      isActive: true,
    },
  ];

  // 生成默认座位数据 - 更丰富的座位配置
  const defaultSeats: Seat[] = [];
  defaultAreas.forEach((area) => {
<<<<<<< HEAD
    // 假设每行最多 10 列
    const colsPerRow = 10;
    const total = area.totalSeats;
    const rows = Math.ceil(total / colsPerRow);
    const lastRowCount = total - (rows - 1) * colsPerRow;
    const middleColInLastRow = Math.ceil(lastRowCount / 2);
    const targetIndexInArea = (rows - 1) * colsPerRow + middleColInLastRow; // 从1开始的序号

    for (let i = 1; i <= total; i++) {
      const row = Math.ceil(i / colsPerRow);
      const col = ((i - 1) % colsPerRow) + 1;

      // 默认特性：将最后一排的中间座位设置为靠门
      let features: string[] = [];
      if (row === rows && col >= Math.floor(lastRowCount / 3) && col <= Math.ceil(lastRowCount * 2/3)) {
        features = ["near_exit"];
      } else if (i % 3 === 0) {
        features = ["power"];
      } else if (i % 5 === 0) {
        features = ["window"];
      }
=======
    for (let i = 1; i <= area.totalSeats; i++) {
      const row = Math.ceil(i / 10);
      const col = ((i - 1) % 10) + 1;
      
      // 根据座位位置和区域特点分配特性
      let features: string[] = [];
      if (i % 3 === 0) features.push("power");
      if (i % 5 === 0) features.push("window");
      if (i % 7 === 0) features.push("quiet");
      if (area.id === "area-003") features.push("computer");
      if (area.id === "area-004") features.push("premium");

      // 模拟一些座位已被占用或预约
      let status: SeatStatus = "available";
      if (area.id === "area-001" && i <= 15) status = "occupied";
      if (area.id === "area-002" && i <= 5) status = "reserved";
      if (area.id === "area-003" && i <= 20) status = "occupied";
      if (area.id === "area-004" && i <= 5) status = "reserved";
      if (area.id === "area-005" && i <= 20) status = "occupied";
>>>>>>> ca7bbe1c5486d8e0beadfe39fd84d4a02fb6b866

      defaultSeats.push({
        id: `seat-${area.id}-${i.toString().padStart(3, "0")}`,
        number: `${area.name}-${i.toString().padStart(3, "0")}`,
        area: area.id,
        floor: area.floor,
        row,
        col,
<<<<<<< HEAD
        status: "available",
=======
        status,
>>>>>>> ca7bbe1c5486d8e0beadfe39fd84d4a02fb6b866
        features,
        isReservable: true,
        createdAt: new Date().toISOString(),
      });
    }
  });

  // 生成默认预约数据
  const now = new Date();
  const defaultReservations: Reservation[] = [
    {
      id: "reservation-001",
      userId: "student-001",
      seatId: "seat-area-001-001",
      startTime: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2小时后
      endTime: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(), // 6小时后
      status: "pending",
      qrCode: "QR_STUDENT001_001",
      notes: "准备期末考试",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "reservation-002",
      userId: "teacher-001",
      seatId: "seat-area-004-001",
      startTime: new Date(now.getTime() + 1 * 60 * 60 * 1000).toISOString(), // 1小时后
      endTime: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(), // 4小时后
      status: "confirmed",
      checkInTime: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // 30分钟前签到
      qrCode: "QR_TEACHER001_001",
      notes: "研究项目",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "reservation-003",
      userId: "student-002",
      seatId: "seat-area-002-001",
      startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2小时前
      endTime: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2小时后
      status: "confirmed",
      checkInTime: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      qrCode: "QR_STUDENT002_001",
      notes: "小组讨论",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // 生成默认违规记录
  const defaultViolations: Violation[] = [
    {
      id: "violation-001",
      userId: "student-002",
      reservationId: "reservation-003",
      type: "no_show",
      description: "预约后未按时签到，超过15分钟未到",
      penalty: "限制预约权限3天",
      isResolved: false,
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7天前
    },
    {
      id: "violation-002",
      userId: "student-001",
      type: "overstay",
      description: "超时占用座位，超过预约时间30分钟未签退",
      penalty: "警告",
      isResolved: true,
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3天前
      resolvedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      resolvedBy: "admin-001",
    },
  ];

  // 生成统计数据
  const defaultStats: SeatUsageStats[] = [
    {
      date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalSeats: 250,
      occupiedSeats: 180,
      reservedSeats: 30,
      availableSeats: 40,
      utilizationRate: 0.84,
      popularAreas: [
        { areaId: "area-001", areaName: "安静阅览区A", usageCount: 45 },
        { areaId: "area-005", areaName: "24小时自习区", usageCount: 60 },
        { areaId: "area-003", areaName: "电子阅览区", usageCount: 30 },
      ],
    },
    {
      date: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalSeats: 250,
      occupiedSeats: 200,
      reservedSeats: 25,
      availableSeats: 25,
      utilizationRate: 0.90,
      popularAreas: [
        { areaId: "area-005", areaName: "24小时自习区", usageCount: 70 },
        { areaId: "area-001", areaName: "安静阅览区A", usageCount: 50 },
        { areaId: "area-002", areaName: "讨论区B", usageCount: 35 },
      ],
    },
  ];

  // 保存默认数据
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
  }
  if (!localStorage.getItem(STORAGE_KEYS.AREAS)) {
    localStorage.setItem(STORAGE_KEYS.AREAS, JSON.stringify(defaultAreas));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SEATS)) {
    localStorage.setItem(STORAGE_KEYS.SEATS, JSON.stringify(defaultSeats));
  }
  if (!localStorage.getItem(STORAGE_KEYS.RESERVATIONS)) {
    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(defaultReservations));
  }
  if (!localStorage.getItem(STORAGE_KEYS.VIOLATIONS)) {
    localStorage.setItem(STORAGE_KEYS.VIOLATIONS, JSON.stringify(defaultViolations));
  }
  if (!localStorage.getItem(STORAGE_KEYS.STATS)) {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(defaultStats));
  }
};

// 通用存储操作类
class StorageService {
  constructor() {
    initializeDefaultData();
  }

  // 获取数据
  get<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  // 保存数据
  set<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // 添加单个项目
  add<T extends { id: string }>(key: string, item: T): T {
    const items = this.get<T>(key);
    items.push(item);
    this.set(key, items);
    return item;
  }

  // 更新单个项目
  update<T extends { id: string }>(
    key: string,
    id: string,
    updates: Partial<T>
  ): T | null {
    const items = this.get<T>(key);
    const index = items.findIndex((item) => item.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates };
      this.set(key, items);
      return items[index];
    }
    return null;
  }

  // 删除单个项目
  delete<T extends { id: string }>(key: string, id: string): boolean {
    const items = this.get<T>(key);
    const filteredItems = items.filter((item) => item.id !== id);
    if (filteredItems.length !== items.length) {
      this.set(key, filteredItems);
      return true;
    }
    return false;
  }

  // 根据ID查找
  findById<T extends { id: string }>(key: string, id: string): T | null {
    const items = this.get<T>(key);
    return items.find((item) => item.id === id) || null;
  }

  // 根据条件查找
  findBy<T extends { id: string }>(
    key: string,
    predicate: (item: T) => boolean
  ): T[] {
    const items = this.get<T>(key);
    return items.filter(predicate);
  }
}

// 创建存储服务实例
export const storageService = new StorageService();

// 用户相关操作
export const userService = {
  // 获取所有用户
  getAllUsers: () => storageService.get<User>(STORAGE_KEYS.USERS),

  // 根据用户名查找用户
  findByUsername: (username: string) => {
    const users = storageService.get<User>(STORAGE_KEYS.USERS);
    return users.find((user) => user.username === username) || null;
  },

  // 用户登录
  login: (username: string, password: string) => {
    const user = userService.findByUsername(username);
    if (user && user.password === password && !user.isBanned) {
      // 更新最后登录时间
      userService.updateUser(user.id, {
        lastLoginAt: new Date().toISOString(),
      });
      return user;
    }
    return null;
  },

  // 更新用户信息
  updateUser: (id: string, updates: Partial<User>) => {
    return storageService.update<User>(STORAGE_KEYS.USERS, id, updates);
  },

  // 添加用户
  addUser: (user: Omit<User, "id" | "createdAt">) => {
    const newUser: User = {
      ...user,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    return storageService.add<User>(STORAGE_KEYS.USERS, newUser);
  },
};

// 座位相关操作
export const seatService = {
  // 获取所有座位
  getAllSeats: () => storageService.get<Seat>(STORAGE_KEYS.SEATS),

  // 根据区域获取座位
  getSeatsByArea: (areaId: string) => {
    return storageService.findBy<Seat>(
      STORAGE_KEYS.SEATS,
      (seat) => seat.area === areaId
    );
  },

  // 更新座位状态
  updateSeatStatus: (id: string, status: SeatStatus) => {
    return storageService.update<Seat>(STORAGE_KEYS.SEATS, id, { status });
  },

  // 获取可用座位
  getAvailableSeats: (startTime?: string, endTime?: string) => {
    const seats = storageService.get<Seat>(STORAGE_KEYS.SEATS);
    const reservations = storageService.get<Reservation>(
      STORAGE_KEYS.RESERVATIONS
    );

    return seats.filter((seat) => {
      if (seat.status !== "available" || !seat.isReservable) return false;

      if (startTime && endTime) {
        // 检查时间冲突
        const hasConflict = reservations.some(
          (reservation) =>
            reservation.seatId === seat.id &&
            reservation.status === "confirmed" &&
            !(
              new Date(endTime) <= new Date(reservation.startTime) ||
              new Date(startTime) >= new Date(reservation.endTime)
            )
        );
        return !hasConflict;
      }

      return true;
    });
  },
};

// 预约相关操作
export const reservationService = {
  // 获取所有预约
  getAllReservations: () =>
    storageService.get<Reservation>(STORAGE_KEYS.RESERVATIONS),

  // 获取用户预约
  getUserReservations: (userId: string) => {
    return storageService.findBy<Reservation>(
      STORAGE_KEYS.RESERVATIONS,
      (reservation) => reservation.userId === userId
    );
  },

  // 创建预约
  createReservation: (
    reservation: Omit<Reservation, "id" | "createdAt" | "updatedAt">
  ) => {
    const newReservation: Reservation = {
      ...reservation,
      id: `reservation-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 更新座位状态
    seatService.updateSeatStatus(reservation.seatId, "reserved");

    return storageService.add<Reservation>(
      STORAGE_KEYS.RESERVATIONS,
      newReservation
    );
  },

  // 更新预约状态
  updateReservation: (id: string, updates: Partial<Reservation>) => {
    const reservation = storageService.findById<Reservation>(
      STORAGE_KEYS.RESERVATIONS,
      id
    );
    if (reservation) {
      const updatedReservation = {
        ...reservation,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      storageService.update<Reservation>(
        STORAGE_KEYS.RESERVATIONS,
        id,
        updatedReservation
      );

      // 如果预约被取消或完成，释放座位
      if (updates.status === "cancelled" || updates.status === "completed") {
        seatService.updateSeatStatus(reservation.seatId, "available");
      }

      return updatedReservation;
    }
    return null;
  },

  // 签到
  checkIn: (id: string) => {
    const reservation = storageService.findById<Reservation>(
      STORAGE_KEYS.RESERVATIONS,
      id
    );

    console.log(reservation);
    if (reservation && reservation.status === "pending") {
      // 更新预约状态和签到时间
      reservationService.updateReservation(id, {
        status: "confirmed",
        checkInTime: new Date().toISOString(),
      });

      // 更新座位状态为占用
      seatService.updateSeatStatus(reservation.seatId, "occupied");

      return true;
    }
    return false;
  },

  // 签退
  checkOut: (id: string) => {
    const reservation = storageService.findById<Reservation>(
      STORAGE_KEYS.RESERVATIONS,
      id
    );
    if (reservation) {
      // 更新预约状态和签退时间
      reservationService.updateReservation(id, {
        status: "completed",
        checkOutTime: new Date().toISOString(),
      });

      // 释放座位
      seatService.updateSeatStatus(reservation.seatId, "available");

      return true;
    }
    return false;
  },

  // 临时释放座位
  tempReleaseSeat: (id: string, duration: number, reason: string) => {
    const reservation = storageService.findById<Reservation>(
      STORAGE_KEYS.RESERVATIONS,
      id
    );
    
    if (reservation && reservation.status === "confirmed") {
      const now = new Date();
      const expiryTime = new Date(now.getTime() + duration * 60 * 1000);
      
      // 更新预约状态为临时释放
      reservationService.updateReservation(id, {
        status: "temporarily_released",
        tempReleaseTime: now.toISOString(),
        tempReleaseDuration: duration,
        tempReleaseReason: reason,
        tempReleaseExpiryTime: expiryTime.toISOString(),
      });

      // 更新座位状态为临时释放
      seatService.updateSeatStatus(reservation.seatId, "temporarily_released");

      return true;
    }
    return false;
  },

  // 恢复临时释放的座位
  resumeTempReleasedSeat: (id: string) => {
    const reservation = storageService.findById<Reservation>(
      STORAGE_KEYS.RESERVATIONS,
      id
    );
    
    if (reservation && reservation.status === "temporarily_released") {
      // 更新预约状态为已确认
      reservationService.updateReservation(id, {
        status: "confirmed",
        tempReleaseTime: undefined,
        tempReleaseDuration: undefined,
        tempReleaseReason: undefined,
        tempReleaseExpiryTime: undefined,
      });

      // 更新座位状态为占用
      seatService.updateSeatStatus(reservation.seatId, "occupied");

      return true;
    }
    return false;
  },

  // 检查临时释放是否过期
  checkTempReleaseExpiry: (id: string) => {
    const reservation = storageService.findById<Reservation>(
      STORAGE_KEYS.RESERVATIONS,
      id
    );
    
    if (reservation && 
        reservation.status === "temporarily_released" && 
        reservation.tempReleaseExpiryTime) {
      
      const now = new Date();
      const expiryTime = new Date(reservation.tempReleaseExpiryTime);
      
      if (now > expiryTime) {
        // 临时释放已过期，自动取消预约
        reservationService.updateReservation(id, {
          status: "cancelled",
          checkOutTime: now.toISOString(),
        });
        
        // 释放座位
        seatService.updateSeatStatus(reservation.seatId, "available");
        
        return true; // 已过期
      }
    }
    return false; // 未过期
  },
};

// 违规相关操作
export const violationService = {
  // 获取所有违规记录
  getAllViolations: () =>
    storageService.get<Violation>(STORAGE_KEYS.VIOLATIONS),

  // 添加违规记录
  addViolation: (violation: Omit<Violation, "id" | "createdAt">) => {
    const newViolation: Violation = {
      ...violation,
      id: `violation-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    // 增加用户违规次数
    const user = storageService.findById<User>(
      STORAGE_KEYS.USERS,
      violation.userId
    );
    if (user) {
      userService.updateUser(violation.userId, {
        violationCount: user.violationCount + 1,
      });
    }

    return storageService.add<Violation>(STORAGE_KEYS.VIOLATIONS, newViolation);
  },

  // 处理违规
  resolveViolation: (id: string, resolvedBy: string) => {
    return storageService.update<Violation>(STORAGE_KEYS.VIOLATIONS, id, {
      isResolved: true,
      resolvedAt: new Date().toISOString(),
      resolvedBy,
    });
  },
};

// 区域相关操作
export const areaService = {
  // 获取所有区域
  getAllAreas: () => storageService.get<Area>(STORAGE_KEYS.AREAS),

  // 更新区域信息
  updateArea: (id: string, updates: Partial<Area>) => {
    return storageService.update<Area>(STORAGE_KEYS.AREAS, id, updates);
  },
};

// 当前用户管理
export const authService = {
  // 获取当前用户
  getCurrentUser: (): User | null => {
    const userData = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return userData ? JSON.parse(userData) : null;
  },

  // 设置当前用户
  setCurrentUser: (user: User | null) => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  // 登出
  logout: () => {
    authService.setCurrentUser(null);
  },
};
