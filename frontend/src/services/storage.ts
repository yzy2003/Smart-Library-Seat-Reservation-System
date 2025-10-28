import type {
  User,
  Seat,
  Reservation,
  Violation,
  Area,
  SeatStatus,
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
  // 默认管理员账户
  const defaultAdmin: User = {
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
  };

  // 默认区域
  const defaultAreas: Area[] = [
    {
      id: "area-001",
      name: "阅览区A",
      floor: 1,
      description: "安静阅览区，适合学习",
      totalSeats: 50,
      availableSeats: 50,
      isActive: true,
    },
    {
      id: "area-002",
      name: "阅览区B",
      floor: 1,
      description: "讨论区，允许轻声交流",
      totalSeats: 30,
      availableSeats: 30,
      isActive: true,
    },
    {
      id: "area-003",
      name: "电子阅览区",
      floor: 2,
      description: "配备电脑的电子阅览区",
      totalSeats: 40,
      availableSeats: 40,
      isActive: true,
    },
  ];

  // 生成默认座位
  const defaultSeats: Seat[] = [];
  defaultAreas.forEach((area) => {
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

      defaultSeats.push({
        id: `seat-${area.id}-${i.toString().padStart(3, "0")}`,
        number: `${area.name}-${i.toString().padStart(3, "0")}`,
        area: area.id,
        floor: area.floor,
        row,
        col,
        status: "available",
        features,
        isReservable: true,
        createdAt: new Date().toISOString(),
      });
    }
  });

  // 保存默认数据
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([defaultAdmin]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.AREAS)) {
    localStorage.setItem(STORAGE_KEYS.AREAS, JSON.stringify(defaultAreas));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SEATS)) {
    localStorage.setItem(STORAGE_KEYS.SEATS, JSON.stringify(defaultSeats));
  }
  if (!localStorage.getItem(STORAGE_KEYS.RESERVATIONS)) {
    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.VIOLATIONS)) {
    localStorage.setItem(STORAGE_KEYS.VIOLATIONS, JSON.stringify([]));
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
