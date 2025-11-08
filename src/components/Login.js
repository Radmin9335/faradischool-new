import React, { useState } from 'react';
import api from '../axiosConfig';
import './Login.css';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!username || !password) {
    alert('لطفاً نام کاربری و رمز عبور را وارد کنید');
    return;
  }

  setIsLoading(true);
  
  try {
    // ✅ تغییر این خط - حذف /api/ چون در axiosConfig اضافه میشه
    const response = await api.post('/api/token/', { 
      username, 
      password 
    });

    // دریافت توکن‌ها
    const { access, refresh } = response.data;

    // ذخیره در localStorage
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);

    onLogin(access, refresh);
    
  } catch (error) {
    console.error('Login error:', error);
    
    if (error.response?.status === 401) {
      alert('نام کاربری یا رمز عبور اشتباه است!');
    } else if (error.response?.status >= 500) {
      alert('خطای سرور! لطفاً稍后再试.');
    } else {
      alert('خطا در ارتباط با سرور!');
    }
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>سامانه مدیریت مدرسه</h2>
        
        <div className="form-group">
          <label>نام کاربری:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        
        <div className="form-group">
          <label>رمز عبور:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'در حال ورود...' : 'ورود'}
        </button>
      </form>
    </div>
  );
};

export default Login;