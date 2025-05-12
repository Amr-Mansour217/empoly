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
  Divider
} from '@mui/material';
import { format, subDays } from 'date-fns';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import SearchIcon from '@mui/icons-material/Search';

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
  
  // Filter states
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = subDays(new Date(), 7).toISOString().split('T')[0];
  
  const [filters, setFilters] = useState({
    startDate: weekAgo,
    endDate: today,
    activityType: 'all',
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
        const response = await axios.get('/api/users', {
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
      const response = await axios.get('/api/users', {
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
      const response = await axios.get(`/api/reports?${params.toString()}`);
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

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = event.target;
    setFilters({
      ...filters,
      [name as string]: value,
    });
  };

  const handleSupervisorChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedSupervisor(event.target.value as number);
  };

  const handleSearch = () => {
    fetchReports();
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

  // Filter reports by activity type if selected
  const filteredReports = filters.activityType === 'all' 
    ? reports 
    : reports.filter(report => report.activity_name === filters.activityType);

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
                onChange={(e) => handleSupervisorChange(e as any)}
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
              <InputLabel id="activity-type-label">نوع النشاط</InputLabel>
              <Select
                labelId="activity-type-label"
                id="activityType"
                name="activityType"
                value={filters.activityType}
                onChange={handleFilterChange}
                label="نوع النشاط"
              >
                <MenuItem value="all">جميع الأنشطة</MenuItem>
                {Array.from(new Set(reports.map(report => report.activity_name))).map(activity => (
                  <MenuItem key={activity} value={activity}>
                    {activity}
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
                  <TableCell>نوع النشاط</TableCell>
                  <TableCell>عدد المستفيدين</TableCell>
                  <TableCell>الموقع</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>{format(new Date(report.report_date), 'yyyy/MM/dd')}</TableCell>
                    <TableCell>{report.full_name}</TableCell>
                    <TableCell>
                      <Chip 
                        label={report.activity_name} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{report.beneficiaries_count}</TableCell>
                    <TableCell>{report.location || '-'}</TableCell>
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
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2">إجمالي التقارير:</Typography>
                <Typography variant="h6">{filteredReports.length}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2">إجمالي المستفيدين:</Typography>
                <Typography variant="h6">
                  {filteredReports.reduce((sum, report) => sum + report.beneficiaries_count, 0)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2">متوسط المستفيدين لكل تقرير:</Typography>
                <Typography variant="h6">
                  {Math.round(filteredReports.reduce((sum, report) => sum + report.beneficiaries_count, 0) / filteredReports.length)}
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
    </Layout>
  );
};

export default Reports; 