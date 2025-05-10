import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

interface SupervisorRouteProps {
  children: React.ReactNode;
}

const SupervisorRoute: React.FC<SupervisorRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (user?.role !== 'supervisor' && user?.role !== 'admin') {
    // Redirect to employee dashboard if not a supervisor or admin
    return <Navigate to="/employee" />;
  }

  return <>{children}</>;
};

export default SupervisorRoute; 