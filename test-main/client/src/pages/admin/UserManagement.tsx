import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Button, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  IconButton
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';

interface User {
  id: number;
  username: string;
  full_name: string;
  phone?: string;
  nationality?: string;
  location?: string;
  role: 'admin' | 'supervisor' | 'employee';
  created_at?: string;
}

interface SupervisorAssignment {
  employeeId: number;
  supervisorId: number;
}

const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userFormOpen, setUserFormOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [assignSupervisorDialogOpen, setAssignSupervisorDialogOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [assignmentData, setAssignmentData] = useState<SupervisorAssignment>({
    employeeId: 0,
    supervisorId: 0
  });
  // Track supervisor assignments for each employee
  const [employeeSupervisors, setEmployeeSupervisors] = useState<Record<number, User>>({});

  // Fetch users and supervisors
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        try {
          // Get all users from API
          const usersResponse = await axios.get('/api/users');
          console.log('Users API response:', usersResponse.data);
          
          // Ensure we always have an array even if the API returns null/undefined
          const usersList = usersResponse.data.users || [];
          setUsers(usersList);
          
          // Important: Clear any error state if we successfully got a response
          setError(null);
          
          // Extract supervisors directly from users list instead of making a separate API call
          // This prevents the 500 error from the /api/users/supervisors endpoint
          const supervisorsFromUsers = usersList.filter(u => u.role === 'supervisor' || u.role === 'admin');
          console.log('Using supervisors extracted from user list:', supervisorsFromUsers);
          setSupervisors(supervisorsFromUsers);
          
          // Fetch supervisor information for employees
          const supervisorMap: Record<number, User> = {};
          const employees = usersList.filter(u => u.role === 'employee');
          
          console.log('Fetching supervisor info for all employees...');
          
          // First try to fetch from employee_supervisors directly using a custom endpoint
          try {
            const allAssignmentsResponse = await axios.get('/api/users/all-supervisor-assignments');
            if (allAssignmentsResponse.data && allAssignmentsResponse.data.assignments) {
              console.log('Fetched all supervisor assignments at once:', allAssignmentsResponse.data);
              
              // Process all assignments
              allAssignmentsResponse.data.assignments.forEach(assignment => {
                const supervisorUser = usersList.find(u => u.id === assignment.supervisor_id);
                if (supervisorUser) {
                  supervisorMap[assignment.employee_id] = supervisorUser;
                }
              });
            }
          } catch (bulkError) {
            console.log('Bulk supervisor fetch failed, falling back to individual requests');
            
            // Fall back to individual requests if the bulk endpoint doesn't exist
            // Get supervisors for all employees
            await Promise.all(
              employees.map(async (employee) => {
                try {
                  console.log(`Fetching supervisor for employee ID ${employee.id}...`);
                  const response = await axios.get(`/api/users/${employee.id}/supervisor`);
                  if (response.data && response.data.supervisor) {
                    console.log(`Found supervisor for employee ${employee.id}:`, response.data.supervisor);
                    supervisorMap[employee.id] = response.data.supervisor;
                  }
                } catch (supervisorError) {
                  console.log(`No supervisor found for employee ${employee.id}:`, supervisorError);
                  // Ignore errors for employees without supervisors
                }
              })
            );
          }
          
          console.log('Final supervisor map:', supervisorMap);
          setEmployeeSupervisors(supervisorMap);
          
        } catch (apiError: any) {
          console.error('Error in API calls:', apiError);
          
          // Only show "no users" message if there truly are no users
          if (apiError.response?.status === 500 && (!users || users.length === 0)) {
            setError('قد لا يوجد مستخدمين في النظام بعد. قم بإضافة مستخدم جديد لبدء استخدام النظام.');
          } else {
            setError(apiError.response?.data?.message || 'حدث خطأ أثناء جلب بيانات المستخدمين');
          }
        }
      } catch (error: any) {
        console.error('Error in overall fetch operation:', error);
        setError('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى أو إضافة مستخدم جديد.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // User form handling
  const userFormik = useFormik({
    initialValues: {
      id: 0,
      username: '',
      password: '',
      full_name: '',
      phone: '',
      nationality: '',
      location: '',
      role: 'employee' as 'admin' | 'supervisor' | 'employee',
      supervisorId: 0, // Add supervisorId field
    },
    validationSchema: Yup.object({
      username: Yup.string().required('اسم المستخدم مطلوب'),
      password: Yup.string().test(
        'required-if-new-user',
        'كلمة المرور مطلوبة',
        function(value) {
          return this.parent.id ? true : (value && value.length > 0);
        }
      ),
      full_name: Yup.string().required('الاسم الكامل مطلوب'),
      role: Yup.string().required('الدور مطلوب'),
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        setLoading(true);
        setError(null); // Clear any previous errors
        
        let newUserId = values.id; // Will store new user ID if created

        if (values.id) {
          // Update existing user
          await axios.post(`/api/users/${values.id}`, {
            full_name: values.full_name,
            phone: values.phone || null,
            nationality: values.nationality || null,
            location: values.location || null,
            role: values.role,
          });
        } else {
          // Create new user
          const registerResponse = await axios.post('/api/auth/register', {
            username: values.username,
            password: values.password,
            full_name: values.full_name,
            phone: values.phone || null,
            nationality: values.nationality || null,
            location: values.location || null,
            role: values.role
            // Supervisor selection has been removed from the form
          });
          
          // Capture the new user ID for potential supervisor assignment
          if (registerResponse.data && registerResponse.data.userId) {
            newUserId = registerResponse.data.userId;
            console.log('New user created with ID:', newUserId);
          }
        }
        
        // Supervisor assignment during user creation has been removed since the supervisor dropdown was removed
        
        // Refresh user list
        const response = await axios.get('/api/users');
        const updatedUsers = response.data.users || [];
        setUsers(updatedUsers);
        
        // Make sure to clear any persistent error message
        // since we now have at least one user
        setError(null);
        
        // Log success for debugging purposes
        console.log(`Successfully ${values.id ? 'updated' : 'created'} user. Total users: ${updatedUsers.length}`);
        
        // Update supervisors list directly from the updated users
        const newSupervisors = updatedUsers.filter(u => u.role === 'supervisor' || u.role === 'admin');
        console.log('Updated supervisors from user list:', newSupervisors);
        setSupervisors(newSupervisors);
        
        console.log('Current employeeSupervisors before update:', employeeSupervisors);
        
        // Force refresh all supervisor assignments after user creation/update
        try {
          // Load all supervisor assignments to ensure everything is in sync
          const allAssignmentsResponse = await axios.get('/api/users/all-supervisor-assignments');
          if (allAssignmentsResponse.data && allAssignmentsResponse.data.assignments) {
            const assignments = allAssignmentsResponse.data.assignments;
            console.log('All supervisor assignments after user action:', assignments);
            
            // Create a complete supervisor map from all assignments
            const completeMap = { ...employeeSupervisors }; // Start with existing assignments
            
            for (const assignment of assignments) {
              const supId = assignment.supervisor_id;
              const empId = assignment.employee_id;
              const supervisor = updatedUsers.find(u => u.id === supId);
              if (supervisor) {
                completeMap[empId] = supervisor;
              }
            }
            
            console.log('Complete supervisor map after refresh:', completeMap);
            setEmployeeSupervisors(completeMap);
          }
        } catch (refreshError) {
          console.error('Error refreshing supervisor assignments:', refreshError);
          // Continue with the flow even if refreshing fails
        }
        
        resetForm();
        setUserFormOpen(false);
      } catch (error: any) {
        console.error('Error saving user:', error);
        setError(error.response?.data?.message || 'حدث خطأ أثناء حفظ بيانات المستخدم');
      } finally {
        setLoading(false);
      }
    },
  });

  // Open user form for adding new user
  const handleAddUser = async () => {
    // Reset the form and make sure supervisorId is set to 0 (default)
    userFormik.resetForm({
      values: {
        id: 0,
        username: '',
        password: '',
        full_name: '',
        phone: '',
        nationality: '',
        location: '',
        role: 'employee',
        supervisorId: 0,
      }
    });
    setSelectedUser(null);
    
    try {
      // Load fresh supervisors data before opening the dialog
      console.log('Fetching latest supervisors before opening add user form...');
      
      // Option 1: Extract from current users list
      const availableSupervisors = users.filter(u => 
        (u.role === 'supervisor' || u.role === 'admin')
      );
      
      if (availableSupervisors.length > 0) {
        console.log('Found supervisors in current users:', availableSupervisors);
        setSupervisors(availableSupervisors);
      } else {
        // Option 2: Try fetching from API as a fallback
        try {
          console.log('No supervisors in current users list, fetching from API...');
          const supervisorsResponse = await axios.get('/api/users/supervisors');
          if (supervisorsResponse.data && supervisorsResponse.data.supervisors) {
            console.log('Fetched supervisors from API:', supervisorsResponse.data.supervisors);
            setSupervisors(supervisorsResponse.data.supervisors);
          }
        } catch (apiError) {
          console.error('Failed to fetch supervisors from API:', apiError);
          // Continue with empty supervisors list
        }
      }
      
      // Clear any previously selected supervisor
      userFormik.setFieldValue('supervisorId', 0);
    } catch (error) {
      console.error('Error preparing add user form:', error);
    }
    
    setUserFormOpen(true);
  };

  // Open user form for editing user
  const handleEditUser = async (user: User) => {
    // First, set basic user information
    userFormik.setValues({
      id: user.id,
      username: user.username,
      password: '',
      full_name: user.full_name,
      phone: user.phone || '',
      nationality: user.nationality || '',
      location: user.location || '',
      role: user.role,
      supervisorId: 0, // Default value, will update if assigned supervisor is found
    });
    
    setSelectedUser(user);
    
    // If the user is an employee, try to get their assigned supervisor
    if (user.role === 'employee') {
      try {
        // Load supervisors for dropdown
        const availableSupervisors = users.filter(u => 
          (u.role === 'supervisor' || u.role === 'admin') && u.id !== user.id
        );
        if (availableSupervisors.length > 0) {
          setSupervisors(availableSupervisors);
        }
        
        // Fetch the employee's supervisor if they have one
        const supervisorResponse = await axios.get(`/api/users/${user.id}/supervisor`);
        if (supervisorResponse.data && supervisorResponse.data.supervisor) {
          console.log('Found supervisor for employee:', supervisorResponse.data.supervisor);
          
          // Update the formik values with the supervisor ID
          userFormik.setFieldValue('supervisorId', supervisorResponse.data.supervisor.id);
        }
      } catch (error) {
        console.error('Error getting supervisor for employee:', error);
        // Continue even if we can't get the supervisor
      }
    }
    
    setUserFormOpen(true);
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  // Delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      setLoading(true);
      setError(null);
      
      await axios.delete(`/api/users/${selectedUser.id}`);
      
      // Refresh user list
      const response = await axios.get('/api/users');
      setUsers(response.data.users);
      
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setError(error.response?.data?.message || 'حدث خطأ أثناء حذف المستخدم');
    } finally {
      setLoading(false);
    }
  };

  // Open assign supervisor dialog
  const handleAssignSupervisorClick = async (employee: User) => {
    setSelectedUser(employee);
    
    // تأكد من أن معرف الموظف رقم صحيح موجب
    const numericEmployeeId = typeof employee.id === 'string' ? parseInt(employee.id) : 
                           typeof employee.id === 'number' ? employee.id : 0;
    
    console.log('Preparing to assign supervisor for employee:', {
      original: employee.id,
      converted: numericEmployeeId,
      originalType: typeof employee.id,
      convertedType: typeof numericEmployeeId
    });
    
    // Ensure we're using a number type for the employee ID
    setAssignmentData({
      employeeId: numericEmployeeId,
      supervisorId: 0
    });
    
    // Try to get supervisors before opening dialog to avoid errors
    try {
      setLoading(true);
      console.log('Fetching supervisors before opening assignment dialog...');
      
      // Extract supervisors directly from current users instead of making another API call
      const availableSupervisors = users.filter(u => 
        (u.role === 'supervisor' || u.role === 'admin') && u.id !== employee.id
      );
      
      if (availableSupervisors.length > 0) {
        console.log('Using supervisors from current users:', availableSupervisors);
        setSupervisors(availableSupervisors);
      }
      // Note: We no longer need to call the API as a fallback
      // This way we avoid the 500 error that was happening
    } catch (error) {
      console.error('Error preparing supervisor assignment:', error);
    } finally {
      setLoading(false);
      setAssignSupervisorDialogOpen(true);
    }
  };

  // Assign supervisor to employee
  const handleAssignSupervisor = async () => {
    if (!assignmentData.supervisorId || !assignmentData.employeeId) {
      alert('الرجاء اختيار مشرف أولاً');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Assigning supervisor:', assignmentData);
      // Send the assignment request to the server
      const assignResponse = await axios.post('http://localhost:5001/test/supervisor-assign', assignmentData);
      
      console.log('Assignment response:', assignResponse.data);
      
      // Refresh user list to show updated assignment
      const response = await axios.get('/api/users');
      setUsers(response.data.users || []);
      
      // Update supervisors directly from the users we already have
      const updatedSupervisors = response.data.users.filter((u: User) => 
        (u.role === 'supervisor' || u.role === 'admin')
      );
      console.log('Updated supervisors list from users:', updatedSupervisors);
      setSupervisors(updatedSupervisors);
      
      // Update the employee-supervisor mapping in the local state
      const updatedUsers = response.data.users || [];
      const assignedSupervisor = updatedUsers.find((u: User) => u.id === assignmentData.supervisorId);
      if (assignedSupervisor) {
        console.log('Updating local supervisor mapping:', {
          employeeId: assignmentData.employeeId,
          supervisor: assignedSupervisor
        });
        setEmployeeSupervisors(prevMap => ({
          ...prevMap,
          [assignmentData.employeeId]: assignedSupervisor
        }));
      }
      
      // Show success message
      alert('تم تعيين المشرف بنجاح'); // Simple success message
      
      // Close dialog and reset selection
      setAssignSupervisorDialogOpen(false);
      setSelectedUser(null);
      setAssignmentData({
        employeeId: 0,
        supervisorId: 0
      });
      
    } catch (error: any) {
      console.error('Error assigning supervisor:', error);
      setError(error.response?.data?.message || 'حدث خطأ أثناء تعيين المشرف');
      alert('حدث خطأ أثناء تعيين المشرف: ' + (error.response?.data?.message || 'خطأ غير معروف')); // Show detailed error to user
    } finally {
      setLoading(false);
    }
  };

  if (loading && users.length === 0) {
    return (
      <Layout title="إدارة المستخدمين">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title="إدارة المستخدمين">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          إدارة المستخدمين
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddUser}
        >
          إضافة مستخدم
        </Button>
      </Box>

      {/* Only show error in very specific circumstances */}
      {error && users.length === 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Show informational message when there are users but no supervisors */}
      {users.length > 0 && supervisors.length === 0 && !users.some(user => user.role === 'supervisor' || user.role === 'admin') && (
        <Alert severity="info" sx={{ mb: 3 }}>
          تم العثور على المستخدمين، ولكن لم يتم العثور على أي مشرفين. قد تحتاج إلى إضافة مستخدمين بدور "مشرف" أو "مدير النظام".
        </Alert>
      )}

      {users.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom color="textSecondary">
            لا يوجد مستخدمين حاليًا
          </Typography>
          <Typography variant="body1" paragraph color="textSecondary">
            يبدو أنه لا يوجد مستخدمين في النظام بعد. قم بإضافة مستخدم جديد لبدء استخدام النظام.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddUser}
            sx={{ mt: 2 }}
          >
            إضافة مستخدم جديد الآن
          </Button>
        </Paper>
      ) : (
        <Paper sx={{ p: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>اسم المستخدم</TableCell>
                  <TableCell>الاسم الكامل</TableCell>
                  <TableCell>الدور</TableCell>
                  <TableCell>الهاتف</TableCell>
                  <TableCell>المشرف</TableCell>
                  <TableCell>الإجراءات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.full_name}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.role === 'admin' ? 'مدير النظام' : 
                               user.role === 'supervisor' ? 'مشرف' : 'موظف'} 
                        color={user.role === 'admin' ? 'secondary' : 
                               user.role === 'supervisor' ? 'primary' : 'default'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{user.phone || '-'}</TableCell>
                    <TableCell>
                      {user.role === 'employee' ? (
                        employeeSupervisors[user.id] ? (
                          <Chip 
                            label={employeeSupervisors[user.id].full_name}
                            size="small"
                            color="primary"
                            variant="outlined"
                            icon={<SupervisorAccountIcon />}
                          />
                        ) : (
                          <Chip
                            label="لا يوجد مشرف"
                            size="small"
                            color="default"
                            variant="outlined"
                            onClick={() => handleAssignSupervisorClick(user)}
                          />
                        )
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEditUser(user)} size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      {user.role === 'employee' && (
                        <IconButton onClick={() => handleAssignSupervisorClick(user)} size="small">
                          <SupervisorAccountIcon fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton onClick={() => handleDeleteClick(user)} size="small" color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Add/Edit User Dialog */}
      <Dialog open={userFormOpen} onClose={() => setUserFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedUser ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}</DialogTitle>
        <form onSubmit={userFormik.handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="username"
                  name="username"
                  label="اسم المستخدم"
                  value={userFormik.values.username}
                  onChange={userFormik.handleChange}
                  onBlur={userFormik.handleBlur}
                  error={userFormik.touched.username && Boolean(userFormik.errors.username)}
                  helperText={userFormik.touched.username && userFormik.errors.username}
                  disabled={!!selectedUser}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="password"
                  name="password"
                  label={selectedUser ? 'كلمة المرور (اتركها فارغة للإبقاء على كلمة المرور الحالية)' : 'كلمة المرور'}
                  type="password"
                  value={userFormik.values.password}
                  onChange={userFormik.handleChange}
                  onBlur={userFormik.handleBlur}
                  error={userFormik.touched.password && Boolean(userFormik.errors.password)}
                  helperText={userFormik.touched.password && userFormik.errors.password}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="full_name"
                  name="full_name"
                  label="الاسم الكامل"
                  value={userFormik.values.full_name}
                  onChange={userFormik.handleChange}
                  onBlur={userFormik.handleBlur}
                  error={userFormik.touched.full_name && Boolean(userFormik.errors.full_name)}
                  helperText={userFormik.touched.full_name && userFormik.errors.full_name}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="phone"
                  name="phone"
                  label="الهاتف"
                  value={userFormik.values.phone}
                  onChange={userFormik.handleChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="role-label">الدور</InputLabel>
                  <Select
                    labelId="role-label"
                    id="role"
                    name="role"
                    value={userFormik.values.role}
                    onChange={userFormik.handleChange}
                    label="الدور"
                  >
                    <MenuItem value="admin">مدير النظام</MenuItem>
                    <MenuItem value="supervisor">مشرف</MenuItem>
                    <MenuItem value="employee">موظف</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="nationality"
                  name="nationality"
                  label="الجنسية"
                  value={userFormik.values.nationality}
                  onChange={userFormik.handleChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="location"
                  name="location"
                  label="الموقع"
                  value={userFormik.values.location}
                  onChange={userFormik.handleChange}
                  margin="normal"
                />
              </Grid>
              {/* Supervisor dropdown removed as requested */}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUserFormOpen(false)}>إلغاء</Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : (selectedUser ? 'تحديث' : 'إضافة')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>تأكيد الحذف</DialogTitle>
        <DialogContent>
          <DialogContentText>
            هل أنت متأكد من رغبتك في حذف المستخدم "{selectedUser?.full_name}"؟
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>إلغاء</Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained">
            {loading ? <CircularProgress size={24} /> : 'حذف'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Supervisor Dialog */}
      <Dialog
        open={assignSupervisorDialogOpen}
        onClose={() => setAssignSupervisorDialogOpen(false)}
      >
        <DialogTitle>تعيين مشرف</DialogTitle>
        <DialogContent>
          {supervisors.length > 0 ? (
            <>
              <DialogContentText sx={{ mb: 2 }}>
                اختر مشرفًا للموظف "{selectedUser?.full_name}"
              </DialogContentText>
              <FormControl fullWidth>
                <InputLabel id="supervisor-label">المشرف</InputLabel>
                <Select
                  labelId="supervisor-label"
                  value={assignmentData.supervisorId}
                  onChange={(e) => setAssignmentData({
                    ...assignmentData,
                    supervisorId: e.target.value as number
                  })}
                  label="المشرف"
                >
                  {supervisors.map(supervisor => (
                    <MenuItem key={supervisor.id} value={supervisor.id}>
                      {supervisor.full_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          ) : (
            <Alert severity="warning" sx={{ mt: 2 }}>
              لا يوجد مشرفين متاحين. يرجى إضافة مستخدمين بدور "مشرف" أو "مدير نظام" أولاً.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignSupervisorDialogOpen(false)}>إلغاء</Button>
          {supervisors.length > 0 && (
            <Button 
              onClick={handleAssignSupervisor} 
              variant="contained"
              disabled={!assignmentData.supervisorId || loading}
            >
              {loading ? <CircularProgress size={24} /> : 'تعيين'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default UserManagement;