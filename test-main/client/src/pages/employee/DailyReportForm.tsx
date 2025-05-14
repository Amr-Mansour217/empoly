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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
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
  const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false); // حالة عرض مربع حوار التأكيد
  const [reportDetailsOpen, setReportDetailsOpen] = useState<boolean>(false); // حالة عرض تفاصيل التقرير
  const [submittedReport, setSubmittedReport] = useState<any>(null); // بيانات التقرير المقدم
  
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
    // الدرس الثاني
    lesson2_beneficiaries: '',
    lesson2_time: currentTime,
    // حلقة التلاوة
    quran_session_beneficiaries: '',
    quran_session_time: currentTime,
  });

  // تخزين معرف التقرير لاستخدامه عند التحديث
  const [reportId, setReportId] = useState<number | null>(null);
  
  // التحقق مما إذا كان الموظف قد أرسل تقريراً اليوم بالفعل
  useEffect(() => {
    const checkTodayReport = async () => {
      try {
        const response = await axios.get('https://elmanafea.online/api/reports/me/current');
        console.log('بيانات التقرير الحالي:', response.data);
        
        if (response.data.hasSubmitted) {
          setHasSubmittedToday(true);
          // تعبئة النموذج ببيانات تقرير اليوم إذا كانت موجودة
          if (response.data.report) {
            // حفظ معرف التقرير للتحديث لاحقًا
            if (response.data.report.id) {
              setReportId(response.data.report.id);
              console.log('تم العثور على معرف التقرير:', response.data.report.id);
            }
            
            // محاولة قراءة البيانات من التنسيق الجديد أولاً (activities) إذا كان متاحاً
            let lesson1Data = { beneficiaries: '', time: currentTime };
            let lesson2Data = { beneficiaries: '', time: currentTime };
            let quranSessionData = { beneficiaries: '', time: currentTime };
            
            // فحص إذا كانت البيانات متاحة في التنسيق القديم
            if (response.data.report.lesson1_beneficiaries !== undefined) {
              lesson1Data = {
                beneficiaries: response.data.report.lesson1_beneficiaries?.toString() || '',
                time: response.data.report.lesson1_time || currentTime
              };
              lesson2Data = {
                beneficiaries: response.data.report.lesson2_beneficiaries?.toString() || '',
                time: response.data.report.lesson2_time || currentTime
              };
              quranSessionData = {
                beneficiaries: response.data.report.quran_session_beneficiaries?.toString() || '',
                time: response.data.report.quran_session_time || currentTime
              };
            }
            
            // فحص إذا كانت البيانات متاحة في التنسيق الجديد (activities)
            if (response.data.report.activities && Array.isArray(response.data.report.activities)) {
              response.data.report.activities.forEach((activity: any) => {
                if (activity.name === "الدرس الأول") {
                  lesson1Data = {
                    beneficiaries: activity.beneficiaries_count?.toString() || '',
                    time: activity.execution_time || currentTime
                  };
                } else if (activity.name === "الدرس الثاني") {
                  lesson2Data = {
                    beneficiaries: activity.beneficiaries_count?.toString() || '',
                    time: activity.execution_time || currentTime
                  };
                } else if (activity.name === "حلقة التلاوة") {
                  quranSessionData = {
                    beneficiaries: activity.beneficiaries_count?.toString() || '',
                    time: activity.execution_time || currentTime
                  };
                }
              });
            }
            
            // تحديث قيم النموذج الأولية
            setInitialValues({
              lesson1_beneficiaries: lesson1Data.beneficiaries,
              lesson1_time: lesson1Data.time,
              lesson2_beneficiaries: lesson2Data.beneficiaries,
              lesson2_time: lesson2Data.time,
              quran_session_beneficiaries: quranSessionData.beneficiaries,
              quran_session_time: quranSessionData.time,
            });
            
            // جلب بيانات التقرير للعرض التفصيلي
            const reportDetails = {
              date: format(new Date(response.data.report.created_at || new Date()), 'yyyy/MM/dd'),
              id: response.data.report.id,
              activities: []
            };
            
            // إعداد بيانات الأنشطة للعرض التفصيلي
            if (response.data.report.activities && Array.isArray(response.data.report.activities)) {
              reportDetails.activities = response.data.report.activities;
            } else {
              reportDetails.activities = [
                {
                  name: "الدرس الأول",
                  beneficiaries_count: Number(lesson1Data.beneficiaries) || 0,
                  execution_time: lesson1Data.time
                },
                {
                  name: "الدرس الثاني",
                  beneficiaries_count: Number(lesson2Data.beneficiaries) || 0,
                  execution_time: lesson2Data.time
                },
                {
                  name: "حلقة التلاوة",
                  beneficiaries_count: Number(quranSessionData.beneficiaries) || 0,
                  execution_time: quranSessionData.time
                }
              ];
            }
            
            // حساب المجموع
            reportDetails.total_beneficiaries = reportDetails.activities.reduce(
              (sum, activity) => sum + (Number(activity.beneficiaries_count) || 0),
              0
            );
            
            // حفظ بيانات التقرير للعرض لاحقًا
            setSubmittedReport(reportDetails);
          }
        }
      } catch (error) {
        console.error('Error checking today\'s report:', error);
      }
    };

    checkTodayReport();
  }, [currentTime]); // إضافة currentTime كتبعية

  // إضافة دالة لتحديث الوقت بالساعة الحالية
  const updateCurrentTime = () => {
    const now = getCurrentTime();
    formik?.setFieldValue('lesson1_time', now);
    formik?.setFieldValue('lesson2_time', now);
    formik?.setFieldValue('quran_session_time', now);
  };
  
  // دالة للتحقق من صحة البيانات قبل فتح مربع حوار التأكيد
  const validateForm = (values: any): boolean => {
    if (!values.lesson1_beneficiaries || 
        !values.lesson2_beneficiaries || 
        !values.quran_session_beneficiaries ||
        !values.lesson1_time ||
        !values.lesson2_time || 
        !values.quran_session_time) {
      setError('يجب تعبئة جميع الحقول قبل إرسال التقرير');
      return false;
    }
    return true;
  };
  
  // دالة للحصول على بيانات التقرير الأخير
  const fetchLastReport = async () => {
    try {
      setLoading(true);
      const response = await axios.get('https://elmanafea.online/api/reports/me/current');
      
      if (response.data && response.data.report) {
        const report = response.data.report;
        
        // تحضير بيانات التقرير لعرضها
        const reportDetails = {
          date: format(new Date(report.created_at || new Date()), 'yyyy/MM/dd'),
          id: report.id,
          activities: []
        };
        
        // محاولة قراءة البيانات من التنسيق الجديد أولاً (activities)
        if (report.activities && Array.isArray(report.activities)) {
          reportDetails.activities = report.activities;
        } else {
          // الاعتماد على البيانات من التنسيق القديم
          reportDetails.activities = [
            {
              name: "الدرس الأول",
              beneficiaries_count: report.lesson1_beneficiaries || 0,
              execution_time: report.lesson1_time || "00:00"
            },
            {
              name: "الدرس الثاني",
              beneficiaries_count: report.lesson2_beneficiaries || 0,
              execution_time: report.lesson2_time || "00:00"
            },
            {
              name: "حلقة التلاوة",
              beneficiaries_count: report.quran_session_beneficiaries || 0,
              execution_time: report.quran_session_time || "00:00"
            }
          ];
        }
        
        // حساب المجموع
        reportDetails.total_beneficiaries = reportDetails.activities.reduce(
          (sum, activity) => sum + (activity.beneficiaries_count || 0),
          0
        );
        
        setSubmittedReport(reportDetails);
        return reportDetails;
      }
      
      return null;
    } catch (error) {
      console.error("خطأ في جلب التقرير:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // دالة تُنفذ عملية الإرسال الفعلية بعد التأكيد
  const submitReport = async (values: any) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('إرسال البيانات:', values);
      
      // معالجة القيم الرقمية للتأكد من أنها أرقام صحيحة
      const getValidNumber = (value: string): number => {
        if (!value || value === '') return 0;
        const num = Number(value);
        return isNaN(num) ? 0 : Math.floor(num);
      };
      
      // تنسيق البيانات قبل الإرسال - نتأكد من استخدام أرقام صحيحة
      const lesson1Count = getValidNumber(values.lesson1_beneficiaries);
      const lesson2Count = getValidNumber(values.lesson2_beneficiaries);
      const quranSessionCount = getValidNumber(values.quran_session_beneficiaries);
      
      // حساب المجموع الإجمالي للمستفيدين
      const totalBeneficiaries = lesson1Count + lesson2Count + quranSessionCount;
      
      console.log('إجمالي عدد المستفيدين:', totalBeneficiaries);
      
      // تحضير البيانات للإرسال بصيغة أبسط
      const reportData = {
        activity_type_id: 1,
        // إرسال إجمالي المستفيدين كعدد منفصل
        beneficiaries_count: totalBeneficiaries,
        // تعيين location لقيمة غير فارغة ليعرفها النظام كتقرير مكتمل
        location: "الدرس الأول، الدرس الثاني، حلقة التلاوة",
        // إرسال بيانات كل نشاط في مصفوفة منفصلة
        activities: [
          {
            name: "الدرس الأول",
            beneficiaries_count: lesson1Count,
            execution_time: values.lesson1_time || ""
          },
          {
            name: "الدرس الثاني",
            beneficiaries_count: lesson2Count,
            execution_time: values.lesson2_time || ""
          },
          {
            name: "حلقة التلاوة",
            beneficiaries_count: quranSessionCount,
            execution_time: values.quran_session_time || ""
          }
        ],
        // إرسال عدد المستفيدين لكل نشاط بشكل منفرد (كحقول منفصلة)
        lesson1_beneficiaries: lesson1Count,
        lesson1_time: values.lesson1_time || "",
        lesson2_beneficiaries: lesson2Count,
        lesson2_time: values.lesson2_time || "",
        quran_session_beneficiaries: quranSessionCount,
        quran_session_time: values.quran_session_time || "",
        
        // الحقول المنفصلة المطلوبة - هذه هي الحقول التي سيتم استخدامها على جانب الخادم
        individual_activities: {
          first_lesson: {
            beneficiaries: lesson1Count,
            time: values.lesson1_time || ""
          },
          second_lesson: {
            beneficiaries: lesson2Count,
            time: values.lesson2_time || ""
          },
          quran_session: {
            beneficiaries: quranSessionCount,
            time: values.quran_session_time || ""
          },
          total_beneficiaries: totalBeneficiaries
        },
        
        // إضافة حقول منفصلة للتأكيد على إرسال البيانات بشكل منفرد
        first_lesson_count: lesson1Count,
        second_lesson_count: lesson2Count,
        quran_session_count: quranSessionCount,
        total_beneficiaries_count: totalBeneficiaries
      };
      
      if (hasSubmittedToday && reportId) {
        // إذا كان تحديثًا، نضيف معرف التقرير للبيانات المرسلة
        reportData['id'] = reportId;
      }
      
      console.log('البيانات المرسلة للخادم:', reportData);
      
      // إرسال البيانات للخادم
      const response = await axios.post('https://elmanafea.online/api/reports', reportData);
      
      console.log('استجابة الخادم:', response.data);
      
      // التحقق من نجاح العملية
      if (response.data.success || response.status === 200 || response.status === 201) {
        setSuccess(true);
        
        // حفظ بيانات التقرير المرسل لعرضه لاحقًا
        const reportDetails = {
          date: format(new Date(), 'yyyy/MM/dd'),
          id: response.data.report?.id || reportId,
          activities: [
            {
              name: "الدرس الأول",
              beneficiaries_count: lesson1Count,
              execution_time: values.lesson1_time
            },
            {
              name: "الدرس الثاني",
              beneficiaries_count: lesson2Count,
              execution_time: values.lesson2_time
            },
            {
              name: "حلقة التلاوة",
              beneficiaries_count: quranSessionCount,
              execution_time: values.quran_session_time
            }
          ],
          total_beneficiaries: totalBeneficiaries
        };
        
        setSubmittedReport(reportDetails);
      } else {
        throw new Error(response.data.message || 'حدث خطأ غير معروف أثناء محاولة حفظ التقرير');
      }
      
      // لن ننتقل للصفحة الرئيسية تلقائيًا حتى يتمكن المستخدم من عرض التقرير
      /* setTimeout(() => {
        navigate('/employee');
      }, 2000); */
    } catch (error: any) {
      console.error('Error submitting report:', error);
      // تحسين عرض رسائل الخطأ
      let errorMessage = 'حدث خطأ أثناء إرسال التقرير';
      
      if (error.response) {
        // الخطأ من الخادم
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data && typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.status === 400) {
          errorMessage = 'البيانات المدخلة غير صحيحة';
        } else if (error.response.status === 401) {
          errorMessage = 'غير مصرح لك بإرسال التقرير';
        } else if (error.response.status === 500) {
          errorMessage = 'حدث خطأ في الخادم';
        }
      } else if (error.message) {
        // خطأ محلي
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
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
    onSubmit: (values) => {
      // التحقق من صحة البيانات قبل فتح مربع التأكيد
      if (validateForm(values)) {
        // فتح مربع حوار التأكيد
        setConfirmDialogOpen(true);
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
        {/* عرض رسائل الحالة */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert 
            severity="success" 
            sx={{ mb: 3 }}
            onClose={() => setSuccess(false)}
          >
            تم {hasSubmittedToday ? 'تحديث' : 'إرسال'} التقرير بنجاح
          </Alert>
        )}
        
        {hasSubmittedToday && !success && (
          <Alert 
            severity="info" 
            sx={{ mb: 3 }}
            onClose={() => {}}
            action={
              <Button 
                color="inherit" 
                size="small"
                onClick={() => {
                  // إذا كان لدينا بيانات للتقرير بالفعل نعرضها، وإلا نحتاج إلى جلبها أولاً
                  if (submittedReport) {
                    setReportDetailsOpen(true);
                  } else {
                    // إنشاء كائن التقرير من البيانات الحالية
                    const reportDetails = {
                      date: format(new Date(), 'yyyy/MM/dd'),
                      id: reportId,
                      activities: [
                        {
                          name: "الدرس الأول",
                          beneficiaries_count: Number(formik.values.lesson1_beneficiaries) || 0,
                          execution_time: formik.values.lesson1_time
                        },
                        {
                          name: "الدرس الثاني",
                          beneficiaries_count: Number(formik.values.lesson2_beneficiaries) || 0,
                          execution_time: formik.values.lesson2_time
                        },
                        {
                          name: "حلقة التلاوة",
                          beneficiaries_count: Number(formik.values.quran_session_beneficiaries) || 0,
                          execution_time: formik.values.quran_session_time
                        }
                      ],
                      total_beneficiaries: (
                        (Number(formik.values.lesson1_beneficiaries) || 0) +
                        (Number(formik.values.lesson2_beneficiaries) || 0) +
                        (Number(formik.values.quran_session_beneficiaries) || 0)
                      )
                    };
                    setSubmittedReport(reportDetails);
                    setReportDetailsOpen(true);
                  }
                }}
              >
                عرض التقرير
              </Button>
            }
          >
            لقد قمت بإرسال تقرير اليوم بالفعل. يمكنك تعديل التقرير.
          </Alert>
        )}
        
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <CircularProgress size={30} />
            <Typography variant="body2" sx={{ ml: 2 }}>
              جاري {hasSubmittedToday ? 'تحديث' : 'إرسال'} التقرير...
            </Typography>
          </Box>
        )}
        
        <form onSubmit={formik.handleSubmit}>
          {/* الدرس الأول */}
          <Box sx={{ mt: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              الدرس الأول
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
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
          
          {/* ملخص إجمالي عدد المستفيدين */}
          <Box sx={{ mt: 4, mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              ملخص التقرير
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2">
                  عدد مستفيدي الدرس الأول: {formik.values.lesson1_beneficiaries ? Number(formik.values.lesson1_beneficiaries) : 0}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2">
                  عدد مستفيدي الدرس الثاني: {formik.values.lesson2_beneficiaries ? Number(formik.values.lesson2_beneficiaries) : 0}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2">
                  عدد مستفيدي حلقة التلاوة: {formik.values.quran_session_beneficiaries ? Number(formik.values.quran_session_beneficiaries) : 0}
                </Typography>
              </Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
              إجمالي عدد المستفيدين: {
                (formik.values.lesson1_beneficiaries ? Number(formik.values.lesson1_beneficiaries) : 0) +
                (formik.values.lesson2_beneficiaries ? Number(formik.values.lesson2_beneficiaries) : 0) +
                (formik.values.quran_session_beneficiaries ? Number(formik.values.quran_session_beneficiaries) : 0)
              }
            </Typography>
          </Box>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* زر لتحديث جميع أوقات التنفيذ دفعة واحدة */}
            <Button 
              type="button"
              variant="outlined"
              color="secondary"
              onClick={updateCurrentTime}
              disabled={loading}
              startIcon={<span role="img" aria-label="clock">⏱️</span>}
            >
              تحديث جميع الأوقات للوقت الحالي
            </Button>
            
            <Box sx={{ display: 'flex' }}>
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
                color="primary"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : hasSubmittedToday ? 'تحديث التقرير' : 'إرسال التقرير'}
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>
      
      {/* Success Dialog */}
      <Dialog
        open={success}
        aria-labelledby="success-dialog-title"
        aria-describedby="success-dialog-description"
      >
        <DialogTitle id="success-dialog-title" sx={{ bgcolor: '#4caf50', color: 'white', fontWeight: 'bold' }}>
          تم تقديم التقرير
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              تم {hasSubmittedToday ? 'تحديث' : 'إرسال'} التقرير بنجاح
            </Typography>
            <Typography variant="body2" color="text.secondary">
              يمكنك الآن عرض تقرير {format(new Date(), 'yyyy/MM/dd')} بالتفصيل
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              onClick={() => {
                setSuccess(false);
                setReportDetailsOpen(true);
              }}
              sx={{ 
                py: 1.5, 
                fontWeight: 'bold',
                fontSize: '1.1rem',
                boxShadow: 3
              }}
              startIcon={<span role="img" aria-label="report">📋</span>}
            >
              عرض تقرير الموظف بالتفصيل
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setSuccess(false);
              navigate('/employee');
            }}
            color="primary"
          >
            العودة للصفحة الرئيسية
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title">
          تأكيد {hasSubmittedToday ? 'تحديث' : 'إرسال'} التقرير
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-dialog-description">
            هل أنت متأكد من {hasSubmittedToday ? 'تحديث' : 'إرسال'} التقرير بالبيانات التالية؟
          </DialogContentText>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              الدرس الأول:
            </Typography>
            <Typography variant="body2" gutterBottom>
              عدد المستفيدين: {formik?.values.lesson1_beneficiaries || '0'}
            </Typography>
            <Typography variant="body2" gutterBottom>
              وقت التنفيذ: {formik?.values.lesson1_time || '00:00'}
            </Typography>
            
            <Typography variant="subtitle2" sx={{ mt: 1 }} gutterBottom>
              الدرس الثاني:
            </Typography>
            <Typography variant="body2" gutterBottom>
              عدد المستفيدين: {formik?.values.lesson2_beneficiaries || '0'}
            </Typography>
            <Typography variant="body2" gutterBottom>
              وقت التنفيذ: {formik?.values.lesson2_time || '00:00'}
            </Typography>
            
            <Typography variant="subtitle2" sx={{ mt: 1 }} gutterBottom>
              حلقة التلاوة:
            </Typography>
            <Typography variant="body2" gutterBottom>
              عدد المستفيدين: {formik?.values.quran_session_beneficiaries || '0'}
            </Typography>
            <Typography variant="body2" gutterBottom>
              وقت التنفيذ: {formik?.values.quran_session_time || '00:00'}
            </Typography>
            
            <Typography variant="subtitle1" sx={{ mt: 2 }} color="primary" fontWeight="bold">
              إجمالي عدد المستفيدين: {
                (formik?.values.lesson1_beneficiaries ? Number(formik.values.lesson1_beneficiaries) : 0) +
                (formik?.values.lesson2_beneficiaries ? Number(formik.values.lesson2_beneficiaries) : 0) +
                (formik?.values.quran_session_beneficiaries ? Number(formik.values.quran_session_beneficiaries) : 0)
              }
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} color="primary">
            إلغاء
          </Button>
          <Button 
            onClick={() => {
              setConfirmDialogOpen(false);
              submitReport(formik.values);
            }} 
            color="primary" 
            variant="contained"
          >
            {hasSubmittedToday ? 'تحديث التقرير' : 'إرسال التقرير'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Report Details Dialog */}
      <Dialog
        open={reportDetailsOpen}
        onClose={() => setReportDetailsOpen(false)}
        aria-labelledby="report-details-dialog-title"
        aria-describedby="report-details-dialog-description"
        maxWidth="md"
        fullWidth
      >
        <DialogTitle id="report-details-dialog-title" 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            bgcolor: '#1976d2',
            color: 'white',
            py: 2
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight="bold">تقرير الموظف لتاريخ {submittedReport?.date || format(new Date(), 'yyyy/MM/dd')}</Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              عرض تفصيلي لكل نشاط وعدد المستفيدين
            </Typography>
          </Box>
          <Typography variant="subtitle2" sx={{ bgcolor: 'rgba(255,255,255,0.2)', px: 2, py: 0.5, borderRadius: 1 }}>
            رقم التقرير: {submittedReport?.id || '-'}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>            {/* عرض أعداد المستفيدين بشكل منفصل */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" color="primary" gutterBottom sx={{ borderBottom: '2px solid #1976d2', pb: 1, display: 'inline-block' }}>
              عدد المستفيدين لكل نشاط بشكل منفصل
            </Typography>
            
            <Grid container spacing={2} sx={{ mt: 2 }}>
              {submittedReport?.activities?.map((activity: any, index: number) => {
                // تحديد لون لكل نشاط
                const colors = ['#4caf50', '#ff9800', '#9c27b0'];
                const color = colors[index % colors.length];
                
                return (
                  <Grid item xs={12} md={4} key={index}>
                    <Paper 
                      elevation={2}
                      sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        border: `1px solid ${color}`,
                        position: 'relative',
                        overflow: 'hidden',
                        textAlign: 'center',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Box 
                        sx={{ 
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '4px',
                          height: '100%',
                          bgcolor: color
                        }}
                      />
                      
                      <Box>
                        <Typography variant="subtitle1" gutterBottom fontWeight="bold" sx={{ color, mb: 2 }}>
                          {activity.name}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          عدد المستفيدين
                        </Typography>
                        
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'center', 
                          alignItems: 'center', 
                          my: 2,
                          p: 2,
                          borderRadius: 2,
                          bgcolor: `${color}22`
                        }}>
                          <Typography variant="h3" fontWeight="bold" sx={{ color }}>
                            {activity.beneficiaries_count || 0}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed #e0e0e0' }}>
                        <Typography variant="body2" color="text.secondary">
                          وقت التنفيذ
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {activity.execution_time || '00:00'}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
            
            {/* عرض العدد الإجمالي بشكل منفصل وواضح */}
            <Paper 
              elevation={3}
              sx={{ 
                p: 3, 
                mt: 3, 
                borderRadius: 2, 
                background: 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)', 
                color: 'white',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box sx={{ 
                position: 'absolute', 
                top: 0, 
                right: 0, 
                width: '100px', 
                height: '100px', 
                borderRadius: '50%', 
                bgcolor: 'rgba(255,255,255,0.1)',
                transform: 'translate(30%, -30%)'
              }} />
              <Box sx={{ 
                position: 'absolute', 
                bottom: 0, 
                left: 0, 
                width: '70px', 
                height: '70px', 
                borderRadius: '50%', 
                bgcolor: 'rgba(255,255,255,0.1)',
                transform: 'translate(-30%, 30%)'
              }} />
              
              <Typography variant="h6" gutterBottom>
                إجمالي عدد المستفيدين
                <Box component="span" sx={{ display: 'block', fontSize: '0.8rem', opacity: 0.9, mt: 0.5 }}>
                  مجموع المستفيدين في جميع الأنشطة
                </Box>
              </Typography>
              
              <Box sx={{ 
                my: 2,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.2)',
                width: '150px',
                height: '150px'
              }}>
                <Typography variant="h2" fontWeight="bold" sx={{ 
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  position: 'relative',
                  zIndex: 2
                }}>
                  {submittedReport?.total_beneficiaries || 0}
                </Typography>
              </Box>
              
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
                {submittedReport?.activities?.map((activity: any, index: number) => (
                  <Box key={index} sx={{ 
                    mx: 1, 
                    py: 0.5, 
                    px: 1.5, 
                    bgcolor: 'rgba(255,255,255,0.25)', 
                    borderRadius: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    mb: 1
                  }}>
                    <Typography variant="body2" component="span">
                      {activity.name}: {activity.beneficiaries_count}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Box>
          
          {/* معلومات التقرير الأساسية */}
          <Box sx={{ mt: 4, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ borderBottom: '2px solid #1976d2', pb: 1, display: 'inline-block' }}>
              معلومات التقرير
            </Typography>
            <Paper sx={{ p: 3, mt: 2, borderRadius: 2, bgcolor: '#f8f8f8' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body1" gutterBottom>
                    <strong>رقم التقرير:</strong> {submittedReport?.id || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body1" gutterBottom>
                    <strong>التاريخ:</strong> {submittedReport?.date || format(new Date(), 'yyyy/MM/dd')}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Box>
          
          {/* جدول مفصل للأنشطة */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ borderBottom: '2px solid #1976d2', pb: 1, display: 'inline-block' }}>
              تفاصيل الأنشطة
            </Typography>
            <TableContainer component={Paper} sx={{ mt: 2, border: '1px solid #e0e0e0' }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>النشاط</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>عدد المستفيدين</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>وقت التنفيذ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {submittedReport?.activities?.map((activity: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{activity.name}</TableCell>
                      <TableCell>
                        <Typography fontWeight="bold">
                          {activity.beneficiaries_count || 0}
                        </Typography>
                      </TableCell>
                      <TableCell>{activity.execution_time || '00:00'}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>الإجمالي</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      <Typography color="primary" fontWeight="bold">
                        {submittedReport?.total_beneficiaries || 0}
                      </Typography>
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => navigate('/employee')} 
            color="primary"
          >
            العودة للصفحة الرئيسية
          </Button>
          <Button 
            onClick={() => setReportDetailsOpen(false)} 
            variant="contained" 
            color="primary"
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default DailyReportForm;