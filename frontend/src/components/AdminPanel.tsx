import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import {
  userService,
  violationService,
  reservationService,
} from "../services/storage";
import type { User, Violation, Reservation } from "../types";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [violationModalVisible, setViolationModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingViolation, setEditingViolation] = useState<Violation | null>(
    null
  );
  const [userForm] = Form.useForm();
  const [violationForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allUsers = userService.getAllUsers();
    const allViolations = violationService.getAllViolations();
    const allReservations = reservationService.getAllReservations();

    setUsers(allUsers);
    setViolations(allViolations);
    setReservations(allReservations);
  };

  const handleAddUser = () => {
    setEditingUser(null);
    userForm.resetFields();
    setUserModalVisible(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    userForm.setFieldsValue({
      ...user,
      password: "", // 不显示密码
    });
    setUserModalVisible(true);
  };

  const handleDeleteUser = (userId: string) => {
    Modal.confirm({
      title: "确认删除",
      content: "确定要删除这个用户吗？",
      icon: <ExclamationCircleOutlined />,
      okText: "删除",
      cancelText: "取消",
      okButtonProps: { danger: true },
      async onOk() {
        const ok = userService.deleteUser(userId);
        if (!ok) {
          message.error("删除失败，用户不存在！");
          throw new Error("删除失败");
        }
        message.success("用户删除成功！");
        loadData();
      },
    });
  };

  const handleUserSubmit = async (values: any) => {
    try {
      if (editingUser) {
        // 更新用户
        const updatedUser = userService.updateUser(editingUser.id, values);
        if (updatedUser) {
          message.success("用户更新成功！");
        }
      } else {
        // 添加用户
        const newUser = userService.addUser(values);
        if (newUser) {
          message.success("用户添加成功！");
        }
      }
      setUserModalVisible(false);
      loadData();
    } catch (error) {
      message.error("操作失败，请重试！");
    }
  };

  const handleResolveViolation = (violationId: string) => {
    const currentUser = userService
      .getAllUsers()
      .find((u) => u.role === "admin");
    if (currentUser) {
      violationService.resolveViolation(violationId, currentUser.id);
      message.success("违规记录已处理！");
      loadData();
    }
  };

  const userColumns = [
    {
      title: "用户名",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "姓名",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "角色",
      dataIndex: "role",
      key: "role",
      render: (role: string) => {
        const roleMap: Record<string, { text: string; color: string }> = {
          admin: { text: "管理员", color: "red" },
          student: { text: "学生", color: "blue" },
          teacher: { text: "教师", color: "green" },
        };
        const roleInfo = roleMap[role] || { text: role, color: "default" };
        return <Tag color={roleInfo.color}>{roleInfo.text}</Tag>;
      },
    },
    {
      title: "邮箱",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "违规次数",
      dataIndex: "violationCount",
      key: "violationCount",
      render: (count: number) => (
        <Tag color={count > 0 ? "red" : "green"}>{count} 次</Tag>
      ),
    },
    {
      title: "状态",
      dataIndex: "isBanned",
      key: "isBanned",
      render: (isBanned: boolean) => (
        <Tag color={isBanned ? "red" : "green"}>
          {isBanned ? "已禁用" : "正常"}
        </Tag>
      ),
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: User) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditUser(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteUser(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const violationColumns = [
    {
      title: "用户",
      dataIndex: "userId",
      key: "userId",
      render: (userId: string) => {
        const user = users.find((u) => u.id === userId);
        return user?.name || userId;
      },
    },
    {
      title: "违规类型",
      dataIndex: "type",
      key: "type",
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          no_show: "未签到",
          overstay: "超时占用",
          late_checkin: "迟到",
          unauthorized_use: "未授权使用",
        };
        return typeMap[type] || type;
      },
    },
    {
      title: "描述",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "处罚",
      dataIndex: "penalty",
      key: "penalty",
    },
    {
      title: "状态",
      dataIndex: "isResolved",
      key: "isResolved",
      render: (isResolved: boolean) => (
        <Tag color={isResolved ? "green" : "red"}>
          {isResolved ? "已处理" : "待处理"}
        </Tag>
      ),
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (time: string) => dayjs(time).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: Violation) => (
        <Space>
          {!record.isResolved && (
            <Button
              type="link"
              icon={<CheckCircleOutlined />}
              onClick={() => handleResolveViolation(record.id)}
            >
              处理
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const reservationColumns = [
    {
      title: "用户",
      dataIndex: "userId",
      key: "userId",
      render: (userId: string) => {
        const user = users.find((u) => u.id === userId);
        return user?.name || userId;
      },
    },
    {
      title: "座位",
      dataIndex: "seatId",
      key: "seatId",
    },
    {
      title: "开始时间",
      dataIndex: "startTime",
      key: "startTime",
      render: (time: string) => dayjs(time).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "结束时间",
      dataIndex: "endTime",
      key: "endTime",
      render: (time: string) => dayjs(time).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const statusMap: Record<string, { text: string; color: string }> = {
          pending: { text: "待确认", color: "blue" },
          confirmed: { text: "已确认", color: "green" },
          cancelled: { text: "已取消", color: "red" },
          completed: { text: "已完成", color: "gray" },
        };
        const statusInfo = statusMap[status] || {
          text: status,
          color: "default",
        };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
    },
  ];

  return (
    <div>
      <Title level={2}>管理员面板</Title>

      {/* 统计信息 */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="总用户数"
              value={users.length}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="待处理违规"
              value={violations.filter((v) => !v.isResolved).length}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="今日预约"
              value={
                reservations.filter((r) =>
                  dayjs(r.createdAt).isSame(dayjs(), "day")
                ).length
              }
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
      </Row>

      {/* 用户管理 */}
      <Card
        title="用户管理"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddUser}
          >
            添加用户
          </Button>
        }
        style={{ marginBottom: "24px" }}
      >
        <Table
          dataSource={users}
          columns={userColumns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* 违规管理 */}
      <Card title="违规管理" style={{ marginBottom: "24px" }}>
        <Table
          dataSource={violations}
          columns={violationColumns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* 预约记录 */}
      <Card title="预约记录">
        <Table
          dataSource={reservations}
          columns={reservationColumns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* 用户编辑模态框 */}
      <Modal
        title={editingUser ? "编辑用户" : "添加用户"}
        open={userModalVisible}
        onCancel={() => setUserModalVisible(false)}
        footer={null}
      >
        <Form form={userForm} layout="vertical" onFinish={handleUserSubmit}>
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: "请输入用户名!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: "请输入姓名!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: "请选择角色!" }]}
          >
            <Select>
              <Option value="admin">管理员</Option>
              <Option value="student">学生</Option>
              <Option value="teacher">教师</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: "请输入邮箱!" },
              { type: "email", message: "请输入有效的邮箱地址!" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="phone"
            label="电话"
            rules={[{ required: true, message: "请输入电话!" }]}
          >
            <Input />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: "请输入密码!" }]}
            >
              <Input.Password />
            </Form.Item>
          )}

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingUser ? "更新" : "添加"}
              </Button>
              <Button onClick={() => setUserModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminPanel;
