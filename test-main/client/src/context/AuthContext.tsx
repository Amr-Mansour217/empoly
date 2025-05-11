import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  username: string;
  full_name: string;
  role: 'admin' | 'supervisor' | 'employee';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
  error: null,
  clearError: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          // Configure axios to use token in all requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Fetch current user
          const response = await axios.get('/api/auth/me');
          setUser(response.data.user);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Intentando iniciar sesión con:', { username, password: '******' });
      
      const response = await axios.post('/api/auth/login', { username, password });
      console.log('Respuesta del servidor:', response.data);
      
      const { token, user } = response.data;
      
      // Save token to localStorage
      localStorage.setItem('token', token);
      
      // Set token for all future axios requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setToken(token);
      setUser(user);
      setIsAuthenticated(true);
      
      // Redirect based on user role
      if (user.role === 'admin' || user.role === 'supervisor') {
        navigate('/supervisor/reports');
      } else {
        navigate('/employee');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.response) {
        // El servidor respondió con un código de estado diferente de 2xx
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
        
        setError(error.response.data?.message || 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.');
      } else if (error.request) {
        // La solicitud se realizó pero no se recibió respuesta
        console.error('No response received:', error.request);
        setError('لم يتم استلام استجابة من الخادم. تأكد من أن الخادم يعمل.');
        throw error; // Relanzamos el error para que la página de login pueda detectar problemas de red
      } else {
        // Algo sucedió en la configuración de la solicitud que desencadenó un error
        console.error('Request error:', error.message);
        setError(`حدث خطأ أثناء الاتصال: ${error.message}`);
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        login,
        logout,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 