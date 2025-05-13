import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Grid, 
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';

interface Employee {
  id: number;
  full_name: string;
  role: string;
}

interface Stats {
  attendance: {
    present: number;
    absent: number;
  };
  totalBeneficiaries: number;
  activitiesBreakdown: Array<{
    name: string;
    count: number;
    beneficiaries: number;
  }>;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<{
    stats: Stats;
    employees: Employee[];
    totalEmployees: number;
    presentPercentage: number;
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get('/api/dashboard');
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
      <Layout title="لوحة التحكم الرئيسية">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="لوحة التحكم الرئيسية">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout title="لوحة التحكم الرئيسية">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          مرحباً {user?.full_name}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {format(new Date(), 'yyyy/MM/dd')}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Stats Summary Cards */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PeopleAltIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h6">الموظفين</Typography>
              </Box>
              <Typography variant="h3" sx={{ mb: 1, textAlign: 'center' }}>
                {dashboardData?.totalEmployees || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SupervisorAccountIcon color="secondary" sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h6">المشرفين</Typography>
              </Box>
              <Typography variant="h3" sx={{ mb: 1, textAlign: 'center' }}>
                {dashboardData?.employees?.filter(e => e.role === 'supervisor').length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssignmentTurnedInIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h6">الحضور</Typography>
              </Box>
              <Typography variant="h3" sx={{ mb: 1, textAlign: 'center' }}>
                {dashboardData?.presentPercentage || 0}%
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                {dashboardData?.stats.attendance.present || 0} من {(dashboardData?.stats.attendance.present || 0) + (dashboardData?.stats.attendance.absent || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssignmentLateIcon color="info" sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h6">المستفيدين</Typography>
              </Box>
              <Typography variant="h3" sx={{ mb: 1, textAlign: 'center' }}>
                {dashboardData?.stats.totalBeneficiaries || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              إجراءات سريعة
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button 
                variant="contained" 
                onClick={() => navigate('/admin/users')}
              >
                إدارة المستخدمين
              </Button>
              <Button 
                variant="contained" 
                onClick={() => navigate('/supervisor/reports')}
              >
                عرض التقارير
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Activities Breakdown */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              توزيع الأنشطة
            </Typography>
            
            {dashboardData?.stats.activitiesBreakdown && 
             dashboardData.stats.activitiesBreakdown.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>النشاط</TableCell>
                      <TableCell>عدد المرات</TableCell>
                      <TableCell>عدد المستفيدين</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboardData.stats.activitiesBreakdown.map((activity, index) => (
                      <TableRow key={index}>
                        <TableCell>{activity.name}</TableCell>
                        <TableCell>{activity.count}</TableCell>
                        <TableCell>{activity.beneficiaries}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary">
                لا توجد أنشطة لعرضها.
              </Typography>
            )}
          </Paper>
        </Grid>
        
        {/* Recent Employees */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              الموظفين
            </Typography>
            
            {dashboardData?.employees && dashboardData.employees.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>الاسم</TableCell>
                      <TableCell>الدور</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboardData.employees.slice(0, 5).map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>{employee.full_name}</TableCell>
                        <TableCell>
                          {employee.role === 'admin' ? 'مدير النظام' : 
                           employee.role === 'supervisor' ? 'مشرف' : 'موظف'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {dashboardData.employees.length > 5 && (
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Button 
                      variant="text" 
                      onClick={() => navigate('/admin/users')}
                    >
                      عرض الكل
                    </Button>
                  </Box>
                )}
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary">
                لا يوجد موظفين.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Layout>
  );
};

export default AdminDashboard; 