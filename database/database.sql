-- 用户表
CREATE TABLE users (
  id              VARCHAR(36) PRIMARY KEY,
  username        VARCHAR(64) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  role            ENUM('admin','student','teacher') NOT NULL,
  name            VARCHAR(100) NOT NULL,
  student_id      VARCHAR(32),
  teacher_id      VARCHAR(32),
  email           VARCHAR(128) NOT NULL,
  phone           VARCHAR(32),
  violation_count INT NOT NULL DEFAULT 0,
  is_banned       TINYINT(1) NOT NULL DEFAULT 0,
  created_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  last_login_at   DATETIME(3) NULL,
  CONSTRAINT chk_users_role CHECK (role IN ('admin','student','teacher'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 区域表
CREATE TABLE areas (
  id               VARCHAR(36) PRIMARY KEY,
  name             VARCHAR(100) NOT NULL,
  floor            INT NOT NULL,
  description      VARCHAR(255),
  total_seats      INT NOT NULL DEFAULT 0,
  available_seats  INT NOT NULL DEFAULT 0,
  is_active        TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 座位表
CREATE TABLE seats (
  id            VARCHAR(36) PRIMARY KEY,
  number        VARCHAR(50) NOT NULL,
  area_id       VARCHAR(36) NOT NULL,
  floor         INT NOT NULL,
  row_no        INT NOT NULL,
  col_no        INT NOT NULL,
  status        ENUM('available','occupied','reserved','maintenance','temporarily_released') NOT NULL DEFAULT 'available',
  features_json JSON NULL,            -- 对应前端 features:string[]，用 JSON 存储
  is_reservable TINYINT(1) NOT NULL DEFAULT 1,
  created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_seats_area FOREIGN KEY (area_id) REFERENCES areas(id),
  INDEX idx_seats_area (area_id),
  INDEX idx_seats_area_floor (area_id, floor),
  INDEX idx_seats_grid (area_id, row_no, col_no),
  CONSTRAINT chk_seat_status CHECK (status IN ('available','occupied','reserved','maintenance','temporarily_released'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 预约表
CREATE TABLE reservations (
  id                       VARCHAR(36) PRIMARY KEY,
  user_id                  VARCHAR(36) NOT NULL,
  seat_id                  VARCHAR(36) NOT NULL,
  start_time               DATETIME(3) NOT NULL,
  end_time                 DATETIME(3) NOT NULL,
  status                   ENUM('pending','confirmed','cancelled','completed','expired','temporarily_released') NOT NULL,
  checkin_time             DATETIME(3) NULL,
  checkout_time            DATETIME(3) NULL,
  qr_code                  VARCHAR(512) NULL,
  notes                    VARCHAR(255) NULL,
  -- 临时释放相关
  temp_release_time        DATETIME(3) NULL,
  temp_release_duration    INT NULL,           -- 分钟
  temp_release_reason      VARCHAR(255) NULL,
  temp_release_expiry_time DATETIME(3) NULL,
  created_at               DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at               DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_resv_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_resv_seat FOREIGN KEY (seat_id) REFERENCES seats(id),
  INDEX idx_resv_user_time (user_id, start_time, end_time),
  INDEX idx_resv_seat_time (seat_id, start_time, end_time),
  INDEX idx_resv_status (status),
  CONSTRAINT chk_resv_status CHECK (status IN ('pending','confirmed','cancelled','completed','expired','temporarily_released'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 违规表
CREATE TABLE violations (
  id            VARCHAR(36) PRIMARY KEY,
  user_id       VARCHAR(36) NOT NULL,
  reservation_id VARCHAR(36) NULL,
  type          ENUM('no_show','overstay','late_checkin','unauthorized_use','frequent_cancellation','unauthorized_extension') NOT NULL,
  description   VARCHAR(512) NOT NULL,
  penalty       VARCHAR(255) NOT NULL,
  is_resolved   TINYINT(1) NOT NULL DEFAULT 0,
  created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  resolved_at   DATETIME(3) NULL,
  resolved_by   VARCHAR(36) NULL, -- 管理员用户ID
  CONSTRAINT fk_violation_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_violation_resv FOREIGN KEY (reservation_id) REFERENCES reservations(id),
  INDEX idx_violation_user_date (user_id, created_at),
  INDEX idx_violation_type_date (type, created_at),
  INDEX idx_violation_resolved (is_resolved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
