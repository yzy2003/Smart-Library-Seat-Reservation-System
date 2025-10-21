import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import SeatManagement from './components/SeatManagement';
import AdminPanel from './components/AdminPanel';
import ViolationManagement from './components/ViolationManagementNew';
import Statistics from './components/Statistics';
import CheckInOut from './components/CheckInOut';
import { startViolationDetection } from './services/violationDetector';
import './App.css';

// 受保护的路由组件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>加载中...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <Layout>{children}</Layout>;
};

// 管理员路由组件
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  useEffect(() => {
    // 启动违规检测系统
    startViolationDetection();
  }, []);

  return (
    <ConfigProvider locale={zhCN}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/seats" 
              element={
                <ProtectedRoute>
                  <SeatManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/checkin" 
              element={
                <ProtectedRoute>
                  <CheckInOut />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AdminPanel />
                  </AdminRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/violations" 
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <ViolationManagement />
                  </AdminRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/statistics" 
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <Statistics />
                  </AdminRoute>
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
