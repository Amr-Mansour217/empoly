import React, { useState } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Alert, 
  CircularProgress,
  AlertTitle,
  Link
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const Login: React.FC = () => {
  const { login, error, clearError, isAuthenticated, isLoading, user } = useAuth();
  const [networkError, setNetworkError] = useState<string | null>(null);

  // Redirect if already authenticated
  if (isAuthenticated && user) {
    if (user.role === 'admin' || user.role === 'supervisor') {
      return <Navigate to="/supervisor/reports" />;
    } else {
      return <Navigate to="/employee" />;
    }
  }

  const formik = useFormik({
    initialValues: {
      username: '',
      password: '',
    },
    validationSchema: Yup.object({
      username: Yup.string().required('اسم المستخدم مطلوب'),
      password: Yup.string().required('كلمة المرور مطلوبة'),
    }),
    onSubmit: async (values) => {
      setNetworkError(null);
      try {
        await login(values.username, values.password);
      } catch (err: any) {
        // Si el error es de red, mostramos un mensaje diferente
        if (!err.response) {
          setNetworkError('لا يمكن الاتصال بالخادم. تأكد من أن الخادم قيد التشغيل ومتاح.');
        }
      }
    },
  });

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 2 }}>
          <Typography component="h1" variant="h5" sx={{ mb: 3, textAlign: 'center' }}>
            نظام متابعة أداء العاملين
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
              <AlertTitle>خطأ في تسجيل الدخول</AlertTitle>
              {error}
            </Alert>
          )}
          
          {networkError && (
            <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setNetworkError(null)}>
              <AlertTitle>خطأ في الاتصال</AlertTitle>
              {networkError}
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2">
                  تأكد من أن خادم API يعمل على المنفذ 5001.
                </Typography>
              </Box>
            </Alert>
          )}
          
          <form onSubmit={formik.handleSubmit}>
            <TextField
              margin="normal"
              fullWidth
              label="اسم المستخدم"
              name="username"
              autoComplete="username"
              value={formik.values.username}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.username && Boolean(formik.errors.username)}
              helperText={formik.touched.username && formik.errors.username}
              autoFocus
            />
            
            <TextField
              margin="normal"
              fullWidth
              name="password"
              label="كلمة المرور"
              type="password"
              autoComplete="current-password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'تسجيل الدخول'}
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 