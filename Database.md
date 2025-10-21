# 数据关系表
## 一、 用户表
| 字段名 | 类型 | 约束 | 说明 |
|:---:|:---:|:---:|:---:|
| username | VARCHAR(20) | UNIQUE | 学号或工号 |
| password | VARCHAR(20) | NOT NULL | 密码 |
| name | VARCHAR(10) | NOT NULL | 姓名 |
| role | ENUM('STUDENT', 'TEACHER', 'ADMIN') | DEFAULT 'STUDENT' | 用户权限
| violation_count | INT | DEFAULT 0 | 违规次数 |
## 二、座位区域表
| 字段名 | 类型 | 约束 | 说明 |
|:---:|:---:|:---:|:---:|
| area_id | INT |  PRIMARY KEY AUTO_INCREMENT | 区域ID |
| area_name | VARCHAR(50) | UNIQUE | 区域名称 |
| seat_count | INT | | 座位总数 |
| free_seat_count | INT | | 空闲座位数量 |
## 三、座位表
| 字段名 | 类型 | 约束 | 说明 |
|:---:|:---:|:---:|:---:|
| area_id | INT | FOREIGN KEY REFERENCES `seat_area`(area_id) ON DELETE CASCADE | 所属区域
| seat_id | INT | PRIMARY KEY AUTO_INCREMENT | 座位ID |
| status | ENUM('FREE','RESERVED','OCCUPIED')| DEFAULT'FREE'  | 当前状态 |
| current_user_id | INT                                | NULL, FOREIGN KEY 
| position_x | INT | | 平面坐标X |
| position_y | INT | | 平面坐标Y |
## 四、预约、使用表
| 字段名 | 类型 | 约束 | 说明 |
|:---:|:---:|:---:|:---:|
| booking_id	| INT | PRIMARY KEY AUTO_INCREMENT |	预约ID |
| user_id | INT | FOREIGN KEY REFERENCES user(user_id) | 预约用户 |
| seat_id | INT	| FOREIGN KEY REFERENCES seat(seat_id)	| 座位 |
| start_time | DATETIME	| NOT NULL | 预约开始时间 |
| end_time | DATETIME | NOT NULL | 预约结束时间 |
| status | ENUM('BOOKED','CANCELLED','COMPLETED')	| DEFAULT 'BOOKED' | 状态 |
## 五、违规记录
| 字段名 | 类型 | 约束  | 说明  |
|:---:|:---:|:---:|:---:|
| violation_id   | INT   | PRIMARY KEY AUTO_INCREMENT                   | 违规记录ID |
| user_id        | INT    | FOREIGN KEY REFERENCES `user`(user_id)       | 违规用户   |
| booking_id     | INT    | FOREIGN KEY REFERENCES `booking`(booking_id) | 对应预约   |
| violation_type | ENUM('NO_SHOW','OVERTIME') | NOT NULL   | 违规类型 |
| created_at     | DATETIME  | DEFAULT CURRENT_TIMESTAMP   | 违规时间   |
| handled_by     | INT   | FOREIGN KEY REFERENCES `user`(user_id)       | 管理员ID  |
| is_resolved    | BOOLEAN   | DEFAULT FALSE      | 是否处理完毕 |
