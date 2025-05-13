import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import SupervisorRoute from './components/SupervisorRoute';

// Pages
import Login from './pages/Login';
import EmployeeDashboard from './pages/employee/Dashboard';
import DailyReportForm from './pages/employee/DailyReportForm';
import SupervisorDashboard from './pages/supervisor/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Employee routes */}
          <Route 
            path="/employee" 
            element={
              <PrivateRoute>
                <EmployeeDashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/employee/report" 
            element={
              <PrivateRoute>
                <DailyReportForm />
              </PrivateRoute>
            } 
          />
          
          {/* Supervisor routes */}
          <Route 
            path="/supervisor" 
            element={
              <SupervisorRoute>
                <SupervisorDashboard />
              </SupervisorRoute>
            } 
          />
          <Route 
            path="/supervisor/reports" 
            element={
              <SupervisorRoute>
                <Reports />
              </SupervisorRoute>
            } 
          />
          
          {/* Admin routes */}
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <AdminRoute>
                <UserManagement />
              </AdminRoute>
            } 
          />
          
          {/* Shared routes */}
          <Route 
            path="/profile" 
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } 
          />
          
          {/* Redirects */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Box>
    </AuthProvider>
  );
}

export default App;