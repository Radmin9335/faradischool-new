// components/DisciplineList.js
import React, { useState, useEffect } from 'react';

const DisciplineList = ({ refreshTrigger }) => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDisciplineStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/discipline-records/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📊 آمار انضباطی دریافت شد:', data);
        
        // پردازش داده بر اساس ساختار API
        let statsData = [];
        if (Array.isArray(data)) {
          statsData = data;
        } else if (data.results && Array.isArray(data.results)) {
          statsData = data.results;
        }
        
        setStats(statsData);
      } else {
        console.error('❌ خطا در دریافت آمار انضباطی:', response.status);
      }
    } catch (error) {
      console.error('🚨 خطا:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisciplineStats();
  }, [refreshTrigger]);

  // تابع برای نمایش نوع رکورد به فارسی
  const getRecordTypeText = (record) => {
    const recordType = record.record_type || record.type;
    
    if (recordType === 'delay' || recordType === 'تاخیر') {
      return 'تاخیر';
    } else if (recordType === 'absence' || recordType === 'غیبت') {
      return 'غیبت';
    } else {
      return recordType || 'انضباطی';
    }
  };

  // تابع برای استایل نوع رکورد
  const getRecordTypeClass = (record) => {
    const recordType = record.record_type || record.type;
    
    if (recordType === 'delay' || recordType === 'تاخیر') {
      return 'type-delay';
    } else if (recordType === 'absence' || recordType === 'غیبت') {
      return 'type-absence';
    } else {
      return 'type-default';
    }
  };

  if (loading) {
    return <div className="loading">در حال دریافت داده‌ها...</div>;
  }

  return (
    <div className="discipline-list">
      <h3>لیست آمار انضباطی ثبت شده ({stats.length} مورد)</h3>
      
      <button onClick={fetchDisciplineStats} className="refresh-btn">
        بروزرسانی لیست
      </button>

      {stats.length === 0 ? (
        <div className="no-data">هیچ موردی ثبت نشده است</div>
      ) : (
        <table className="stats-table">
          <thead>
            <tr>
              <th>دانش‌آموز</th>
              <th>تاریخ</th>
              <th>نوع</th>
              <th>توضیحات</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((stat) => (
              <tr key={stat.id}>
                <td>{stat.student_name || stat.student?.name || `دانش‌آموز ${stat.student}`}</td>
                <td>{stat.record_date || stat.date}</td>
                <td>
                  <span className={`type-badge ${getRecordTypeClass(stat)}`}>
                    {getRecordTypeText(stat)}
                  </span>
                </td>
                <td>{stat.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <style jsx>{`
        .discipline-list {
          padding: 20px;
          font-family: 'Tahoma', 'Arial', sans-serif;
        }
        
        .refresh-btn {
          background: #4CAF50;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          margin-bottom: 15px;
        }
        
        .refresh-btn:hover {
          background: #45a049;
        }
        
        .stats-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        
        .stats-table th,
        .stats-table td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: right;
        }
        
        .stats-table th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        
        .stats-table tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        
        .stats-table tr:hover {
          background-color: #f0f0f0;
        }
        
        .type-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
        }
        
        .type-delay {
          background-color: #fff3cd;
          color: #856404;
          border: 1px solid #ffeaa7;
        }
        
        .type-absence {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
        
        .type-default {
          background-color: #d1ecf1;
          color: #0c5460;
          border: 1px solid #bee5eb;
        }
        
        .loading {
          text-align: center;
          padding: 20px;
          color: #666;
        }
        
        .no-data {
          text-align: center;
          padding: 20px;
          color: #999;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default DisciplineList;