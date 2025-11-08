import React, { useState } from 'react';
import api from '../axiosConfig';
import './PrintReport.css';

const PrintReport = () => {
  const [nationalId, setNationalId] = useState('');
  const [student, setStudent] = useState(null);
  const [disciplineRecords, setDisciplineRecords] = useState([]);
  const [parentVisits, setParentVisits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const searchStudent = async () => {
    if (!nationalId.trim()) {
      alert('لطفاً شماره ملی را وارد کنید');
      return;
    }

    setIsLoading(true);
    setError('');
    setStudent(null);
    setDisciplineRecords([]);
    setParentVisits([]);

    try {
      console.log('🔍 Searching for student with national_id:', nationalId);
      
      // جستجو در لیست دانش‌آموزان
      const response = await api.get('/students/');
      console.log('📋 All students response:', response.data);
      
      let students = [];
      if (Array.isArray(response.data)) {
        students = response.data;
      } else if (response.data && Array.isArray(response.data.results)) {
        students = response.data.results;
      } else if (response.data && typeof response.data === 'object') {
        students = Object.values(response.data);
      }

      console.log('📊 Processed students list:', students);
      
      // جستجوی دانش‌آموز
      const foundStudent = students.find(s => 
        s.national_id && s.national_id.toString() === nationalId.trim()
      );

      console.log('🎯 Found student:', foundStudent);

      if (foundStudent) {
        setStudent(foundStudent);
        
        // دریافت سوابق انضباطی
        try {
          const recordsResponse = await api.get('/discipline-records/', {
            params: { student: foundStudent.id }
          });
          console.log('📋 Discipline records:', recordsResponse.data);
          setDisciplineRecords(Array.isArray(recordsResponse.data) ? recordsResponse.data : []);
        } catch (recordsError) {
          console.error('Error fetching discipline records:', recordsError);
          setDisciplineRecords([]);
        }

        // دریافت مراجعات والدین
        try {
          const visitsResponse = await api.get('/parent-visits/', {
            params: { student: foundStudent.id }
          });
          console.log('📋 Parent visits:', visitsResponse.data);
          setParentVisits(Array.isArray(visitsResponse.data) ? visitsResponse.data : []);
        } catch (visitsError) {
          console.error('Error fetching parent visits:', visitsError);
          setParentVisits([]);
        }

      } else {
        setError('دانش‌آموزی با این شماره ملی یافت نشد');
        console.log('❌ Student not found. Available national_ids:', students.map(s => s.national_id));
      }

    } catch (error) {
      console.error('❌ Error searching student:', error);
      console.error('Error response:', error.response?.data);
      setError('خطا در جستجوی دانش‌آموز');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getClassInfo = (classObj) => {
    if (!classObj || typeof classObj !== 'object') return '---';
    
    const grade = classObj.grade || '---';
    const field = classObj.field || '---';
    const classNumber = classObj.class_number || '---';
    
    const fieldMap = {
      'network': 'شبکه و نرم‌افزار',
      'computer': 'رایانه',
      'architecture': 'معماری داخلی',
      'accounting': 'حسابداری'
    };
    
    const gradeMap = {
      '10': 'دهم',
      '11': 'یازدهم',
      '12': 'دوازدهم'
    };
    
    const fieldDisplay = fieldMap[field] || field;
    const gradeDisplay = gradeMap[grade] || grade;
    
    return `پایه ${gradeDisplay} - ${fieldDisplay} - کلاس ${classNumber}`;
  };

  return (
    <div className="print-report">
      <div className="report-header">
        <h3>گزارش‌گیری و پرینت</h3>
        <p>برای دریافت گزارش دانش‌آموز، شماره ملی را وارد کنید</p>
      </div>

      <div className="search-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="شماره ملی دانش‌آموز"
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
            className="search-input"
          />
          <button 
            onClick={searchStudent} 
            disabled={isLoading}
            className="search-btn"
          >
            {isLoading ? 'در حال جستجو...' : 'جستجو'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {student && (
        <div className="report-content" id="report-content">
          {/* هدر گزارش */}
          <div className="report-title">
            <h2>گزارش کامل دانش‌آموز</h2>
            <div className="school-info">
              <p>مدرسه: دبیرستان نمونه</p>
              <p>تاریخ گزارش: {new Date().toLocaleDateString('fa-IR')}</p>
            </div>
          </div>

          {/* اطلاعات دانش‌آموز */}
          <div className="student-info-section">
            <h4>اطلاعات دانش‌آموز</h4>
            <table className="info-table">
              <tbody>
                <tr>
                  <td><strong>نام و نام خانوادگی:</strong></td>
                  <td>{student.first_name} {student.last_name}</td>
                  <td><strong>شماره ملی:</strong></td>
                  <td>{student.national_id}</td>
                </tr>
                <tr>
                  <td><strong>پایه و کلاس:</strong></td>
                  <td colSpan="3">{getClassInfo(student.class_obj)}</td>
                </tr>
                <tr>
                  <td><strong>نام پدر:</strong></td>
                  <td colSpan="3">{student.father_name || '---'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* سوابق انضباطی */}
          <div className="discipline-section">
            <h4>سوابق انضباطی</h4>
            {disciplineRecords.length > 0 ? (
              <table className="records-table">
                <thead>
                  <tr>
                    <th>تاریخ</th>
                    <th>نوع</th>
                    <th>توضیحات</th>
                    <th>وضعیت پیامک</th>
                  </tr>
                </thead>
                <tbody>
                  {disciplineRecords.map(record => (
                    <tr key={record.id}>
                      <td>{record.record_date}</td>
                      <td>{record.record_type === 'delay' ? 'تاخیر' : 'غیبت'}</td>
                      <td>{record.description}</td>
                      <td>{record.sms_sent ? 'ارسال شد' : 'ارسال نشد'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-data">مورد انضباطی ثبت نشده است</p>
            )}
          </div>

          {/* مراجعات والدین */}
          <div className="visits-section">
            <h4>مراجعات والدین</h4>
            {parentVisits.length > 0 ? (
              <table className="visits-table">
                <thead>
                  <tr>
                    <th>تاریخ مراجعه</th>
                    <th>دلیل مراجعه</th>
                    <th>توضیحات</th>
                  </tr>
                </thead>
                <tbody>
                  {parentVisits.map(visit => (
                    <tr key={visit.id}>
                      <td>{visit.visit_date}</td>
                      <td>{visit.reason}</td>
                      <td>{visit.notes || '---'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-data">مراجعه والدین ثبت نشده است</p>
            )}
          </div>

          {/* آمار */}
          <div className="statistics-section">
            <h4>آمار کلی</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-number">{disciplineRecords.filter(r => r.record_type === 'delay').length}</span>
                <span className="stat-label">تعداد تاخیرها</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{disciplineRecords.filter(r => r.record_type === 'absence').length}</span>
                <span className="stat-label">تعداد غیبت‌ها</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{parentVisits.length}</span>
                <span className="stat-label">مراجعه والدین</span>
              </div>
            </div>
          </div>

          {/* دکمه پرینت */}
          <div className="print-actions no-print">
            <button onClick={handlePrint} className="print-btn">
              🖨️ پرینت گزارش
            </button>
          </div>
        </div>
      )}

      {/* بخش دیباگ */}
      <div className="debug-section no-print" style={{fontSize: '12px', color: '#666', marginTop: '20px', padding: '10px', background: '#f5f5f5'}}>
        <strong>وضعیت دیباگ گزارش‌گیری:</strong><br/>
        شماره ملی جستجو شده: {nationalId}<br/>
        دانش‌آموز یافت شده: {student ? 'بله' : 'خیر'}<br/>
        تعداد سوابق انضباطی: {disciplineRecords.length}<br/>
        تعداد مراجعات: {parentVisits.length}
      </div>
    </div>
  );
};

export default PrintReport;