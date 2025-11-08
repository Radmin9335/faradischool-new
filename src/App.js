import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    
    // اگر توکن داریم اما رفرش توکن نداریم، لاگ اوت کنیم
    if (token && !refreshToken) {
      localStorage.removeItem('access_token');
      setIsLoggedIn(false);
    } else if (token && refreshToken) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (accessToken, refreshToken) => {
    // ذخیره ایمن توکن‌ها
    try {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Error saving tokens:', error);
      alert('خطا در ذخیره اطلاعات لاگین');
    }
  };

  const handleLogout = () => {
    // پاک کردن همه چیز
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiry');
    setIsLoggedIn(false);
  };

  return (
    <div className="App">
      {!isLoggedIn ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Dashboard onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;