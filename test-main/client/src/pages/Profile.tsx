import React, { useState } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  TextField, 
  Button, 
  Grid,
  Avatar,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import PersonIcon from '@mui/icons-material/Person';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const passwordFormik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      currentPassword: Yup.string().required('كلمة المرور الحالية مطلوبة'),
      newPassword: Yup.string()
        .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
        .required('كلمة المرور الجديدة مطلوبة'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword')], 'كلمات المرور غير متطابقة')
        .required('تأكيد كلمة المرور مطلوب'),
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(false);
        
        await axios.post('https://elmanafea.online/api/auth/change-password', {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        });
        
        setSuccess(true);
        resetForm();
      } catch (error: any) {
        console.error('Error changing password:', error);
        setError(error.response?.data?.message || 'حدث خطأ أثناء تغيير كلمة المرور');
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <Layout title="الملف الشخصي">
      <Typography variant="h4" component="h1" gutterBottom>
        الملف الشخصي
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Avatar sx={{ width: 100, height: 100, mx: 'auto', mb: 2, bgcolor: 'primary.main' }}>
              <PersonIcon sx={{ fontSize: 60 }} />
            </Avatar>
            
            <Typography variant="h5" gutterBottom>
              {user?.full_name}
            </Typography>
            
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {user?.role === 'admin' ? 'مدير النظام' : 
               user?.role === 'supervisor' ? 'مشرف' : 'موظف'}
            </Typography>
            
            <Typography variant="body2" sx={{ mt: 2 }}>
              اسم المستخدم: {user?.username}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              تغيير كلمة المرور
            </Typography>
            
            <Divider sx={{ mb: 3 }} />
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                تم تغيير كلمة المرور بنجاح
              </Alert>
            )}
            
            <form onSubmit={passwordFormik.handleSubmit}>
              <TextField
                fullWidth
                margin="normal"
                id="currentPassword"
                name="currentPassword"
                label="كلمة المرور الحالية"
                type="password"
                value={passwordFormik.values.currentPassword}
                onChange={passwordFormik.handleChange}
                onBlur={passwordFormik.handleBlur}
                error={passwordFormik.touched.currentPassword && Boolean(passwordFormik.errors.currentPassword)}
                helperText={passwordFormik.touched.currentPassword && passwordFormik.errors.currentPassword}
              />
              
              <TextField
                fullWidth
                margin="normal"
                id="newPassword"
                name="newPassword"
                label="كلمة المرور الجديدة"
                type="password"
                value={passwordFormik.values.newPassword}
                onChange={passwordFormik.handleChange}
                onBlur={passwordFormik.handleBlur}
                error={passwordFormik.touched.newPassword && Boolean(passwordFormik.errors.newPassword)}
                helperText={passwordFormik.touched.newPassword && passwordFormik.errors.newPassword}
              />
              
              <TextField
                fullWidth
                margin="normal"
                id="confirmPassword"
                name="confirmPassword"
                label="تأكيد كلمة المرور الجديدة"
                type="password"
                value={passwordFormik.values.confirmPassword}
                onChange={passwordFormik.handleChange}
                onBlur={passwordFormik.handleBlur}
                error={passwordFormik.touched.confirmPassword && Boolean(passwordFormik.errors.confirmPassword)}
                helperText={passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword}
              />
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  type="submit" 
                  variant="contained"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'تغيير كلمة المرور'}
                </Button>
              </Box>
            </form>
          </Paper>
        </Grid>
      </Grid>
    </Layout>
  );
};

export default Profile;