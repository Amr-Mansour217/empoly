import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import Layout from '../../components/Layout';

interface ActivityType {
  id: number;
  name: string;
}

const DailyReportForm: React.FC = () => {
  const navigate = useNavigate();
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [hasSubmittedToday, setHasSubmittedToday] = useState<boolean>(false);
  const [initialValues, setInitialValues] = useState({
    activity_type_id: '',
    beneficiaries_count: '',
    location: '',
  });

  // Check if employee has already submitted a report today
  useEffect(() => {
    const checkTodayReport = async () => {
      try {
        const response = await axios.get('/api/reports/me/current');
        
        if (response.data.hasSubmitted) {
          setHasSubmittedToday(true);
          // Pre-fill form with today's report data if it exists
          if (response.data.report) {
            setInitialValues({
              activity_type_id: response.data.report.activity_type_id.toString(),
              beneficiaries_count: response.data.report.beneficiaries_count.toString(),
              location: response.data.report.location || '',
            });
          }
        }
      } catch (error) {
        console.error('Error checking today\'s report:', error);
      }
    };

    // Fetch activity types
    const fetchActivityTypes = async () => {
      try {
        const response = await axios.get('/api/activities');
        setActivityTypes(response.data.activities);
      } catch (error) {
        console.error('Error fetching activity types:', error);
        setError('حدث خطأ أثناء جلب أنواع الأنشطة');
      }
    };

    checkTodayReport();
    fetchActivityTypes();
  }, []);

  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    validationSchema: Yup.object({
      activity_type_id: Yup.string().required('نوع النشاط مطلوب'),
      beneficiaries_count: Yup.number()
        .required('عدد المستفيدين مطلوب')
        .positive('يجب أن يكون عدد المستفيدين أكبر من صفر')
        .integer('يجب أن يكون عدد المستفيدين عدداً صحيحاً'),
      location: Yup.string(),
    }),
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError(null);
        
        await axios.post('/api/reports', {
          activity_type_id: parseInt(values.activity_type_id),
          beneficiaries_count: parseInt(values.beneficiaries_count),
          location: values.location || null,
        });
        
        setSuccess(true);
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/employee');
        }, 2000);
      } catch (error: any) {
        console.error('Error submitting report:', error);
        setError(error.response?.data?.message || 'حدث خطأ أثناء إرسال التقرير');
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <Layout title="التقرير اليومي">
      <Typography variant="h4" component="h1" gutterBottom>
        التقرير اليومي
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        {format(new Date(), 'yyyy/MM/dd')}
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            تم إرسال التقرير بنجاح
          </Alert>
        )}
        
        {hasSubmittedToday && !success && (
          <Alert severity="info" sx={{ mb: 3 }}>
            لقد قمت بإرسال تقرير اليوم بالفعل. يمكنك تعديل التقرير.
          </Alert>
        )}
        
        <form onSubmit={formik.handleSubmit}>
          <FormControl 
            fullWidth 
            margin="normal"
            error={formik.touched.activity_type_id && Boolean(formik.errors.activity_type_id)}
          >
            <InputLabel id="activity-type-label">نوع النشاط</InputLabel>
            <Select
              labelId="activity-type-label"
              id="activity_type_id"
              name="activity_type_id"
              value={formik.values.activity_type_id}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              label="نوع النشاط"
            >
              {activityTypes.map((type) => (
                <MenuItem key={type.id} value={type.id.toString()}>
                  {type.name}
                </MenuItem>
              ))}
            </Select>
            {formik.touched.activity_type_id && formik.errors.activity_type_id && (
              <FormHelperText>{formik.errors.activity_type_id}</FormHelperText>
            )}
          </FormControl>
          
          <TextField
            fullWidth
            margin="normal"
            id="beneficiaries_count"
            name="beneficiaries_count"
            label="عدد المستفيدين"
            type="number"
            value={formik.values.beneficiaries_count}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.beneficiaries_count && Boolean(formik.errors.beneficiaries_count)}
            helperText={formik.touched.beneficiaries_count && formik.errors.beneficiaries_count}
          />
          
          <TextField
            fullWidth
            margin="normal"
            id="location"
            name="location"
            label="الموقع (اختياري)"
            value={formik.values.location}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.location && Boolean(formik.errors.location)}
            helperText={formik.touched.location && formik.errors.location}
          />
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              type="button" 
              variant="outlined" 
              onClick={() => navigate('/employee')}
              sx={{ ml: 2 }}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : hasSubmittedToday ? 'تحديث التقرير' : 'إرسال التقرير'}
            </Button>
          </Box>
        </form>
      </Paper>
      
      {/* Success Dialog */}
      <Dialog
        open={success}
        aria-labelledby="success-dialog-title"
        aria-describedby="success-dialog-description"
      >
        <DialogTitle id="success-dialog-title">
          تم بنجاح
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="success-dialog-description">
            تم {hasSubmittedToday ? 'تحديث' : 'إرسال'} التقرير بنجاح. جاري تحويلك إلى الصفحة الرئيسية...
          </DialogContentText>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default DailyReportForm; 