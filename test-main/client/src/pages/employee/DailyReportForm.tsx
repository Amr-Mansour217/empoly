import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel,
  FormHelperText, 
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Divider,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import Layout from '../../components/Layout';

const DailyReportForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [hasSubmittedToday, setHasSubmittedToday] = useState<boolean>(false);
  
  // الحصول على الوقت الحالي بتنسيق HH:MM (الساعة فقط)
  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  
  const currentTime = getCurrentTime();
  
  const [initialValues, setInitialValues] = useState({
    // الدرس الأول
    lesson1_beneficiaries: '',
    lesson1_time: currentTime,
    lesson1_completed: false,
    // الدرس الثاني
    lesson2_beneficiaries: '',
    lesson2_time: currentTime,
    lesson2_completed: false,
    // حلقة التلاوة
    quran_session_beneficiaries: '',
    quran_session_time: currentTime,
    quran_session_completed: false,
  });

  // تخزين معرف التقرير لاستخدامه عند التحديث
  const [reportId, setReportId] = useState<number | null>(null);
  // تخزين معرف النشاط لاستخدامه عند التحديث
  const [activityId, setActivityId] = useState<number>(1);
  
  // Check if employee has already submitted a report today
  useEffect(() => {
    const checkTodayReport = async () => {
      try {
        const response = await axios.get('https://elmanafea.online/api/reports/me/current');
        console.log('بيانات التقرير الحالي:', response.data);
        
        if (response.data.hasSubmitted) {
          setHasSubmittedToday(true);
          // Pre-fill form with today's report data if it exists
          if (response.data.report) {
            // حفظ معرف التقرير للتحديث لاحقًا
            if (response.data.report.id) {
              setReportId(response.data.report.id);
              console.log('تم العثور على معرف التقرير:', response.data.report.id);
            }
            
            // حفظ معرف النشاط لاستخدامه في التحديث
            if (response.data.report.activity_type_id) {
              setActivityId(response.data.report.activity_type_id);
              console.log('تم تخزين معرف النشاط:', response.data.report.activity_type_id);
            }
            
            // تحويل البيانات المخزنة في النظام القديم إلى التنسيق الجديد
            // تحويل البيانات المخزنة واستخدام الوقت المحفوظ أو الوقت الحالي
            setInitialValues({
              lesson1_beneficiaries: response.data.report.lesson1_beneficiaries?.toString() || '',
              lesson1_time: response.data.report.lesson1_time || currentTime,
              lesson1_completed: response.data.report.lesson1_completed || false,
              lesson2_beneficiaries: response.data.report.lesson2_beneficiaries?.toString() || '',
              lesson2_time: response.data.report.lesson2_time || currentTime,
              lesson2_completed: response.data.report.lesson2_completed || false,
              quran_session_beneficiaries: response.data.report.quran_session_beneficiaries?.toString() || '',
              quran_session_time: response.data.report.quran_session_time || currentTime,
              quran_session_completed: response.data.report.quran_session_completed || false,
            });
          }
        }
      } catch (error) {
        console.error('Error checking today\'s report:', error);
      }
    };

    checkTodayReport();
  }, []);

  // إضافة دالة لتحديث الوقت بالساعة الحالية
  const updateCurrentTime = () => {
    formik?.setFieldValue('lesson1_time', getCurrentTime());
    formik?.setFieldValue('lesson2_time', getCurrentTime());
    formik?.setFieldValue('quran_session_time', getCurrentTime());
  };
  
  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    validationSchema: Yup.object({
      // الدرس الأول
      lesson1_beneficiaries: Yup.number()
        .required('عدد المستفيدين مطلوب')
        .transform((v) => (v === '' ? undefined : v))
        .positive('يجب أن يكون العدد أكبر من صفر')
        .integer('يجب أن يكون العدد صحيحاً'),
      lesson1_time: Yup.string().required('وقت التنفيذ مطلوب'),
      
      // الدرس الثاني
      lesson2_beneficiaries: Yup.number()
        .required('عدد المستفيدين مطلوب')
        .transform((v) => (v === '' ? undefined : v))
        .positive('يجب أن يكون العدد أكبر من صفر')
        .integer('يجب أن يكون العدد صحيحاً'),
      lesson2_time: Yup.string().required('وقت التنفيذ مطلوب'),
      
      // حلقة التلاوة
      quran_session_beneficiaries: Yup.number()
        .required('عدد المستفيدين مطلوب')
        .transform((v) => (v === '' ? undefined : v))
        .positive('يجب أن يكون العدد أكبر من صفر')
        .integer('يجب أن يكون العدد صحيحاً'),
      quran_session_time: Yup.string().required('وقت التنفيذ مطلوب'),
    }),
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError(null);
        
        // تأكد من وجود قيم صحيحة لعدد المستفيدين - على الأقل 0
        const getValidNumber = (value: any): number => {
          if (value === '' || value === null || value === undefined) return 0;
          const num = Number(value);
          return isNaN(num) ? 0 : num;
        };
        
        // قم بتعيين قيم رقمية صحيحة بدلاً من التحقق والإيقاف
        const formValues = {
          ...values,
          lesson1_beneficiaries: getValidNumber(values.lesson1_beneficiaries) || 0,
          lesson2_beneficiaries: getValidNumber(values.lesson2_beneficiaries) || 0,
          quran_session_beneficiaries: getValidNumber(values.quran_session_beneficiaries) || 0
        };
        
        // تأكد من أن على الأقل واحد من الحقول يحتوي على قيمة موجبة
        if (formValues.lesson1_beneficiaries <= 0 && 
            formValues.lesson2_beneficiaries <= 0 && 
            formValues.quran_session_beneficiaries <= 0) {
          setError('يجب إدخال عدد المستفيدين في واحد من الدروس على الأقل');
          setLoading(false);
          return;
        }
        
        console.log('إرسال البيانات:', values);
        
        try {
          // محاولة ضبط قيمة الرقم على أنها عدد صحيح أو 0 للقيم الفارغة
          const getValue = (value: any): number => {
            if (value === null || value === undefined) return 0;
            if (typeof value === 'number') return value;
            if (typeof value === 'string') {
              // التحقق من أن القيمة سلسلة نصية قبل استخدام trim
              const trimmed = value.trim ? value.trim() : '';
              if (trimmed === '') return 0;
              const parsed = parseInt(trimmed);
              return isNaN(parsed) ? 0 : parsed;
            }
            return 0;
          };
          
          // تنسيق البيانات قبل الإرسال
          const lesson1Count = getValue(values.lesson1_beneficiaries);
          const lesson2Count = getValue(values.lesson2_beneficiaries);
          const quranSessionCount = getValue(values.quran_session_beneficiaries);
          
          // حساب المجموع الإجمالي للمستفيدين
          const totalBeneficiaries = lesson1Count + lesson2Count + quranSessionCount;
          
          console.log('إجمالي عدد المستفيدين:', totalBeneficiaries);
          
          // تأكد من أن جميع القيم عبارة عن أعداد صحيحة وأن السلاسل النصية سليمة
          const safeString = (value: any): string => {
            if (value === null || value === undefined) return '';
            return String(value);
          };
          
          // إعداد البيانات الأساسية التي سيتم إرسالها
          const baseData = {
            activity_type_id: activityId, // استخدام معرف النشاط المخزن مسبقًا
            beneficiaries_count: totalBeneficiaries,
            location: '',
            lesson1_beneficiaries: lesson1Count,
            lesson1_time: safeString(values.lesson1_time),
            // تحديد حالة تنفيذ الدروس بناءً على عدد المستفيدين بدلاً من الاعتماد على الحقل في النموذج
            lesson1_completed: lesson1Count > 0,
            lesson2_beneficiaries: lesson2Count,
            lesson2_time: safeString(values.lesson2_time),
            lesson2_completed: lesson2Count > 0,
            quran_session_beneficiaries: quranSessionCount,
            quran_session_time: safeString(values.quran_session_time),
            quran_session_completed: quranSessionCount > 0,
            date: format(new Date(), 'yyyy-MM-dd') // إضافة تاريخ اليوم بصيغة مفهومة للخادم
          };
          
          console.log('البيانات المرسلة للخادم:', baseData);
          
          let response;
          
          // نستخدم POST للتحديث أيضًا مع معلمة إضافية تشير إلى أنه تحديث
          // يبدو أن الخادم لا يدعم طريقة PUT للتحديث
          console.log(hasSubmittedToday ? 'تحديث التقرير' : 'إنشاء تقرير جديد');
          
          // إضافة معرف التقرير للبيانات المرسلة إذا كنا نقوم بالتحديث
          if (hasSubmittedToday && reportId) {
            console.log(`تحديث التقرير رقم ${reportId}`);
            // إضافة معرف التقرير إلى البيانات المرسلة
            baseData['id'] = reportId;
            // إضافة علامة تحديث
            baseData['is_update'] = true;
          }
          
          // محاولة التنفيذ بطرق مختلفة إذا فشلت الطريقة الأولى
          // استخدم طريقة أبسط للتحديث - محاولة واحدة فقط لتقليل التعقيد
          console.log('إرسال البيانات إلى الخادم...');
          
          // فحص وتصحيح أي مشكلات محتملة في البيانات
          Object.keys(baseData).forEach(key => {
            if (baseData[key] === undefined) {
              console.log(`تصحيح قيمة غير معرفة في ${key}`);
              baseData[key] = null;
            }
          });
          
          try {
            // استخدم طريقة POST سواء للإنشاء أو التحديث - دع الخادم يتعامل مع المنطق
            const url = hasSubmittedToday && reportId ? 
              `https://elmanafea.online/api/reports/today/${reportId}` : // محاولة استخدام مسار خاص للتحديث
              'https://elmanafea.online/api/reports';
            
            console.log(`إرسال الطلب إلى: ${url}`);
            console.log('البيانات المرسلة:', JSON.stringify(baseData));
            
            response = await axios.post(url, baseData);
            console.log('تم الرد بنجاح:', response.status);
          } catch (error: any) {
            console.error('فشل في إرسال التقرير:', error.message);
            console.error('تفاصيل الخطأ:', error.response?.data);
            throw error;
          }
          
          console.log('استجابة الخادم:', response.data);
          
        } catch (apiError: any) {
          console.error('خطأ في API:', apiError.response?.data || apiError);
          throw apiError;
        }
        
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
          {/* الدرس الأول */}
          <Box sx={{ mt: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              الدرس الأول
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {/* تم إزالة خانة الاختيار لأن حالة تنفيذ النشاط تُحدد تلقائيًا بناءً على عدد المستفيدين */}
            <Box sx={{ mt: 1, mb: 1, bgcolor: '#f5f5f5', p: 1, borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                * سيتم تحديد حالة تنفيذ النشاط تلقائيًا بناءً على عدد المستفيدين (إذا كان العدد أكبر من صفر)
              </Typography>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="lesson1_beneficiaries"
                  name="lesson1_beneficiaries"
                  label="عدد المستفيدين"
                  type="number"
                  value={formik.values.lesson1_beneficiaries}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.lesson1_beneficiaries && Boolean(formik.errors.lesson1_beneficiaries)}
                  helperText={formik.touched.lesson1_beneficiaries && formik.errors.lesson1_beneficiaries}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="lesson1_time"
                  name="lesson1_time"
                  label="وقت التنفيذ (الساعة)"
                  type="time"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    step: 300, // 5 دقائق
                  }}
                  value={formik.values.lesson1_time}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.lesson1_time && Boolean(formik.errors.lesson1_time)}
                  helperText={formik.touched.lesson1_time && formik.errors.lesson1_time}
                  sx={{ '& input': { direction: 'ltr' } }}
                />
              </Grid>
            </Grid>
          </Box>
          
          {/* الدرس الثاني */}
          <Box sx={{ mt: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              الدرس الثاني
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="lesson2_beneficiaries"
                  name="lesson2_beneficiaries"
                  label="عدد المستفيدين"
                  type="number"
                  value={formik.values.lesson2_beneficiaries}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.lesson2_beneficiaries && Boolean(formik.errors.lesson2_beneficiaries)}
                  helperText={formik.touched.lesson2_beneficiaries && formik.errors.lesson2_beneficiaries}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="lesson2_time"
                  name="lesson2_time"
                  label="وقت التنفيذ (الساعة)"
                  type="time"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    step: 300, // 5 دقائق
                  }}
                  value={formik.values.lesson2_time}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.lesson2_time && Boolean(formik.errors.lesson2_time)}
                  helperText={formik.touched.lesson2_time && formik.errors.lesson2_time}
                  sx={{ '& input': { direction: 'ltr' } }}
                />
              </Grid>
            </Grid>
          </Box>
          
          {/* حلقة التلاوة */}
          <Box sx={{ mt: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              حلقة التلاوة
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="quran_session_beneficiaries"
                  name="quran_session_beneficiaries"
                  label="عدد المستفيدين"
                  type="number"
                  value={formik.values.quran_session_beneficiaries}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.quran_session_beneficiaries && Boolean(formik.errors.quran_session_beneficiaries)}
                  helperText={formik.touched.quran_session_beneficiaries && formik.errors.quran_session_beneficiaries}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="quran_session_time"
                  name="quran_session_time"
                  label="وقت التنفيذ (الساعة)"
                  type="time"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    step: 300, // 5 دقائق
                  }}
                  value={formik.values.quran_session_time}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.quran_session_time && Boolean(formik.errors.quran_session_time)}
                  helperText={formik.touched.quran_session_time && formik.errors.quran_session_time}
                />
              </Grid>
            </Grid>
          </Box>
          
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