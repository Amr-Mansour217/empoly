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
  Chip
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

const Reports: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = subDays(new Date(), 7).toISOString().split('T')[0];
  
  const [filters, setFilters] = useState({
    startDate: weekAgo,
    endDate: today,
    activityType: 'all',
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const response = await axios.get(`/api/reports?${params.toString()}`);
      setReports(response.data.reports);
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      setError(error.response?.data?.message || 'حدث خطأ أثناء جلب التقارير');
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

  const handleSearch = () => {
    fetchReports();
  };

  if (loading && reports.length === 0) {
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
    </Layout>
  );
};

export default Reports; 