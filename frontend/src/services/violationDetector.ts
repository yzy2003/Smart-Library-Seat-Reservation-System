import type { Reservation, Violation, User } from '../types';
import { reservationService, violationService, userService } from './storage';
import dayjs from 'dayjs';

// 违规检测规则配置
export interface ViolationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: 'low' | 'medium' | 'high';
  autoResolve: boolean; // 是否自动处理
}

// 违规检测结果
export interface ViolationDetectionResult {
  ruleId: string;
  userId: string;
  reservationId?: string;
  type: string;
  description: string;
  penalty: string;
  severity: 'low' | 'medium' | 'high';
  detectedAt: string;
}

// 违规检测规则定义
const VIOLATION_RULES: ViolationRule[] = [
  {
    id: 'no_show_15min',
    name: '未签到超时',
    description: '预约后15分钟内未签到',
    enabled: true,
    severity: 'medium',
    autoResolve: false
  },
  {
    id: 'overstay_30min',
    name: '超时占用',
    description: '超过预约时间30分钟未签退',
    enabled: true,
    severity: 'high',
    autoResolve: true
  },
  {
    id: 'late_checkin_10min',
    name: '迟到',
    description: '预约开始时间后10分钟才签到',
    enabled: true,
    severity: 'low',
    autoResolve: false
  },
  {
    id: 'frequent_cancellation',
    name: '频繁取消',
    description: '24小时内取消预约超过3次',
    enabled: true,
    severity: 'medium',
    autoResolve: false
  },
  {
    id: 'unauthorized_extension',
    name: '未授权延长',
    description: '未经允许延长使用时间超过1小时',
    enabled: true,
    severity: 'high',
    autoResolve: true
  }
];

class ViolationDetector {
  private checkInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  // 启动自动检测
  startAutoDetection(intervalMs: number = 60000) { // 默认1分钟检查一次
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.checkInterval = setInterval(() => {
      this.performViolationCheck();
    }, intervalMs);
    
    console.log('违规检测系统已启动，检查间隔:', intervalMs + 'ms');
  }

  // 停止自动检测
  stopAutoDetection() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
    console.log('违规检测系统已停止');
  }

  // 执行违规检查
  async performViolationCheck() {
    try {
      console.log('开始执行违规检查...');
      
      const enabledRules = VIOLATION_RULES.filter(rule => rule.enabled);
      const violations: ViolationDetectionResult[] = [];

      // 获取所有活跃预约
      const activeReservations = this.getActiveReservations();
      
      for (const rule of enabledRules) {
        const ruleViolations = await this.checkRule(rule, activeReservations);
        violations.push(...ruleViolations);
      }

      // 处理检测到的违规
      for (const violation of violations) {
        await this.handleDetectedViolation(violation);
      }

      console.log(`违规检查完成，发现 ${violations.length} 个违规`);
    } catch (error) {
      console.error('违规检查失败:', error);
    }
  }

  // 获取活跃预约
  private getActiveReservations(): Reservation[] {
    const allReservations = reservationService.getAllReservations();
    const now = dayjs();
    
    return allReservations.filter(reservation => {
      const startTime = dayjs(reservation.startTime);
      const endTime = dayjs(reservation.endTime);
      
      // 预约时间范围内且状态为已确认
      return reservation.status === 'confirmed' && 
             now.isAfter(startTime.subtract(30, 'minute')) && 
             now.isBefore(endTime.add(30, 'minute'));
    });
  }

  // 检查特定规则
  private async checkRule(rule: ViolationRule, reservations: Reservation[]): Promise<ViolationDetectionResult[]> {
    const violations: ViolationDetectionResult[] = [];
    const now = dayjs();

    switch (rule.id) {
      case 'no_show_15min':
        violations.push(...this.checkNoShowViolations(rule, reservations, now));
        break;
      case 'overstay_30min':
        violations.push(...this.checkOverstayViolations(rule, reservations, now));
        break;
      case 'late_checkin_10min':
        violations.push(...this.checkLateCheckinViolations(rule, reservations, now));
        break;
      case 'frequent_cancellation':
        violations.push(...this.checkFrequentCancellationViolations(rule, now));
        break;
      case 'unauthorized_extension':
        violations.push(...this.checkUnauthorizedExtensionViolations(rule, reservations, now));
        break;
    }

    return violations;
  }

  // 检查未签到违规
  private checkNoShowViolations(rule: ViolationRule, reservations: Reservation[], now: dayjs.Dayjs): ViolationDetectionResult[] {
    const violations: ViolationDetectionResult[] = [];
    
    for (const reservation of reservations) {
      const startTime = dayjs(reservation.startTime);
      const checkinTime = reservation.checkInTime ? dayjs(reservation.checkInTime) : null;
      
      // 预约开始15分钟后仍未签到
      if (!checkinTime && now.isAfter(startTime.add(15, 'minute'))) {
        violations.push({
          ruleId: rule.id,
          userId: reservation.userId,
          reservationId: reservation.id,
          type: 'no_show',
          description: `预约开始15分钟后仍未签到，预约时间：${startTime.format('YYYY-MM-DD HH:mm')}`,
          penalty: '取消当前预约，记录违规一次',
          severity: rule.severity,
          detectedAt: now.toISOString()
        });
      }
    }
    
    return violations;
  }

  // 检查超时占用违规
  private checkOverstayViolations(rule: ViolationRule, reservations: Reservation[], now: dayjs.Dayjs): ViolationDetectionResult[] {
    const violations: ViolationDetectionResult[] = [];
    
    for (const reservation of reservations) {
      const endTime = dayjs(reservation.endTime);
      const checkoutTime = reservation.checkOutTime ? dayjs(reservation.checkOutTime) : null;
      
      // 预约结束30分钟后仍未签退
      if (!checkoutTime && now.isAfter(endTime.add(30, 'minute'))) {
        violations.push({
          ruleId: rule.id,
          userId: reservation.userId,
          reservationId: reservation.id,
          type: 'overstay',
          description: `预约结束30分钟后仍未签退，预约结束时间：${endTime.format('YYYY-MM-DD HH:mm')}`,
          penalty: '强制签退，记录违规一次',
          severity: rule.severity,
          detectedAt: now.toISOString()
        });
      }
    }
    
    return violations;
  }

  // 检查迟到违规
  private checkLateCheckinViolations(rule: ViolationRule, reservations: Reservation[], now: dayjs.Dayjs): ViolationDetectionResult[] {
    const violations: ViolationDetectionResult[] = [];
    
    for (const reservation of reservations) {
      const startTime = dayjs(reservation.startTime);
      const checkinTime = reservation.checkInTime ? dayjs(reservation.checkInTime) : null;
      
      // 预约开始10分钟后才签到
      if (checkinTime && checkinTime.isAfter(startTime.add(10, 'minute'))) {
        violations.push({
          ruleId: rule.id,
          userId: reservation.userId,
          reservationId: reservation.id,
          type: 'late_checkin',
          description: `预约开始10分钟后才签到，预约时间：${startTime.format('YYYY-MM-DD HH:mm')}，签到时间：${checkinTime.format('YYYY-MM-DD HH:mm')}`,
          penalty: '记录迟到违规一次',
          severity: rule.severity,
          detectedAt: now.toISOString()
        });
      }
    }
    
    return violations;
  }

  // 检查频繁取消违规
  private checkFrequentCancellationViolations(rule: ViolationRule, now: dayjs.Dayjs): ViolationDetectionResult[] {
    const violations: ViolationDetectionResult[] = [];
    const allReservations = reservationService.getAllReservations();
    const yesterday = now.subtract(24, 'hour');
    
    // 按用户分组统计24小时内的取消次数
    const userCancellations = new Map<string, number>();
    
    for (const reservation of allReservations) {
      if (reservation.status === 'cancelled' && 
          dayjs(reservation.updatedAt).isAfter(yesterday)) {
        const count = userCancellations.get(reservation.userId) || 0;
        userCancellations.set(reservation.userId, count + 1);
      }
    }
    
    // 检查超过3次取消的用户
    for (const [userId, count] of userCancellations) {
      if (count >= 3) {
        violations.push({
          ruleId: rule.id,
          userId,
          type: 'frequent_cancellation',
          description: `24小时内取消预约${count}次，超过限制`,
          penalty: '限制预约权限24小时',
          severity: rule.severity,
          detectedAt: now.toISOString()
        });
      }
    }
    
    return violations;
  }

  // 检查未授权延长违规
  private checkUnauthorizedExtensionViolations(rule: ViolationRule, reservations: Reservation[], now: dayjs.Dayjs): ViolationDetectionResult[] {
    const violations: ViolationDetectionResult[] = [];
    
    for (const reservation of reservations) {
      const endTime = dayjs(reservation.endTime);
      const checkoutTime = reservation.checkOutTime ? dayjs(reservation.checkOutTime) : null;
      
      // 预约结束后1小时仍未签退
      if (!checkoutTime && now.isAfter(endTime.add(1, 'hour'))) {
        violations.push({
          ruleId: rule.id,
          userId: reservation.userId,
          reservationId: reservation.id,
          type: 'unauthorized_extension',
          description: `预约结束后1小时仍未签退，预约结束时间：${endTime.format('YYYY-MM-DD HH:mm')}`,
          penalty: '强制签退，记录严重违规一次',
          severity: rule.severity,
          detectedAt: now.toISOString()
        });
      }
    }
    
    return violations;
  }

  // 处理检测到的违规
  private async handleDetectedViolation(violation: ViolationDetectionResult) {
    try {
      // 检查是否已经存在相同的违规记录
      const existingViolations = violationService.getAllViolations();
      const duplicate = existingViolations.find(v => 
        v.userId === violation.userId && 
        v.type === violation.type &&
        v.reservationId === violation.reservationId &&
        dayjs(v.createdAt).isSame(dayjs(violation.detectedAt), 'day')
      );
      
      if (duplicate) {
        console.log('违规记录已存在，跳过:', violation);
        return;
      }

      // 创建违规记录
      const newViolation = {
        userId: violation.userId,
        reservationId: violation.reservationId,
        type: violation.type as any,
        description: violation.description,
        penalty: violation.penalty,
        isResolved: false
      };

      violationService.addViolation(newViolation);

      // 如果是自动处理的违规，执行相应操作
      if (this.shouldAutoResolve(violation)) {
        await this.autoResolveViolation(violation);
      }

      console.log('违规记录已创建:', violation);
    } catch (error) {
      console.error('处理违规失败:', error);
    }
  }

  // 判断是否应该自动处理
  private shouldAutoResolve(violation: ViolationDetectionResult): boolean {
    const rule = VIOLATION_RULES.find(r => r.id === violation.ruleId);
    return rule?.autoResolve || false;
  }

  // 自动处理违规
  private async autoResolveViolation(violation: ViolationDetectionResult) {
    try {
      switch (violation.type) {
        case 'overstay':
        case 'unauthorized_extension':
          // 强制签退
          if (violation.reservationId) {
            reservationService.checkOut(violation.reservationId);
            console.log('已强制签退预约:', violation.reservationId);
          }
          break;
        case 'frequent_cancellation':
          // 限制用户预约权限
          const user = userService.getAllUsers().find(u => u.id === violation.userId);
          if (user) {
            userService.updateUser(violation.userId, { 
              isBanned: true 
            });
            console.log('已限制用户预约权限:', violation.userId);
          }
          break;
      }
    } catch (error) {
      console.error('自动处理违规失败:', error);
    }
  }

  // 获取违规规则
  getViolationRules(): ViolationRule[] {
    return VIOLATION_RULES;
  }

  // 更新违规规则
  updateViolationRule(ruleId: string, updates: Partial<ViolationRule>) {
    const ruleIndex = VIOLATION_RULES.findIndex(r => r.id === ruleId);
    if (ruleIndex !== -1) {
      VIOLATION_RULES[ruleIndex] = { ...VIOLATION_RULES[ruleIndex], ...updates };
    }
  }

  // 获取检测状态
  getDetectionStatus() {
    return {
      isRunning: this.isRunning,
      rulesCount: VIOLATION_RULES.length,
      enabledRulesCount: VIOLATION_RULES.filter(r => r.enabled).length
    };
  }
}

// 创建全局违规检测器实例
export const violationDetector = new ViolationDetector();

// 自动启动检测（可选）
export const startViolationDetection = () => {
  violationDetector.startAutoDetection(60000); // 1分钟检查一次
};

// 停止检测
export const stopViolationDetection = () => {
  violationDetector.stopAutoDetection();
};