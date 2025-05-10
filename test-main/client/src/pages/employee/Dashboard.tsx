import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Grid, 
  Button, 
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';

interface Report {
  id: number;
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

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<{
    todayReport: Report | null;
    hasSubmittedToday: boolean;
    supervisor: Supervisor | null;
    recentReports: Report[];
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get('/api/dashboard/employee');
        setDashboardData(response.data);
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        setError(error.response?.data?.message || 'حدث خطأ أثناء جلب البيانات');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Layout title="لوحة التحكم">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="لوحة التحكم">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout title="لوحة التحكم">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          مرحباً {user?.full_name}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {format(new Date(), 'yyyy/MM/dd')}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Today's Report Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {dashboardData?.hasSubmittedToday ? (
                  <AssignmentTurnedInIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                ) : (
                  <AssignmentIcon color="warning" sx={{ fontSize: 40, mr: 2 }} />
                )}
                <Typography variant="h6">
                  {dashboardData?.hasSubmittedToday ? 'تم إرسال التقرير اليومي' : 'التقرير اليومي'}
                </Typography>
              </Box>
              
              {dashboardData?.hasSubmittedToday ? (
                <Box>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>نوع النشاط:</strong> {dashboardData.todayReport?.activity_name}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>عدد المستفيدين:</strong> {dashboardData.todayReport?.beneficiaries_count}
                  </Typography>
                  {dashboardData.todayReport?.location && (
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>الموقع:</strong> {dashboardData.todayReport?.location}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    تم الإرسال: {new Date(dashboardData.todayReport?.submitted_at || '').toLocaleTimeString()}
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    لم تقم بإرسال التقرير اليومي بعد.
                  </Typography>
                  <Button 
                    variant="contained" 
                    onClick={() => navigate('/employee/report')}
                  >
                    إرسال التقرير الآن
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Supervisor Info */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SupervisorAccountIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h6">المشرف</Typography>
              </Box>
              
              {dashboardData?.supervisor ? (
                <Box>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>الاسم:</strong> {dashboardData.supervisor.full_name}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body1">
                  لم يتم تعيين مشرف لك بعد.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Reports */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              آخر التقارير
            </Typography>
            
            {dashboardData?.recentReports && dashboardData.recentReports.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>التاريخ</TableCell>
                      <TableCell>نوع النشاط</TableCell>
                      <TableCell>عدد المستفيدين</TableCell>
                      <TableCell>الموقع</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboardData.recentReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>{format(new Date(report.report_date), 'yyyy/MM/dd')}</TableCell>
                        <TableCell>
                          <Chip label={report.activity_name} size="small" />
                        </TableCell>
                        <TableCell>{report.beneficiaries_count}</TableCell>
                        <TableCell>{report.location || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary">
                لا توجد تقارير سابقة.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Layout>
  );
};

export default EmployeeDashboard; 