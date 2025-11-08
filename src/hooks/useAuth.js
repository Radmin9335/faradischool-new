import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('access_token');
    
    if (token) {
      // می‌توانید اینجا اعتبار توکن رو هم چک کنید
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
    
    setLoading(false);
  };

  const login = (token, refreshToken) => {
    localStorage.setItem('access_token', token);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
    setIsAuthenticated(true);
    navigate('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsAuthenticated(false);
    navigate('/login');
  };

  return { isAuthenticated, loading, login, logout, checkAuth };
};