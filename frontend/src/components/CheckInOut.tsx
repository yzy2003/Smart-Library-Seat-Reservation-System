import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Space,
  Typography,
  Table,
  Tag,
  message,
  Row,
  Col,
  Statistic,
  Alert,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";
import {
  reservationService,
  seatService,
  areaService,
} from "../services/storage";
import type { Reservation } from "../types";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const CheckInOut: React.FC = () => {
  const { user } = useAuth();
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);

  useEffect(() => {
    if (user) {
      loadMyReservations();
    }
  }, [user]);

  const loadMyReservations = () => {
    if (!user) return;

    const reservations = reservationService.getUserReservations(user.id);
    // 按时间排序，最新的在前
    const sortedReservations = reservations.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setMyReservations(sortedReservations);
  };

  const handleCheckIn = (reservation: Reservation) => {
    try {
      reservationService.checkIn(reservation.id);
      message.success("签到成功！");
      loadMyReservations();
    } catch (error) {
      message.error("签到失败，请重试！");
    }
  };

  const handleCheckOut = (reservation: Reservation) => {
    try {
      reservationService.checkOut(reservation.id);
      message.success("签退成功！");
      loadMyReservations();
    } catch (error) {
      message.error("签退失败，请重试！");
    }
  };

  const getReservationStatus = (reservation: Reservation) => {
    const now = dayjs();
    const startTime = dayjs(reservation.startTime);
    const endTime = dayjs(reservation.endTime);
    const checkinTime = reservation.checkInTime
      ? dayjs(reservation.checkInTime)
      : null;
    const checkoutTime = reservation.checkOutTime
      ? dayjs(reservation.checkOutTime)
      : null;

    if (checkoutTime) {
      return { status: "completed", text: "已完成", color: "gray" };
    }

    if (checkinTime) {
      if (now.isAfter(endTime)) {
        return { status: "overdue", text: "已超时", color: "red" };
      }
      return { status: "checked_in", text: "已签到", color: "green" };
    }

    if (now.isBefore(startTime.subtract(15, "minute"))) {
      return { status: "upcoming", text: "即将开始", color: "blue" };
    }

    if (now.isAfter(endTime.add(15, "minute"))) {
      return { status: "no_show", text: "未签到", color: "orange" };
    }

    return { status: "active", text: "可签到", color: "green" };
  };

  const canCheckIn = (reservation: Reservation) => {
    const now = dayjs();
    const startTime = dayjs(reservation.startTime);
    const endTime = dayjs(reservation.endTime);

    // 可以签到的时间：预约开始前15分钟到预约结束后15分钟
    return (
      (reservation.status === "confirmed" ||
        reservation.status === "pending") &&
      !reservation.checkInTime &&
      now.isAfter(startTime.subtract(15, "minute")) &&
      now.isBefore(endTime.add(15, "minute"))
    );
  };

  const canCheckOut = (reservation: Reservation) => {
    return (
      (reservation.status === "confirmed" ||
        reservation.status === "pending") &&
      reservation.checkInTime &&
      !reservation.checkOutTime
    );
  };

  const getSeatInfo = (seatId: string) => {
    const seat = seatService.getAllSeats().find((s) => s.id === seatId);
    const area = seat
      ? areaService.getAllAreas().find((a) => a.id === seat.area)
      : null;
    return { seat, area };
  };

  const columns = [
    {
      title: "座位信息",
      key: "seat",
      render: (_: any, record: Reservation) => {
        const { seat, area } = getSeatInfo(record.seatId);
        return (
          <div>
            <div>
              <Text strong>{seat?.number || record.seatId}</Text>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                {area?.name || "未知区域"}
              </Text>
            </div>
          </div>
        );
      },
    },
    {
      title: "预约时间",
      key: "time",
      render: (_: any, record: Reservation) => (
        <div>
          <div>{dayjs(record.startTime).format("MM-DD HH:mm")}</div>
          <div style={{ fontSize: "12px", color: "#999" }}>
            至 {dayjs(record.endTime).format("HH:mm")}
          </div>
        </div>
      ),
    },
    {
      title: "状态",
      key: "status",
      render: (_: any, record: Reservation) => {
        const statusInfo = getReservationStatus(record);
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
    },
    {
      title: "签到时间",
      dataIndex: "checkInTime",
      key: "checkInTime",
      render: (time: string) =>
        time ? dayjs(time).format("MM-DD HH:mm") : "-",
    },
    {
      title: "签退时间",
      dataIndex: "checkOutTime",
      key: "checkOutTime",
      render: (time: string) =>
        time ? dayjs(time).format("MM-DD HH:mm") : "-",
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: Reservation) => (
        <Space>
          {canCheckIn(record) && (
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleCheckIn(record)}
            >
              签到
            </Button>
          )}
          {canCheckOut(record) && (
            <Button
              type="default"
              size="small"
              icon={<ClockCircleOutlined />}
              onClick={() => handleCheckOut(record)}
            >
              签退
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const stats = {
    total: myReservations.length,
    active: myReservations.filter(
      (r) => r.status === "confirmed" && !r.checkOutTime
    ).length,
    completed: myReservations.filter((r) => r.checkOutTime).length,
    today: myReservations.filter((r) =>
      dayjs(r.startTime).isSame(dayjs(), "day")
    ).length,
  };

  return (
    <div>
      <Title level={2}>签到/签退</Title>

      {/* 统计信息 */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="总预约数"
              value={stats.total}
              prefix={<HistoryOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="进行中"
              value={stats.active}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="已完成"
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="今日预约"
              value={stats.today}
              prefix={<EnvironmentOutlined />}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
      </Row>

      {/* 签到说明 */}
      <Alert
        message="签到说明"
        description={
          <div>
            <p>• 请在预约开始前15分钟到开始后15分钟内完成签到</p>
            <p>• 点击"签到"按钮即可完成签到</p>
            <p>• 签到后请在使用时间内完成签退</p>
            <p>• 超时未签到或未签退将记录违规</p>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: "24px" }}
      />

      {/* 预约记录 */}
      <Card title="我的预约记录">
        <Table
          dataSource={myReservations}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
};

export default CheckInOut;
