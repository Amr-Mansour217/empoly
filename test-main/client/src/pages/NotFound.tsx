import React from 'react';
import { Container, Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const handleGoBack = () => {
    if (isAuthenticated && user) {
      // Redirect based on user role
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'supervisor') {
        navigate('/supervisor');
      } else {
        navigate('/employee');
      }
    } else {
      navigate('/login');
    }
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          textAlign: 'center',
        }}
      >
        <Typography variant="h1" component="h1" sx={{ mb: 2, fontSize: { xs: '6rem', md: '10rem' } }}>
          404
        </Typography>
        
        <Typography variant="h4" component="h2" sx={{ mb: 4 }}>
          الصفحة غير موجودة
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 4 }}>
          عذراً، الصفحة التي تبحث عنها غير موجودة
        </Typography>
        
        <Button variant="contained" onClick={handleGoBack} size="large">
          العودة للصفحة الرئيسية
        </Button>
      </Box>
    </Container>
  );
};

export default NotFound; 