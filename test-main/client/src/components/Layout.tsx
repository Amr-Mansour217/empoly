import React from 'react';
import { 
  AppBar, 
  Box, 
  Toolbar, 
  Typography, 
  Container, 
  Button, 
  IconButton, 
  Avatar, 
  Menu, 
  MenuItem, 
  Divider 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MenuIcon from '@mui/icons-material/Menu';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMobileMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchorEl(null);
  };

  const handleProfile = () => {
    handleClose();
    navigate('/profile');
  };

  const handleLogout = () => {
    handleClose();
    logout();
  };

  const navigateToDashboard = () => {
    if (user?.role === 'admin') {
      navigate('/admin');
    } else if (user?.role === 'supervisor') {
      navigate('/supervisor');
    } else {
      navigate('/employee');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            noWrap
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={navigateToDashboard}
          >
            {title}
          </Typography>
          
          {/* Desktop menu */}
          <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
            {user?.role === 'admin' && (
              <>
                <Button color="inherit" onClick={() => navigate('/admin')}>
                  التقارير
                </Button>
                <Button color="inherit" onClick={() => navigate('/supervisor/reports')}>
                  لوحة التحكم
                </Button>
                <Button color="inherit" onClick={() => navigate('/admin/users')}>
                  إدارة المستخدمين
                </Button>
              </>
            )}
            
            {user?.role === 'supervisor' && (
              <>
                <Button color="inherit" onClick={() => navigate('/supervisor')}>
                  لوحة التحكم
                </Button>
                <Button color="inherit" onClick={() => navigate('/supervisor/reports')}>
                  التقارير
                </Button>
              </>
            )}
            
            {user?.role === 'employee' && (
              <>
                <Button color="inherit" onClick={() => navigate('/employee')}>
                  الرئيسية
                </Button>
                <Button color="inherit" onClick={() => navigate('/employee/report')}>
                  التقرير اليومي
                </Button>
              </>
            )}
            
            <IconButton
              size="large"
              onClick={handleMenu}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.dark' }}>
                {user?.full_name?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={handleProfile}>
                <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                الملف الشخصي
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                تسجيل الخروج
              </MenuItem>
            </Menu>
          </Box>
          
          {/* Mobile menu */}
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              onClick={handleMobileMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={mobileMenuAnchorEl}
              open={Boolean(mobileMenuAnchorEl)}
              onClose={handleMobileMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              {user?.role === 'admin' && (
                <>
                  <MenuItem onClick={() => { navigate('/admin'); handleMobileMenuClose(); }}>
                    لوحة التحكم
                  </MenuItem>
                  <MenuItem onClick={() => { navigate('/admin/users'); handleMobileMenuClose(); }}>
                    إدارة المستخدمين
                  </MenuItem>
                  <MenuItem onClick={() => { navigate('/supervisor/reports'); handleMobileMenuClose(); }}>
                    التقارير
                  </MenuItem>
                </>
              )}
              
              {user?.role === 'supervisor' && (
                <>
                  <MenuItem onClick={() => { navigate('/supervisor'); handleMobileMenuClose(); }}>
                    لوحة التحكم
                  </MenuItem>
                  <MenuItem onClick={() => { navigate('/supervisor/reports'); handleMobileMenuClose(); }}>
                    التقارير
                  </MenuItem>
                </>
              )}
              
              {user?.role === 'employee' && (
                <>
                  <MenuItem onClick={() => { navigate('/employee'); handleMobileMenuClose(); }}>
                    الرئيسية
                  </MenuItem>
                  <MenuItem onClick={() => { navigate('/employee/report'); handleMobileMenuClose(); }}>
                    التقرير اليومي
                  </MenuItem>
                </>
              )}
              
              <Divider />
              <MenuItem onClick={() => { navigate('/profile'); handleMobileMenuClose(); }}>
                <PersonIcon fontSize="small" sx={{ ml: 1 }} />
                الملف الشخصي
              </MenuItem>
              <MenuItem onClick={() => { logout(); handleMobileMenuClose(); }}>
                <LogoutIcon fontSize="small" sx={{ ml: 1 }} />
                تسجيل الخروج
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Container component="main" sx={{ mt: 4, mb: 4, flex: 1 }}>
        {children}
      </Container>
      
      <Box component="footer" sx={{ py: 3, bgcolor: 'background.paper', textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          &copy; {new Date().getFullYear()} نظام متابعة أداء العاملين
        </Typography>
      </Box>
    </Box>
  );
};

export default Layout; 