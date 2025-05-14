import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Button,
  Typography,
  CircularProgress,
  Divider,
  Box,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert
} from '@mui/material';
import { format } from 'date-fns';
import axios from 'axios';

interface ReportDetailsProps {
  open: boolean;
  onClose: () => void;
  employeeId: number;
  employeeName: string;
  reportDate: string;
  reportId?: number;
}

interface ReportDetail {
  id: number;
  employee_id: number;
  activity_type_id: number;
  activity_name: string;
  beneficiaries_count: number;
  location: string | null;
  report_date: string;
  submitted_at: string;
  lesson1_beneficiaries: number;
  lesson1_time: string;
  lesson1_completed: boolean;
  lesson2_beneficiaries: number;
  lesson2_time: string;
  lesson2_completed: boolean;
  quran_session_beneficiaries: number;
  quran_session_time: string;
  quran_session_completed: boolean;
}

const ReportDetailsDialog: React.FC<ReportDetailsProps> = ({ 
  open, 
  onClose, 
  employeeId,
  employeeName,
  reportDate,
  reportId
}) => {
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && employeeId) {
      fetchReportDetails();
    }
  }, [open, employeeId, reportDate]);  const fetchReportDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build path - give priority to ID if available
      const url = reportId
        ? `https://elmanafea.online/api/reports/${reportId}`
        : `https://elmanafea.online/api/report-details/employee/${employeeId}/date/${reportDate}`;
      
      console.log(`جلب تفاصيل تقرير من: ${url}`);
      
      const response = await axios.get(url);
      console.log('استجابة الخادم:', response.data);
        if (response.data && response.data.report) {
        // نسخ البيانات للمعالجة
        const reportData = {...response.data.report};
        
        // تحويل البيانات الرقمية وتعيين قيم افتراضية إذا كانت غير موجودة
        reportData.lesson1_beneficiaries = Number(reportData.lesson1_beneficiaries || 0);
        reportData.lesson2_beneficiaries = Number(reportData.lesson2_beneficiaries || 0);
        reportData.quran_session_beneficiaries = Number(reportData.quran_session_beneficiaries || 0);
        reportData.beneficiaries_count = Number(reportData.beneficiaries_count || 0);
        
        // تحديد حالة تنفيذ الدروس بناءً على عدد المستفيدين فقط (الطريقة الجديدة)
        // هذا سيتجاهل أي حقل إكمال (completed) قد يكون موجودًا في البيانات
        reportData.lesson1_completed = reportData.lesson1_beneficiaries > 0;
        reportData.lesson2_completed = reportData.lesson2_beneficiaries > 0;
        reportData.quran_session_completed = reportData.quran_session_beneficiaries > 0;
        
        // ضمان أن بيانات التقرير تعكس عدد المستفيدين الفعلي في الحسابات
        // إذا كان عدد المستفيدين الإجمالي أقل من مجموع المستفيدين في الدروس الثلاثة
        const calculatedTotal = reportData.lesson1_beneficiaries + reportData.lesson2_beneficiaries + reportData.quran_session_beneficiaries;
        if (reportData.beneficiaries_count < calculatedTotal) {
          reportData.beneficiaries_count = calculatedTotal;
        }
        
        console.log('بيانات التقرير بعد المعالجة:', {
          total: reportData.beneficiaries_count,
          lesson1: {
            beneficiaries: reportData.lesson1_beneficiaries,
            completed: reportData.lesson1_completed
          },
          lesson2: {
            beneficiaries: reportData.lesson2_beneficiaries,
            completed: reportData.lesson2_completed
          },
          quranSession: {
            beneficiaries: reportData.quran_session_beneficiaries,
            completed: reportData.quran_session_completed
          }
        });
        
        setReport(reportData);
      } else {
        setError('لم يتم العثور على بيانات للتقرير');
      }
    } catch (error: any) {
      console.error('خطأ في استدعاء بيانات التقرير:', error);
      setError(error.response?.data?.message || 'حدث خطأ أثناء استدعاء بيانات التقرير');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        تفاصيل تقرير {employeeName} ليوم {format(new Date(reportDate), 'yyyy/MM/dd')}
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ my: 2 }}>
            {error}
          </Alert>
        ) : report ? (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              معلومات عامة:
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  <strong>الموظف:</strong> {employeeName}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  <strong>التاريخ:</strong> {format(new Date(report.report_date), 'yyyy/MM/dd')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  <strong>إجمالي المستفيدين:</strong> {report.beneficiaries_count}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  <strong>وقت التقديم:</strong> {new Date(report.submitted_at).toLocaleTimeString()}
                </Typography>
              </Grid>
              {report.location && (
                <Grid item xs={12}>
                  <Typography variant="body1">
                    <strong>النشاط:</strong> {report.location}
                  </Typography>
                </Grid>
              )}
            </Grid>
            
            <Typography variant="subtitle1" sx={{ mt: 4, mb: 1 }}>
              تفاصيل الدروس:
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>الدرس</TableCell>
                    <TableCell>عدد المستفيدين</TableCell>
                    <TableCell>وقت التنفيذ</TableCell>
                    <TableCell>حالة التنفيذ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>الدرس الأول</TableCell>
                    <TableCell>{report.lesson1_beneficiaries}</TableCell>
                    <TableCell>{report.lesson1_time}</TableCell>                    <TableCell>
                      {report.lesson1_completed ? (
                        <Typography
                          variant="body2"
                          color="success.main"
                          sx={{ 
                            fontWeight: "bold", 
                            display: 'flex', 
                            alignItems: 'center',
                            backgroundColor: '#e6f4ea',
                            padding: '4px 8px',
                            borderRadius: '4px'
                          }}
                        >
                          تم التنفيذ ✓
                        </Typography>
                      ) : (
                        <Typography
                          variant="body2"
                          color="error.main"
                          sx={{
                            padding: '4px 8px',
                            borderRadius: '4px'
                          }}
                        >
                          لم يتم التنفيذ ✗
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>الدرس الثاني</TableCell>
                    <TableCell>{report.lesson2_beneficiaries}</TableCell>
                    <TableCell>{report.lesson2_time}</TableCell>                    <TableCell>
                      {report.lesson2_completed ? (
                        <Typography
                          variant="body2"
                          color="success.main"
                          sx={{ 
                            fontWeight: "bold", 
                            display: 'flex', 
                            alignItems: 'center',
                            backgroundColor: '#e6f4ea',
                            padding: '4px 8px',
                            borderRadius: '4px'
                          }}
                        >
                          تم التنفيذ ✓
                        </Typography>
                      ) : (
                        <Typography
                          variant="body2"
                          color="error.main"
                          sx={{
                            padding: '4px 8px',
                            borderRadius: '4px'
                          }}
                        >
                          لم يتم التنفيذ ✗
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>حلقة التلاوة</TableCell>
                    <TableCell>{report.quran_session_beneficiaries}</TableCell>
                    <TableCell>{report.quran_session_time}</TableCell>                    <TableCell>
                      {report.quran_session_completed ? (
                        <Typography
                          variant="body2"
                          color="success.main"
                          sx={{ 
                            fontWeight: "bold", 
                            display: 'flex', 
                            alignItems: 'center',
                            backgroundColor: '#e6f4ea',
                            padding: '4px 8px',
                            borderRadius: '4px'
                          }}
                        >
                          تم التنفيذ ✓
                        </Typography>
                      ) : (
                        <Typography
                          variant="body2"
                          color="error.main"
                          sx={{
                            padding: '4px 8px',
                            borderRadius: '4px'
                          }}
                        >
                          لم يتم التنفيذ ✗
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ) : (
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', my: 3 }}>
            لا توجد بيانات متاحة لهذا التقرير
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          إغلاق
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportDetailsDialog;
