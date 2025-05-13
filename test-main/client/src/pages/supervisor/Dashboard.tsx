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
  Chip,
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

const SupervisorDashboard: React.FC = () => {
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
        {/* Stats Summary */}
        <Grid item xs={12} md={4}>
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
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssignmentTurnedInIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h6">الحضور</Typography>
              </Box>
              <Typography variant="h3" sx={{ mb: 1, textAlign: 'center' }}>
                {dashboardData?.presentPercentage || 0}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssignmentLateIcon color="error" sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h6">المستفيدين</Typography>
              </Box>
              <Typography variant="h3" sx={{ mb: 1, textAlign: 'center' }}>
                {dashboardData?.stats.totalBeneficiaries || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Employees Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                الموظفين
              </Typography>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => navigate('/supervisor/reports')}
              >
                عرض التقارير
              </Button>
            </Box>
            
            {dashboardData?.employees && dashboardData.employees.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>اسم الموظف</TableCell>
                      <TableCell>الحالة اليوم</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboardData.employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>{employee.full_name}</TableCell>
                        <TableCell>
                          <Chip 
                            label="موجود" 
                            color="success" 
                            size="small" 
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary">
                لا يوجد موظفين تحت إشرافك.
              </Typography>
            )}
          </Paper>
        </Grid>
        
        {/* Activities Breakdown */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
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
      </Grid>
    </Layout>
  );
};

export default SupervisorDashboard; 