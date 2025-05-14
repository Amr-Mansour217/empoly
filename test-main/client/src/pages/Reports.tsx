import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle
} from '@mui/material';
import { format, subDays } from 'date-fns';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import SearchIcon from '@mui/icons-material/Search';
import PrintIcon from '@mui/icons-material/Print';

interface Report {
  id: number;
  employee_id: number;
  full_name: string;
  activity_type_id: number;
  activity_name: string;
  beneficiaries_count: number;
  location: string | null;
  report_date: string;
  submitted_at: string;
  has_submitted: number; // 1 for submitted, 0 for not submitted
  
  // حقول إضافية للتفاصيل
  lesson1_beneficiaries?: number;
  lesson1_time?: string;
  lesson2_beneficiaries?: number;
  lesson2_time?: string;
  quran_session_beneficiaries?: number;
  quran_session_time?: string;
  activities?: Array<{
    name: string;
    beneficiaries_count: number;
    execution_time: string;
  }>;
}

interface Supervisor {
  id: number;
  full_name: string;
  role: string;
}

const Reports: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [reportDetailsOpen, setReportDetailsOpen] = useState<boolean>(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  
  // Filter states
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = subDays(new Date(), 7).toISOString().split('T')[0];
  
  const [filters, setFilters] = useState({
    startDate: weekAgo,
    endDate: today,
    selectedEmployee: 'all', // بدلا من activityType
  });

  // تحميل البيانات المناسبة عند تحميل الصفحة أو تغيير المستخدم
  useEffect(() => {
    if (user?.role === 'admin') {
      // محاولة جلب المشرفين مع محاولات متكررة في حالة الفشل
      let retryCount = 0;
      const maxRetries = 3;
      
      const attemptFetchSupervisors = async () => {
        try {
          await fetchSupervisors();
        } catch (err) {
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying to fetch supervisors (${retryCount}/${maxRetries})...`);
            setTimeout(attemptFetchSupervisors, 2000); // محاولة كل 2 ثانية
          }
        }
      };
      
      attemptFetchSupervisors();
    } else {
      fetchReports();
    }
  }, [user]);
  
  // إعادة تحميل التقارير عند اختيار مشرف
  useEffect(() => {
    if (selectedSupervisor) {
      fetchReports();
    }
  }, [selectedSupervisor]);

  // دالة مساعدة لتحليل الاستجابات وتسجيل المعلومات التشخيصية
  const logResponseInfo = (response: any, source: string) => {
    try {
      const info = {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      };
      
      console.log(`${source} response info:`, info);
      setDebugInfo(JSON.stringify(info, null, 2));
      return info;
    } catch (err) {
      console.error('Error logging response:', err);
      return null;
    }
  };

  // استدعاء قائمة المشرفين
  const fetchSupervisors = async () => {
    try {
      setLoading(true);
      setError(null);
      setDebugInfo(null);
      
      console.log('Fetching users to extract supervisors...');
      
      // استخدام قائمة المستخدمين للحصول على المشرفين بدلًا من API المخصص
      try {
        const response = await axios.get('https://elmanafea.online/api/users', {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          timeout: 10000
        });
        
        logResponseInfo(response, 'Users API for supervisors');
        
        if (response.data && Array.isArray(response.data.users)) {
          // استخراج المشرفين من قائمة المستخدمين
          const supervisorsList = response.data.users.filter(
            (user: any) => user.role === 'supervisor' || user.role === 'admin'
          );
          setSupervisors(supervisorsList);
          
          if (supervisorsList.length === 0) {
            console.warn('No supervisors returned from specific API');
          }
          return; // نجحت العملية، نخرج من الدالة هنا
        }
      } catch (specificError: any) {
        console.warn('Error using specific supervisors API, falling back to all users:', specificError);
        // نواصل إلى الطريقة البديلة
      }
      
      // طريقة بديلة: استدعاء جميع المستخدمين ثم تصفية المشرفين والمدراء
      const response = await axios.get('https://elmanafea.online/api/users', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        timeout: 10000
      });
      
      const responseInfo = logResponseInfo(response, 'Users API');
      
      if (response.data && Array.isArray(response.data.users)) {
        // تصفية المستخدمين للحصول على المشرفين والمدراء
        const filteredSupervisors = response.data.users.filter(
          (user: any) => user.role === 'supervisor' || user.role === 'admin'
        );
        
        setSupervisors(filteredSupervisors);
        
        if (filteredSupervisors.length === 0) {
          console.warn('No supervisors found among users');
          setError('لا يوجد مشرفين متاحين في النظام');
        }
      } else {
        console.error('Users data is not an array:', response.data);
        setSupervisors([]);
        setError('تنسيق البيانات غير صحيح');
      }
    } catch (error: any) {
      console.error('Error fetching supervisors:', error);
      setSupervisors([]);
      
      if (error.response) {
        const errorInfo = logResponseInfo(error.response, 'Error Response');
        setError(`حدث خطأ أثناء جلب قائمة المشرفين (${error.response.status}): ${error.response.data?.message || error.message}`);
      } else if (error.request) {
        setError('تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى');
        setDebugInfo(`No response received: ${JSON.stringify(error.request)}`);
      } else {
        setError(`حدث خطأ: ${error.message}`);
        setDebugInfo(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      // If admin and supervisor selected, add supervisor ID
      if (user?.role === 'admin' && selectedSupervisor) {
        params.append('supervisorId', selectedSupervisor.toString());
      }
      
      console.log(`Fetching reports with params: ${params.toString()}`);
      const response = await axios.get(`https://elmanafea.online/api/reports?${params.toString()}`);
      console.log('Reports response:', response.data);
      
      if (response.data && Array.isArray(response.data.reports)) {
        setReports(response.data.reports);
      } else {
        console.error('Reports data structure is unexpected:', response.data);
        setReports([]);
        setError('تنسيق بيانات التقارير غير صحيح');
      }
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      setError(error.response?.data?.message || 'حدث خطأ أثناء جلب التقارير');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name?: string; value: unknown } }) => {
    const { name, value } = event.target;
    if (name) {
      setFilters({
        ...filters,
        [name]: value as string,
      });
    }
  };

  const handleSupervisorChange = (event: React.ChangeEvent<HTMLInputElement> | { target: { value: unknown } }) => {
    setSelectedSupervisor(event.target.value as number);
  };

  const handleSearch = () => {
    fetchReports();
  };
  
  // دالة لجلب تفاصيل التقرير عند النقر على "تم تقديم التقرير"
  const fetchReportDetails = async (report: Report) => {
    try {
      setLoading(true);
      
      // استعلام عن تفاصيل التقرير بواسطة معرف الموظف وتاريخ التقرير
      const response = await axios.get(`https://elmanafea.online/api/reports/employee/${report.employee_id}/details`, {
        params: {
          // report_date: report.report_date
        }
      });
      
      console.log('استجابة تفاصيل التقرير:', response.data);
      
      if (response.data && response.data.report) {
        // تحديث بيانات التقرير المحدد
        setSelectedReport(prevReport => ({
          ...prevReport,
          ...response.data.report
        }));
      }
    } catch (error) {
      console.error('Error fetching report details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && reports.length === 0 && (user?.role !== 'admin' || supervisors.length === 0)) {
    return (
      <Layout title="التقارير">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  // Filter reports by selected employee if one is selected
  const filteredReports = filters.selectedEmployee === 'all' 
    ? reports 
    : reports.filter(report => report.employee_id.toString() === filters.selectedEmployee);

  return (
    <Layout title="التقارير">
      <Typography variant="h4" component="h1" gutterBottom>
        التقارير
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Admin Supervisor Selection */}
      {user?.role === 'admin' && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              اختر المشرف
            </Typography>
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => fetchSupervisors()}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : undefined}
            >
              تحديث القائمة
            </Button>
          </Box>
          
          {loading && supervisors.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <FormControl fullWidth>
              <InputLabel id="supervisor-select-label">المشرف</InputLabel>
              <Select
                labelId="supervisor-select-label"
                id="supervisor-select"
                value={selectedSupervisor || ''}
                onChange={handleSupervisorChange}
                label="المشرف"
                disabled={supervisors.length === 0}
              >
                {supervisors.length > 0 ? (
                  supervisors.map((supervisor) => (
                    <MenuItem key={supervisor.id} value={supervisor.id}>
                      {supervisor.full_name} {supervisor.role === 'admin' ? '(مدير)' : '(مشرف)'}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled value="">لا يوجد مشرفين</MenuItem>
                )}
              </Select>
            </FormControl>
          )}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Button 
                  size="small" 
                  variant="outlined" 
                  onClick={() => fetchSupervisors()} 
                  sx={{ ml: 1 }}
                >
                  إعادة المحاولة
                </Button>
              </Box>
              
              {/* معلومات تشخيص للمسؤولين */}
              {debugInfo && (
                <Box sx={{ mt: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1, maxHeight: '150px', overflow: 'auto' }}>
                  <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                    {debugInfo}
                  </Typography>
                </Box>
              )}
            </Alert>
          )}
        </Paper>
      )}

      {/* Show reports only if supervisor is selected for admin or always for supervisor */}
      {(user?.role !== 'admin' || (user?.role === 'admin' && selectedSupervisor)) && (
        <>
          {/* Filters */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              id="startDate"
              name="startDate"
              label="من تاريخ"
              type="date"
              value={filters.startDate}
              onChange={handleFilterChange}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              id="endDate"
              name="endDate"
              label="إلى تاريخ"
              type="date"
              value={filters.endDate}
              onChange={handleFilterChange}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel id="employee-select-label">الموظف</InputLabel>
              <Select
                labelId="employee-select-label"
                id="selectedEmployee"
                name="selectedEmployee"
                value={filters.selectedEmployee}
                onChange={handleFilterChange}
                label="الموظف"
              >
                <MenuItem value="all">جميع الموظفين</MenuItem>
                {Array.from(
                  new Map(reports.map(report => [report.employee_id, report.full_name])).entries()
                ).map(([id, name]) => (
                  <MenuItem key={id} value={id.toString()}>
                    {name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSearch}
              startIcon={<SearchIcon />}
            >
              بحث
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Reports Table */}
      <Paper sx={{ p: 2 }}>
        {user?.role === 'admin' && selectedSupervisor && supervisors.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              تقارير موظفي: {supervisors.find(sup => sup.id === selectedSupervisor)?.full_name}
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Box>
        )}
        <TableContainer>
          {filteredReports.length > 0 ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>التاريخ</TableCell>
                  <TableCell>الموظف</TableCell>
                  <TableCell>عدد المستفيدين</TableCell>
                  <TableCell>النشاط</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={`${report.employee_id}-${report.report_date}`}>
                    <TableCell>{format(new Date(report.report_date), 'yyyy/MM/dd')}</TableCell>
                    <TableCell>{report.full_name}</TableCell>
                    <TableCell>{report.has_submitted ? report.beneficiaries_count : '-'}</TableCell>
                    <TableCell>
                      {report.has_submitted ? (
                        <Chip 
                          label="تم تقديم التقرير" 
                          size="small" 
                          color="success" 
                          variant="outlined"
                          sx={{ fontWeight: 'bold', cursor: 'pointer' }}
                          onClick={() => {
                            setSelectedReport(report);
                            setReportDetailsOpen(true);
                            // جلب تفاصيل التقرير
                            fetchReportDetails(report);
                          }}
                        />
                      ) : (
                        <Chip 
                          label="لم يتم تقديم تقرير" 
                          size="small" 
                          color="error" 
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Box sx={{ py: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                لا توجد تقارير مطابقة لمعايير البحث
              </Typography>
            </Box>
          )}
        </TableContainer>
        
        {/* Summary */}
        {filteredReports.length > 0 && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <Typography variant="subtitle2">إجمالي الموظفين:</Typography>
                <Typography variant="h6">{filteredReports.length}</Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="subtitle2">قدموا تقارير:</Typography>
                <Typography variant="h6" color="success.main">
                  {filteredReports.filter(report => report.has_submitted).length}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="subtitle2">لم يقدموا تقارير:</Typography>
                <Typography variant="h6" color="error.main">
                  {filteredReports.filter(report => !report.has_submitted).length}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="subtitle2">إجمالي المستفيدين:</Typography>
                <Typography variant="h6">
                  {filteredReports.reduce((sum, report) => sum + (report.has_submitted ? report.beneficiaries_count || 0 : 0), 0)}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
      </>
      )}

      {user?.role === 'admin' && !selectedSupervisor && (
        <Box sx={{ py: 5, textAlign: 'center' }}>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            الرجاء اختيار مشرف لعرض التقارير
          </Typography>
          <Typography variant="body1" color="text.secondary">
            يمكنك عرض تقارير الموظفين التابعين لكل مشرف عن طريق اختيار المشرف أولاً
          </Typography>
        </Box>
      )}

      {/* مربع حوار تفاصيل التقرير */}
      <Dialog
        open={reportDetailsOpen}
        onClose={() => {
          setReportDetailsOpen(false);
          // مسح بيانات التقرير المحدد عند الإغلاق بعد فترة قصيرة
          setTimeout(() => setSelectedReport(null), 300);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#1976d2', color: 'white', py: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              تفاصيل التقرير - {selectedReport?.report_date ? format(new Date(selectedReport.report_date), 'yyyy/MM/dd') : ''}
            </Typography>
            <Typography variant="subtitle2">
              الموظف: {selectedReport?.full_name || ''}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* رسالة تأكيد بوضوح أن التقرير تم تقديمه */}
              <Box sx={{ 
                mb: 3, 
                p: 2, 
                bgcolor: '#e8f5e9', 
                borderRadius: 2, 
                display: 'flex', 
                alignItems: 'center',
                border: '1px solid #4caf50'
              }}>
                <Box 
                  sx={{ 
                    bgcolor: '#4caf50', 
                    color: 'white', 
                    borderRadius: '50%',
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2
                  }}
                >
                  <span role="img" aria-label="success" style={{ fontSize: '1.5rem' }}>✓</span>
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" color="#2e7d32">
                    تم تقديم التقرير بنجاح
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    تم تسجيل التقرير في النظام بتاريخ {selectedReport?.report_date ? format(new Date(selectedReport.report_date), 'yyyy/MM/dd') : ''}
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="h6" gutterBottom sx={{ borderBottom: '2px solid #1976d2', pb: 1, display: 'inline-block' }}>
                تفاصيل الأنشطة
              </Typography>
              
              <Paper elevation={3} sx={{ mb: 3, p: 2 }}>
                <Grid container spacing={2}>
                  {/* عرض الدرس الأول */}
                  <Grid item xs={12} md={4}>
                    <Paper 
                      elevation={2}
                      sx={{ 
                        p: 2, 
                        textAlign: 'center',
                        border: '1px solid #4caf50',
                        borderRadius: 2,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight="bold" color="#4caf50" mb={2}>
                        الدرس الأول
                      </Typography>
                      <Box sx={{ 
                        my: 2, 
                        p: 2, 
                        bgcolor: '#e8f5e9',
                        borderRadius: 2,
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                      }}>
                        <Typography variant="h4" fontWeight="bold" color="#2e7d32">
                          {selectedReport?.lesson1_beneficiaries || 
                           (selectedReport?.activities?.find(a => a.name === "الدرس الأول")?.beneficiaries_count) || 
                           '0'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={1}>
                          عدد المستفيدين
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed #e0e0e0' }}>
                        <Typography variant="body2" color="text.secondary">
                          وقت التنفيذ
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedReport?.lesson1_time || 
                           (selectedReport?.activities?.find(a => a.name === "الدرس الأول")?.execution_time) || 
                           '00:00'}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                  
                  {/* عرض الدرس الثاني */}
                  <Grid item xs={12} md={4}>
                    <Paper 
                      elevation={2}
                      sx={{ 
                        p: 2, 
                        textAlign: 'center',
                        border: '1px solid #ff9800',
                        borderRadius: 2,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight="bold" color="#ff9800" mb={2}>
                        الدرس الثاني
                      </Typography>
                      <Box sx={{ 
                        my: 2, 
                        p: 2, 
                        bgcolor: '#fff3e0',
                        borderRadius: 2,
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                      }}>
                        <Typography variant="h4" fontWeight="bold" color="#e65100">
                          {selectedReport?.lesson2_beneficiaries || 
                           (selectedReport?.activities?.find(a => a.name === "الدرس الثاني")?.beneficiaries_count) || 
                           '0'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={1}>
                          عدد المستفيدين
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed #e0e0e0' }}>
                        <Typography variant="body2" color="text.secondary">
                          وقت التنفيذ
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedReport?.lesson2_time || 
                           (selectedReport?.activities?.find(a => a.name === "الدرس الثاني")?.execution_time) || 
                           '00:00'}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                  
                  {/* عرض حلقة التلاوة */}
                  <Grid item xs={12} md={4}>
                    <Paper 
                      elevation={2}
                      sx={{ 
                        p: 2, 
                        textAlign: 'center',
                        border: '1px solid #9c27b0',
                        borderRadius: 2,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight="bold" color="#9c27b0" mb={2}>
                        حلقة التلاوة
                      </Typography>
                      <Box sx={{ 
                        my: 2, 
                        p: 2, 
                        bgcolor: '#f3e5f5',
                        borderRadius: 2,
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                      }}>
                        <Typography variant="h4" fontWeight="bold" color="#7b1fa2">
                          {selectedReport?.quran_session_beneficiaries || 
                           (selectedReport?.activities?.find(a => a.name === "حلقة التلاوة")?.beneficiaries_count) || 
                           '0'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={1}>
                          عدد المستفيدين
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed #e0e0e0' }}>
                        <Typography variant="body2" color="text.secondary">
                          وقت التنفيذ
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedReport?.quran_session_time || 
                           (selectedReport?.activities?.find(a => a.name === "حلقة التلاوة")?.execution_time) || 
                           '00:00'}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </Paper>
              
              {/* عرض إجمالي المستفيدين */}
              <Paper 
                elevation={3}
                sx={{ 
                  p: 3, 
                  mt: 4, 
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
                    {selectedReport?.beneficiaries_count || '0'}
                  </Typography>
                </Box>
              </Paper>
              
              {/* جدول ملخص للأنشطة */}
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ borderBottom: '2px solid #1976d2', pb: 1, display: 'inline-block' }}>
                  جدول ملخص للأنشطة
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
                      <TableRow>
                        <TableCell>الدرس الأول</TableCell>
                        <TableCell>
                          <Typography fontWeight="bold">
                            {selectedReport?.lesson1_beneficiaries || 
                             (selectedReport?.activities?.find(a => a.name === "الدرس الأول")?.beneficiaries_count) || 
                             '0'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {selectedReport?.lesson1_time || 
                           (selectedReport?.activities?.find(a => a.name === "الدرس الأول")?.execution_time) || 
                           '00:00'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>الدرس الثاني</TableCell>
                        <TableCell>
                          <Typography fontWeight="bold">
                            {selectedReport?.lesson2_beneficiaries || 
                             (selectedReport?.activities?.find(a => a.name === "الدرس الثاني")?.beneficiaries_count) || 
                             '0'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {selectedReport?.lesson2_time || 
                           (selectedReport?.activities?.find(a => a.name === "الدرس الثاني")?.execution_time) || 
                           '00:00'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>حلقة التلاوة</TableCell>
                        <TableCell>
                          <Typography fontWeight="bold">
                            {selectedReport?.quran_session_beneficiaries || 
                             (selectedReport?.activities?.find(a => a.name === "حلقة التلاوة")?.beneficiaries_count) || 
                             '0'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {selectedReport?.quran_session_time || 
                           (selectedReport?.activities?.find(a => a.name === "حلقة التلاوة")?.execution_time) || 
                           '00:00'}
                        </TableCell>
                      </TableRow>
                      <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>الإجمالي</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>
                          <Typography color="primary" fontWeight="bold">
                            {selectedReport?.beneficiaries_count || '0'}
                          </Typography>
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            variant="outlined" 
            color="primary" 
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
          >
            طباعة التقرير
          </Button>
          <Button 
            variant="contained" 
            onClick={() => setReportDetailsOpen(false)}
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default Reports;