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
  IconButton,
  Snackbar,
  AlertColor,
  SelectChangeEvent
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
  const [employeeSupervisors, setEmployeeSupervisors] = useState<Record<number, User>>({});
  
  const [notificationOpen, setNotificationOpen] = useState<boolean>(false);
  const [notificationMessage, setNotificationMessage] = useState<string>('');
  const [notificationSeverity, setNotificationSeverity] = useState<AlertColor>('success');
  // إضافة متغير جديد لتتبع تحديثات الواجهة
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // تعديل useEffect لتعتمد على refreshTrigger
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching data, refresh trigger value:', refreshTrigger);
        
        try {
          const usersResponse = await axios.get('https://elmanafea.online/api/users');
          console.log('Users API response:', usersResponse.data);
          
          const usersList = usersResponse.data.users || [];
          setUsers(usersList);
          
          setError(null);
          
          const supervisorsFromUsers = usersList.filter(u => u.role === 'supervisor' || u.role === 'admin');
          console.log('Using supervisors extracted from user list:', supervisorsFromUsers);
          setSupervisors(supervisorsFromUsers);
          
          const supervisorMap: Record<number, User> = {};
          const employees = usersList.filter(u => u.role === 'employee');
          
          console.log('Fetching supervisor info for all employees...');
          
          try {
            const allAssignmentsResponse = await axios.get('https://elmanafea.online/api/users/all-supervisor-assignments');
            if (allAssignmentsResponse.data && allAssignmentsResponse.data.assignments) {
              console.log('Fetched all supervisor assignments at once:', allAssignmentsResponse.data);
              
              allAssignmentsResponse.data.assignments.forEach(assignment => {
                const supervisorUser = usersList.find(u => u.id === assignment.supervisor_id);
                if (supervisorUser) {
                  supervisorMap[assignment.employee_id] = supervisorUser;
                }
              });
            }
          } catch (bulkError) {
            console.log('Bulk supervisor fetch failed, falling back to individual requests');
            
            await Promise.all(
              employees.map(async (employee) => {
                try {
                  console.log(`Fetching supervisor for employee ID ${employee.id}...`);
                  const response = await axios.get(`https://elmanafea.online/api/users/${employee.id}/supervisor`);
                  if (response.data && response.data.supervisor) {
                    console.log(`Found supervisor for employee ${employee.id}:`, response.data.supervisor);
                    supervisorMap[employee.id] = response.data.supervisor;
                  }
                } catch (supervisorError) {
                  console.log(`No supervisor found for employee ${employee.id}:`, supervisorError);
                }
              })
            );
          }
          
          console.log('Final supervisor map:', supervisorMap);
          setEmployeeSupervisors(supervisorMap);
          
        } catch (apiError: any) {
          console.error('Error in API calls:', apiError);
          
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
  }, [refreshTrigger]);

  const showNotification = (message: string, severity: AlertColor = 'success') => {
    console.log(`Showing notification: ${message} (${severity})`);
    setNotificationMessage(message);
    setNotificationSeverity(severity);
    setNotificationOpen(true);
    
    // زيادة مدة ظهور الإشعارات وتحديث الواجهة تلقائيًا
    setTimeout(() => {
      setNotificationOpen(false);
    }, 5000);
  };
  
  // دالة لتحديث البيانات في الواجهة
  const refreshData = () => {
    console.log('Manually triggering UI refresh');
    setRefreshTrigger(prev => prev + 1);
  };
  
  const handleNotificationClose = () => {
    setNotificationOpen(false);
  };

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
      supervisorId: 0,
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
        setError(null);
        
        let newUserId = values.id;

        if (values.id) {
          try {
            // سجل البيانات قبل الإرسال
            console.log('Sending update request with data:', {
              full_name: values.full_name,
              phone: values.phone || null,
              nationality: values.nationality || null,
              location: values.location || null,
              role: values.role,
            });
            
            // الخادم يتوقع طريقة POST للتحديث
            const updateResponse = await axios.post(`https://elmanafea.online/api/users/${values.id}`, {
              full_name: values.full_name,
              phone: values.phone || null,
              nationality: values.nationality || null,
              location: values.location || null,
              role: values.role,
            });
            
            console.log('Update response:', updateResponse.data);
            
            // معالجة جميع أنواع الاستجابات كنجاح طالما الاستجابة 200
            const isSuccess = updateResponse.status >= 200 && updateResponse.status < 300;
            const isNoChanges = updateResponse.data.message === "No changes were detected" || 
                               updateResponse.data.message === "No changes were made";
                               
            if (isSuccess) {
              if (isNoChanges) {
                showNotification('لم يتم إجراء أي تغييرات على بيانات المستخدم', 'info');
              } else {
                showNotification('تم تحديث المستخدم بنجاح', 'success');
              }
              
              // تحديث واجهة المستخدم
              refreshData();
              
              // إغلاق النموذج
              resetForm();
              setUserFormOpen(false);
            }
            
          } catch (updateError: any) {
            console.error('Error updating user:', updateError);
            
            // معالجة خطأ "No changes were made"
            if (updateError.response?.status === 400 && 
                (updateError.response?.data?.message === "No changes were made" ||
                 updateError.response?.data?.message === "No changes were detected")) {
              // التعامل مع هذه الحالة كنجاح وليس خطأ
              showNotification('لم يتم إجراء أي تغييرات على بيانات المستخدم', 'info');
              
              // تحديث واجهة المستخدم على أي حال
              refreshData();
              
              // إغلاق النموذج
              resetForm();
              setUserFormOpen(false);
            } else {
              // أخطاء أخرى
              setError(updateError.response?.data?.message || 'حدث خطأ أثناء تحديث بيانات المستخدم');
              showNotification('حدث خطأ أثناء تحديث بيانات المستخدم', 'error');
            }
            return;
          }
        } else {
          // إنشاء مستخدم جديد
          const registerResponse = await axios.post('https://elmanafea.online/api/auth/register', {
            username: values.username,
            password: values.password,
            full_name: values.full_name,
            phone: values.phone || null,
            nationality: values.nationality || null,
            location: values.location || null,
            role: values.role
          });
          
          if (registerResponse.data && registerResponse.data.userId) {
            newUserId = registerResponse.data.userId;
            console.log('New user created with ID:', newUserId);
          }
          
          // عرض رسالة نجاح
          showNotification('تم إضافة المستخدم بنجاح', 'success');
          
          // تحديث واجهة المستخدم
          refreshData();
          
          // إغلاق النموذج
          resetForm();
          setUserFormOpen(false);
        }
        
      } catch (error: any) {
        console.error('Error saving user:', error);
        setError(error.response?.data?.message || 'حدث خطأ أثناء حفظ بيانات المستخدم');
        showNotification('حدث خطأ أثناء حفظ بيانات المستخدم', 'error');
      } finally {
        setLoading(false);
      }
    },
  });

  const handleAddUser = async () => {
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
    // تأكد من مسح أي خطأ قبل فتح نموذج الإضافة
    setError(null);
    
    try {
      console.log('Fetching latest supervisors before opening add user form...');
      
      const availableSupervisors = users.filter(u => 
        (u.role === 'supervisor' || u.role === 'admin')
      );
      
      if (availableSupervisors.length > 0) {
        console.log('Found supervisors in current users:', availableSupervisors);
        setSupervisors(availableSupervisors);
      } else {
        try {
          console.log('No supervisors in current users list, fetching from API...');
          const supervisorsResponse = await axios.get('https://elmanafea.online/api/users/supervisors');
          if (supervisorsResponse.data && supervisorsResponse.data.supervisors) {
            console.log('Fetched supervisors from API:', supervisorsResponse.data.supervisors);
            setSupervisors(supervisorsResponse.data.supervisors);
          }
        } catch (apiError) {
          console.error('Failed to fetch supervisors from API:', apiError);
        }
      }
      
      userFormik.setFieldValue('supervisorId', 0);
    } catch (error) {
      console.error('Error preparing add user form:', error);
    }
    
    setUserFormOpen(true);
  };

  const handleEditUser = async (user: User) => {
    // تأكد من مسح أي خطأ قبل فتح نموذج التعديل
    setError(null);
    
    userFormik.setValues({
      id: user.id,
      username: user.username,
      password: '',
      full_name: user.full_name,
      phone: user.phone || '',
      nationality: user.nationality || '',
      location: user.location || '',
      role: user.role,
      supervisorId: 0,
    });
    
    setSelectedUser(user);
    
    if (user.role === 'employee') {
      try {
        const availableSupervisors = users.filter(u => 
          (u.role === 'supervisor' || u.role === 'admin') && u.id !== user.id
        );
        if (availableSupervisors.length > 0) {
          setSupervisors(availableSupervisors);
        }
        
        const supervisorResponse = await axios.get(`https://elmanafea.online/api/users/${user.id}/supervisor`);
        if (supervisorResponse.data && supervisorResponse.data.supervisor) {
          console.log('Found supervisor for employee:', supervisorResponse.data.supervisor);
          
          userFormik.setFieldValue('supervisorId', supervisorResponse.data.supervisor.id);
        }
      } catch (error) {
        console.error('Error getting supervisor for employee:', error);
      }
    }
    
    setUserFormOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    // منع حذف آخر مدير نظام
    if (selectedUser.role === 'admin') {
      const adminUsers = users.filter(u => u.role === 'admin');
      if (adminUsers.length <= 1) {
        setError('لا يمكن حذف آخر مدير نظام! يجب أن يكون هناك مدير واحد على الأقل في النظام.');
        setLoading(false);
        return;
      }
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const userIdToDelete = selectedUser.id;
      
      try {
        // محاولة حذف المستخدم مع تسجيل كامل للاستجابة
        console.log(`Attempting to delete user with ID: ${userIdToDelete}`);
        const deleteResponse = await axios.delete(`https://elmanafea.online/api/users/${userIdToDelete}`);
        console.log('Delete API response:', deleteResponse.data);
        
        // عرض رسالة نجاح
        showNotification('تم حذف المستخدم بنجاح', 'success');
        
        // تحديث واجهة المستخدم عن طريق refreshTrigger
        refreshData();
        
        // إغلاق مربع الحوار وإعادة تعيين المتغيرات
        setDeleteDialogOpen(false);
        setSelectedUser(null);
        setError(null);
      } catch (deleteError) {
        console.error('Error during delete operation:', deleteError);
        
        // حتى في حالة خطأ الحذف، نحاول التحقق إذا كان المستخدم قد حُذف بالفعل
        refreshData();
        
        // للتأكد، نحاول تحديث واجهة المستخدم على أي حال
        showNotification('تم حذف المستخدم بنجاح، ولكن حدث خطأ في تحديث الواجهة', 'success');
        
        // إغلاق مربع الحوار
        setDeleteDialogOpen(false);
        setSelectedUser(null);
        setError(null);
      }
      
    } catch (error: any) {
      console.error('Error deleting user:', error);
      
      // التحقق مما إذا كان المستخدم قد تم حذفه فعلاً رغم الخطأ
      try {
        const checkResponse = await axios.get('https://elmanafea.online/api/users');
        const updatedUsers = checkResponse.data.users || [];
        
        const userStillExists = updatedUsers.some((u: User) => u.id === selectedUser.id);
        
        if (!userStillExists) {
          // تم حذف المستخدم بنجاح رغم الخطأ
          showNotification('تم حذف المستخدم بنجاح', 'success');
          
          // تحديث البيانات
          setUsers(updatedUsers);
          
          // تحديث قائمة المشرفين
          const updatedSupervisors = updatedUsers.filter((u: User) => 
            (u.role === 'supervisor' || u.role === 'admin')
          );
          setSupervisors(updatedSupervisors);
          
          // إغلاق مربع الحوار
          setDeleteDialogOpen(false);
          setSelectedUser(null);
          setError(null);
        } else {
          // المستخدم لا يزال موجودًا، لذا كان هناك خطأ حقيقي
          const errorMessage = error.response?.data?.message || 'حدث خطأ أثناء حذف المستخدم';
          setError(errorMessage);
          showNotification('حدث خطأ: ' + errorMessage, 'error');
        }
      } catch (checkError) {
        // إذا لم نتمكن من التحقق، نفترض أن الحذف فشل
        const errorMessage = error.response?.data?.message || 'حدث خطأ أثناء حذف المستخدم';
        setError(errorMessage);
        showNotification('حدث خطأ: ' + errorMessage, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSupervisorClick = async (employee: User) => {
    setSelectedUser(employee);
    
    const numericEmployeeId = typeof employee.id === 'string' ? parseInt(employee.id) : employee.id;
    
    console.log('Preparing to assign supervisor for employee:', {
      original: employee.id,
      converted: numericEmployeeId,
      originalType: typeof employee.id,
      convertedType: typeof numericEmployeeId
    });
    
    setAssignmentData({
      employeeId: numericEmployeeId,
      supervisorId: 0
    });
    
    try {
      setLoading(true);
      console.log('Fetching supervisors before opening assignment dialog...');
      
      const availableSupervisors = users.filter(u => 
        (u.role === 'supervisor' || u.role === 'admin') && u.id !== employee.id
      );
      
      if (availableSupervisors.length > 0) {
        console.log('Using supervisors from current users:', availableSupervisors);
        setSupervisors(availableSupervisors);
      }
    } catch (error) {
      console.error('Error preparing supervisor assignment:', error);
    } finally {
      setLoading(false);
      setAssignSupervisorDialogOpen(true);
    }
  };

  const handleAssignSupervisor = async () => {
    if (!assignmentData.supervisorId || !assignmentData.employeeId) {
      alert('الرجاء اختيار مشرف أولاً');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Assigning supervisor:', assignmentData);
      
      // Check if we're trying to assign the same supervisor
      const currentSupervisor = employeeSupervisors[assignmentData.employeeId];
      if (currentSupervisor && currentSupervisor.id === assignmentData.supervisorId) {
        // No change needed
        setAssignSupervisorDialogOpen(false);
        showNotification('المشرف المحدد معين بالفعل لهذا الموظف', 'info');
        setLoading(false);
        return; // Exit early
      }
      
      // تسجيل البيانات المرسلة
      console.log('Sending supervisor assignment with data:', assignmentData);
      
      try {
        // استخدام المسار الصحيح للـ API
        const assignResponse = await axios.post('https://elmanafea.online/api/users/assign-supervisor', assignmentData);
        console.log('Assignment response:', assignResponse.data);
        
        // تحديث واجهة المستخدم
        refreshData();
        
        // عرض رسالة نجاح
        showNotification('تم تعيين المشرف بنجاح', 'success');
        
        // إغلاق النافذة وإعادة التعيين
        setAssignSupervisorDialogOpen(false);
        setSelectedUser(null);
        setAssignmentData({
          employeeId: 0,
          supervisorId: 0
        });
      } catch (assignmentError: any) {
        // معالجة حالة "المشرف معيّن بالفعل" كنجاح وليس كخطأ
        console.error('Error in supervisor assignment:', assignmentError);
        
        const errorMessage = assignmentError.response?.data?.message || '';
        const errorStatus = assignmentError.response?.status;
        
        if ((errorStatus === 400 && errorMessage.includes('already assigned')) || 
            errorMessage.includes('No changes')) {
          // تعامل مع هذه الحالة كنجاح
          showNotification('المشرف المحدد معين بالفعل لهذا الموظف', 'info');
          
          // تحديث واجهة المستخدم على أي حال
          refreshData();
          
          // إغلاق النافذة
          setAssignSupervisorDialogOpen(false);
          setSelectedUser(null);
          setAssignmentData({
            employeeId: 0,
            supervisorId: 0
          });
        } else {
          // خطأ حقيقي
          setError(errorMessage || 'حدث خطأ أثناء تعيين المشرف');
          showNotification('حدث خطأ أثناء تعيين المشرف', 'error');
        }
      }
      
    } catch (error: any) {
      console.error('Error assigning supervisor:', error);
      
      // معالجة حالات الخطأ
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'حدث خطأ أثناء تعيين المشرف';
        
        if (errorMessage.includes('already assigned')) {
          showNotification('المشرف المحدد معين بالفعل لهذا الموظف', 'info');
          setAssignSupervisorDialogOpen(false);
        } else {
          setError(errorMessage);
          showNotification('حدث خطأ: ' + errorMessage, 'error');
        }
      } else {
        const errorMessage = error.response?.data?.message || 'حدث خطأ أثناء تعيين المشرف';
        setError(errorMessage);
        showNotification('حدث خطأ: ' + errorMessage, 'error');
      }
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

      {error && users.length === 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
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

      <Dialog open={userFormOpen} onClose={() => {
        // تأكد من مسح أي خطأ عند إغلاق نافذة الحوار
        setError(null);
        setUserFormOpen(false);
      }} maxWidth="sm" fullWidth>
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
                    onChange={(e) => {
                      userFormik.setFieldValue('role', e.target.value);
                    }}
                    label="الدور"
                  >
                    <MenuItem value="admin">مدير النظام</MenuItem>
                    <MenuItem value="supervisor">مشرف</MenuItem>
                    <MenuItem value="employee">موظف</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
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
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              // تأكد من مسح أي خطأ عند إغلاق نافذة الحوار
              setError(null);
              setUserFormOpen(false);
            }}>إلغاء</Button>
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

      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          // تأكد من مسح أي خطأ عند إغلاق نافذة الحوار
          setError(null);
          setDeleteDialogOpen(false);
        }}
      >
        <DialogTitle>تأكيد الحذف</DialogTitle>
        <DialogContent>
          <DialogContentText>
            هل أنت متأكد من رغبتك في حذف المستخدم "{selectedUser?.full_name}"؟
          </DialogContentText>
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setError(null);
            setDeleteDialogOpen(false);
          }}>إلغاء</Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained">
            {loading ? <CircularProgress size={24} /> : 'حذف'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={assignSupervisorDialogOpen}
        onClose={() => {
          // تأكد من مسح أي خطأ عند إغلاق نافذة الحوار
          setError(null);
          setAssignSupervisorDialogOpen(false);
        }}
      >
        <DialogTitle>تعيين مشرف</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
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
                    supervisorId: Number(e.target.value)
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
          <Button onClick={() => {
            // تأكد من مسح أي خطأ عند إغلاق نافذة الحوار
            setError(null);
            setAssignSupervisorDialogOpen(false);
          }}>إلغاء</Button>
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