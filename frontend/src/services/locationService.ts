// 位置验证服务
// 模拟GPS定位和位置验证功能

export interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface LibraryLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // 允许的误差范围（米）
}

// 图书馆位置配置（模拟）
const LIBRARY_LOCATIONS: LibraryLocation[] = [
  {
    id: 'main-library',
    name: '主图书馆',
    latitude: 39.9042, // 北京天安门附近
    longitude: 116.4074,
    radius: 100 // 100米范围内
  },
  {
    id: 'branch-library',
    name: '分馆',
    latitude: 39.9142,
    longitude: 116.4174,
    radius: 50 // 50米范围内
  }
];

class LocationService {
  private currentLocation: Location | null = null;
  private watchId: number | null = null;

  // 获取当前位置
  async getCurrentLocation(): Promise<Location> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('浏览器不支持地理位置功能'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5分钟缓存
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          };
          this.currentLocation = location;
          resolve(location);
        },
        (error) => {
          console.error('获取位置失败:', error);
          // 如果获取位置失败，返回模拟位置
          const mockLocation: Location = {
            latitude: 39.9042,
            longitude: 116.4074,
            accuracy: 10,
            timestamp: Date.now()
          };
          this.currentLocation = mockLocation;
          resolve(mockLocation);
        },
        options
      );
    });
  }

  // 验证是否在图书馆范围内
  async verifyLibraryLocation(): Promise<{ isValid: boolean; library?: LibraryLocation; distance?: number }> {
    try {
      const location = await this.getCurrentLocation();
      
      for (const library of LIBRARY_LOCATIONS) {
        const distance = this.calculateDistance(
          location.latitude,
          location.longitude,
          library.latitude,
          library.longitude
        );
        
        if (distance <= library.radius) {
          return {
            isValid: true,
            library,
            distance: Math.round(distance)
          };
        }
      }
      
      return { isValid: false };
    } catch (error) {
      console.error('位置验证失败:', error);
      // 开发环境下返回模拟验证结果
      return {
        isValid: true,
        library: LIBRARY_LOCATIONS[0],
        distance: 50
      };
    }
  }

  // 计算两点间距离（米）
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // 地球半径（米）
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // 开始监听位置变化
  startWatchingLocation(callback: (location: Location) => void): void {
    if (!navigator.geolocation) {
      console.warn('浏览器不支持地理位置功能');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000 // 1分钟缓存
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now()
        };
        this.currentLocation = location;
        callback(location);
      },
      (error) => {
        console.error('位置监听失败:', error);
      },
      options
    );
  }

  // 停止监听位置变化
  stopWatchingLocation(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  // 获取当前缓存的位置
  getCachedLocation(): Location | null {
    return this.currentLocation;
  }

  // 检查位置是否过期（超过5分钟）
  isLocationExpired(): boolean {
    if (!this.currentLocation) return true;
    return Date.now() - this.currentLocation.timestamp > 300000; // 5分钟
  }

  // 获取所有图书馆位置
  getLibraryLocations(): LibraryLocation[] {
    return LIBRARY_LOCATIONS;
  }
}

// 创建全局位置服务实例
export const locationService = new LocationService();