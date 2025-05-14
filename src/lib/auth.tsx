import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from './api';
import { toast } from 'sonner';

// Types
type User = {
  customer_id: number;
  customer_email_address: string;
  customer_firstname: string;
  customer_lastname: string;
  [key: string]: any;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: any) => Promise<void>;
  logout: () => void;
};

// Create context with a meaningful default value
const AuthContext = React.createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => { throw new Error('AuthContext not initialized') },
  register: async () => { throw new Error('AuthContext not initialized') },
  logout: () => { throw new Error('AuthContext not initialized') },
});

// Provider component - using function declaration for better HMR
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const navigate = useNavigate();

  React.useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = React.useCallback(async (email: string, password: string): Promise<User> => {
    try {
      console.log(`Attempting login for user: ${email}`);
      const response = await authApi.login({ email, password });
      console.log('Login response:', response);
      
      if (!response.user || !response.access_token) {
        throw new Error('Invalid response format from login endpoint');
      }
      
      setUser(response.user);
      
      // Don't auto-navigate; let the Login component determine where to go
      return response.user;
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Extract meaningful error message
      let errorMessage = 'Login failed. Please try again.';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  const register = React.useCallback(async (data: any) => {
    try {
      console.log('Registering with data:', JSON.stringify(data, null, 2));
      const response = await authApi.register(data);
      console.log('Registration response:', response);
      
      toast.success('Account created successfully! Please login.');
      // We'll let the signup component handle navigation
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Extract meaningful error message
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map((err: any) => 
            typeof err === 'string' ? err : err.msg || JSON.stringify(err)
          ).join(', ');
        } else if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      throw error;
    }
  }, [navigate]);

  const logout = React.useCallback(() => {
    authApi.logout();
    setUser(null);
    navigate('/auth/login');
  }, [navigate]);

  const value = React.useMemo(() => ({
    user,
    isLoading,
    login,
    register,
    logout,
  }), [user, isLoading, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook - using function declaration for better HMR
function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Named exports only - no default exports
export { AuthProvider, useAuth };
export type { User, AuthContextType }; 