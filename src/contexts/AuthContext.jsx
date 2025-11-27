import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('adminUser');
    const storedToken = localStorage.getItem('adminToken');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      const response = await authAPI.login({ email, password });

      if (response.success) {
        const { employee, token } = response;
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminUser', JSON.stringify(employee));
        setUser(employee);
        return { success: true };
      }
    } catch (err) {
      const errorMessage = err.error || 'Login failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setUser(null);
  };

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('adminUser', JSON.stringify(updatedUser));
  };

  const hasRole = (requiredRoles) => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    if (Array.isArray(requiredRoles)) {
      return requiredRoles.includes(user.role);
    }
    return user.role === requiredRoles;
  };

  const hasBusinessUnit = (businessUnit) => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    return user.businessUnit === businessUnit;
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    updateUser,
    hasRole,
    hasBusinessUnit,
    isAuthenticated: !!user,
    isSuperAdmin: user?.role === 'super_admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
