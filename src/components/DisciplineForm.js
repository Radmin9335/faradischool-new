import React, { useState, useEffect } from 'react';
import api from '../axiosConfig';
import './DisciplineForm.css';

const DisciplineForm = ({ selectedStudent, onVisitAdded }) => {
  const [formData, setFormData] = useState({
    student: '',
    record_type: '',
    description: '',
    sms_recipient: 'none',
    academic_year: '',
    record_date: new Date().toISOString().split('T')[0]
  });

  const [disciplineRecords, setDisciplineRecords] = useState([]);
  const [parentVisits, setParentVisits] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('new');
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // state جدید برای داده‌های مشترک با DisciplineList
  const [sharedStats, setSharedStats] = useState([]);

  // تابع برای دریافت داده‌ها از منبع DisciplineList
  const fetchSharedStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/discipline-records/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📊 آمار مشترک دریافت شد:', data);
        
        // پردازش داده بر اساس ساختار API - دقیقاً مثل DisciplineList
        let statsData = [];
        if (Array.isArray(data)) {
          statsData = data;
        } else if (data.results && Array.isArray(data.results)) {
          statsData = data.results;
        }
        
        setSharedStats(statsData);
      } else {
        console.error('❌ خطا در دریافت آمار مشترک:', response.status);
      }
    } catch (error) {
      console.error('🚨 خطا:', error);
    }
  };

  // فراخوانی تابع هنگام لود کامپوننت
  useEffect(() => {
    fetchSharedStats();
  }, []);

  // همچنین وقتی دانش‌آموز تغییر کرد، داده‌ها رو بروز کن
  useEffect(() => {
    if (formData.student) {
      fetchSharedStats();
    }
  }, [formData.student]);

  useEffect(() => {
    console.log('🔄 disciplineRecords UPDATED:', disciplineRecords.length, 'items');
  }, [disciplineRecords]);

  useEffect(() => {
    console.log('🔄 parentVisits UPDATED:', parentVisits.length, 'items');
  }, [parentVisits]);

  // تابع جدید برای پیدا کردن endpoint
  const findDisciplineEndpoint = async () => {
    const endpointsToTry = [
      '/discipline-records/',
      '/discipline-stats/',
      '/discipline/',
      '/disciplinary-records/'
    ];

    for (let endpoint of endpointsToTry) {
      try {
        const response = await api.get(endpoint);
        console.log(`✅ endpoint پیدا شد: ${endpoint}`);
        return endpoint;
      } catch (error) {
        console.log(`❌ ${endpoint} کار نکرد:`, error.response?.status);
      }
    }
    return null;
  };

  // useEffect جدید برای تست endpoint
  useEffect(() => {
    findDisciplineEndpoint();
  }, []);

  // دریافت سال‌های تحصیلی
  useEffect(() => {
    const fetchAcademicYears = async () => {
      try {
        const response = await api.get('/academic-years/');
        const data = response.data;
        if (Array.isArray(data)) {
          setAcademicYears(data);
        } else if (data && Array.isArray(data.results)) {
          setAcademicYears(data.results);
        } else if (data && typeof data === 'object') {
          setAcademicYears([data]);
        } else {
          setAcademicYears([]);
        }
      } catch (error) {
        console.error('Error fetching academic years:', error);
        setAcademicYears([]);
      }
    };
    fetchAcademicYears();
  }, []);

  // دریافت دانش‌آموزان
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await api.get('/students/');
        const data = response.data;
        if (Array.isArray(data)) {
          setStudents(data);
          setFilteredStudents(data);
        } else if (data && Array.isArray(data.results)) {
          setStudents(data.results);
          setFilteredStudents(data.results);
        } else if (data && typeof data === 'object') {
          const studentsArray = Object.values(data);
          setStudents(studentsArray);
          setFilteredStudents(studentsArray);
        } else {
          setStudents([]);
          setFilteredStudents([]);
        }
      } catch (error) {
        console.error('Error fetching students:', error);
        setStudents([]);
        setFilteredStudents([]);
      }
    };
    fetchStudents();
  }, []);

  // جستجوی دانش‌آموزان
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student => 
        student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.national_id?.includes(searchTerm)
      );
      setFilteredStudents(filtered);
    }
  }, [searchTerm, students]);

  // وقتی دانش‌آموز انتخاب شد، سوابق را بگیر
  useEffect(() => {
    if (formData.student) {
      fetchStudentRecords(formData.student);
    }
  }, [formData.student]);

  const fetchStudentRecords = async (studentId) => {
    if (!studentId) return;
    
    setIsLoading(true);
    setFetchError('');
    try {
      console.log('🔄 Fetching records for student:', studentId);
      
      // استفاده از Promise.allSettled برای مدیریت خطاهای جداگانه
      const [recordsResult, visitsResult] = await Promise.allSettled([
        api.get('/discipline-records/', { 
          params: { student: studentId }
        }).catch(error => {
          console.log('❌ خطا در discipline-records:', error.response?.status);
          // اگر 404 بود، endpoint دیگر را امتحان کن
          if (error.response?.status === 404) {
            return api.get('/discipline-stats/', { 
              params: { student: studentId }
            });
          }
          throw error;
        }),
        api.get('/parent-visits/', { 
          params: { student: studentId }
        })
      ]);
      
      console.log('📊 Records result:', recordsResult);
      console.log('📊 Visits result:', visitsResult);

      // پردازش نتیجه records
      if (recordsResult.status === 'fulfilled') {
        const recordsData = recordsResult.value.data;
        console.log('✅ Discipline records RAW:', recordsData);
        
        let recordsArray = [];
        if (Array.isArray(recordsData)) {
          recordsArray = recordsData;
        } else if (recordsData.results && Array.isArray(recordsData.results)) {
          recordsArray = recordsData.results;
        } else if (recordsData.data && Array.isArray(recordsData.data)) {
          recordsArray = recordsData.data;
        }
        
        console.log('🎯 Processed records array:', recordsArray);
        console.log('🎯 Array length:', recordsArray.length);
        
        setDisciplineRecords(recordsArray);
      } else {
        console.error('❌ Error fetching discipline records:', recordsResult.reason);
        setDisciplineRecords([]);
      }

      // پردازش نتیجه visits
      if (visitsResult.status === 'fulfilled') {
        const visitsData = visitsResult.value.data;
        console.log('✅ Parent visits:', visitsData);
        
        let visitsArray = [];
        if (Array.isArray(visitsData)) {
          visitsArray = visitsData;
        } else if (visitsData.results && Array.isArray(visitsData.results)) {
          visitsArray = visitsData.results;
        } else if (visitsData.data && Array.isArray(visitsData.data)) {
          visitsArray = visitsData.data;
        }
        
        console.log('🎯 FINAL parentVisits:', visitsArray);
        setParentVisits(visitsArray);
      } else {
        console.error('❌ Error fetching parent visits:', visitsResult.reason);
        setParentVisits([]);
      }
      
    } catch (error) {
      console.error('❌ General error fetching records:', error);
      setFetchError('خطا در دریافت اطلاعات دانش‌آموز');
      setDisciplineRecords([]);
      setParentVisits([]);
    } finally {
      setIsLoading(false);
    }
  };

  // انتخاب دانش‌آموز
  const handleStudentSelect = (studentId) => {
    console.log('🎯 Student selected:', studentId);
    setFormData(prev => ({
      ...prev,
      student: studentId
    }));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleRecordTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      record_type: prev.record_type === type ? '' : type
    }));
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // ✅ تابع بهبود یافته برای ثبت رکورد انضباطی
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.student) {
      alert('لطفاً ابتدا دانش‌آموز را انتخاب کنید');
      return;
    }

    if (!formData.record_type) {
      alert('لطفاً نوع رکورد را انتخاب کنید');
      return;
    }

    if (!formData.description.trim()) {
      alert('لطفاً توضیحات را وارد کنید');
      return;
    }

    // ✅ اعتبارسنجی تاریخ
    if (!formData.record_date) {
      alert('لطفاً تاریخ را انتخاب کنید');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (formData.record_date > today) {
      alert('تاریخ نمی‌تواند در آینده باشد!');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔄 Submitting discipline record:', formData);
      
      const submitData = {
        student: parseInt(formData.student),
        record_type: formData.record_type,
        description: formData.description,
        sms_recipient: formData.sms_recipient,
        record_date: formData.record_date
      };

      // تلاش برای endpoint های مختلف
      const endpointsToTry = [
        '/discipline-records/',
        '/discipline-stats/',
        '/discipline/'
      ];

      let success = false;
      let response;

      for (let endpoint of endpointsToTry) {
        try {
          console.log(`🔗 تلاش برای ثبت در: ${endpoint}`);
          response = await api.post(endpoint, submitData);
          
          if (response.status === 201 || response.status === 200) {
            console.log(`✅ ثبت موفق در ${endpoint}:`, response.data);
            success = true;
            break;
          }
        } catch (error) {
          console.log(`❌ خطا در ${endpoint}:`, error.response?.status);
          continue;
        }
      }

      if (success) {
        alert('رکورد انضباطی با موفقیت ثبت شد!');
        
        // ریست فرم
        setFormData(prev => ({
          ...prev,
          record_type: '',
          description: '',
          sms_recipient: 'none',
          record_date: new Date().toISOString().split('T')[0]
        }));
        
        // به‌روزرسانی لیست‌ها
        await fetchStudentRecords(formData.student);
        await fetchSharedStats(); // ✅ بروزرسانی داده‌های مشترک
      } else {
        throw new Error('هیچ endpoint معتبری برای ثبت پیدا نشد');
      }
      
    } catch (error) {
      console.error('❌ Error submitting record:', error);
      
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        alert('خطا در ثبت رکورد: ' + JSON.stringify(errorData));
      } else if (error.response?.status === 500) {
        alert('خطای سرور! لطفاً با مدیر سیستم تماس بگیرید.');
      } else {
        alert('خطا در ثبت رکورد انضباطی! endpoint مورد نظر پیدا نشد.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ تابع بهبود یافته برای ثبت مراجعه والدین
  const handleAddParentVisit = async () => {
    if (!formData.student) {
      alert('لطفاً ابتدا دانش‌آموز را انتخاب کنید');
      return;
    }

    const visitDate = prompt('تاریخ مراجعه والدین را وارد کنید (YYYY-MM-DD):');
    if (!visitDate) return;
    
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(visitDate)) {
      alert('فرمت تاریخ نامعتبر است! فرمت صحیح: YYYY-MM-DD');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (visitDate > today) {
      alert('تاریخ مراجعه نمی‌تواند در آینده باشد!');
      return;
    }

    const reason = prompt('دلیل مراجعه را وارد کنید:');
    if (!reason) return;

    const notes = prompt('توضیحات اضافی (اختیاری):') || '';

    try {
      console.log('🔄 Adding parent visit:', {
        student: formData.student,
        visit_date: visitDate,
        reason: reason,
        notes: notes
      });

      const response = await api.post('/parent-visits/', {
        student: parseInt(formData.student),
        visit_date: visitDate,
        reason: reason,
        notes: notes
      });

      console.log('✅ Parent visit response:', response.data);

      if (response.status === 201 || response.status === 200) {
        alert('مراجعه والدین ثبت شد!');
        
        await fetchStudentRecords(formData.student);
        
        if (onVisitAdded && typeof onVisitAdded === 'function') {
          console.log('📢 Calling onVisitAdded callback');
          onVisitAdded();
        }
      } else {
        throw new Error(`Status: ${response.status}`);
      }
      
    } catch (error) {
      console.error('❌ Error adding parent visit:', error);
      
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        alert('خطا در ثبت مراجعه: ' + JSON.stringify(errorData));
      } else if (error.response?.status === 500) {
        alert('خطای سرور! لطفاً با مدیر سیستم تماس بگیرید.');
      } else {
        alert('خطا در ثبت مراجعه!');
      }
    }
  };

  const deleteRecord = async (id, type) => {
    if (window.confirm('آیا از حذف این رکورد مطمئن هستید؟')) {
      try {
        if (type === 'discipline') {
          await api.delete(`/discipline-records/${id}/`);
          setDisciplineRecords(prev => prev.filter(record => record.id !== id));
          await fetchSharedStats(); // ✅ بروزرسانی داده‌های مشترک
        } else {
          await api.delete(`/parent-visits/${id}/`);
          setParentVisits(prev => prev.filter(visit => visit.id !== id));
        }
        alert('رکورد با موفقیت حذف شد!');
      } catch (error) {
        console.error('❌ Error deleting record:', error);
        alert('خطا در حذف رکورد!');
      }
    }
  };

  // محاسبه آمار
  const getStatistics = () => {
    const delays = disciplineRecords.filter(record => 
      record.record_type?.toLowerCase().includes('delay') || record.record_type?.includes('تاخیر')
    ).length;

    const absences = disciplineRecords.filter(record => 
      record.record_type?.toLowerCase().includes('absence') || record.record_type?.includes('غیبت')
    ).length;

    const totalVisits = parentVisits.length;
    
    const absenceDates = disciplineRecords
      .filter(record => record.record_type === 'absence')
      .map(record => record.record_date);

    return {
      delays,
      absences,
      totalVisits,
      absenceDates
    };
  };

  const statistics = getStatistics();
  const selectedStudentInfo = students.find(student => student.id == formData.student);

  return (
    <div className="discipline-form">
      <h3>سیستم انضباط دانش‌آموزی</h3>

      {/* بخش انتخاب سال تحصیلی */}
      <div className="form-group">
        <label>سال تحصیلی:</label>
        <select 
          name="academic_year"
          value={formData.academic_year || ''}
          onChange={handleInputChange}
          className="academic-year-select"
        >
          <option value="">انتخاب سال تحصیلی</option>
          {Array.isArray(academicYears) && academicYears.map(year => (
            <option key={year.id} value={year.id}>
              {year.year_name}
            </option>
          ))}
        </select>
      </div>

      {/* بخش انتخاب دانش‌آموز */}
      <div className="student-selection">
        <h4>انتخاب دانش‌آموز</h4>
        
        <div className="search-box">
          <input
            type="text"
            placeholder="جستجو بر اساس نام، نام خانوادگی یا شماره شناسنامه..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>

        <div className="students-list">
          {filteredStudents.map(student => (
            <div 
              key={student.id}
              className={`student-item ${formData.student == student.id ? 'selected' : ''}`}
              onClick={() => handleStudentSelect(student.id)}
            >
              <div className="student-info">
                <strong>{student.first_name} {student.last_name}</strong>
                <span>شماره شناسنامه: {student.national_id}</span>
                <span>کلاس: {student.class_obj?.class_number || '---'}</span>
              </div>
            </div>
          ))}
          {filteredStudents.length === 0 && (
            <p className="no-data">دانش‌آموزی یافت نشد</p>
          )}
        </div>

        {selectedStudentInfo && (
          <div className="selected-student-info">
            <strong>دانش‌آموز انتخاب شده:</strong> 
            {selectedStudentInfo.first_name} {selectedStudentInfo.last_name} - 
            شماره شناسنامه: {selectedStudentInfo.national_id}
          </div>
        )}
      </div>

      {/* جدول آمار */}
      {selectedStudentInfo && (
        <div className="statistics-table">
          <h4>آمار انضباطی دانش‌آموز</h4>
          <table className="stats-table">
            <thead>
              <tr>
                <th>تعداد تاخیرها</th>
                <th>تعداد غیبت‌ها</th>
                <th>تعداد مراجعات والدین</th>
                <th>تاریخ‌های غیبت</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{statistics.delays} مورد</td>
                <td>{statistics.absences} مورد</td>
                <td>{statistics.totalVisits} مورد</td>
                <td>
                  {statistics.absenceDates.length > 0 ? 
                    statistics.absenceDates.join('، ') : 
                    'غیبتی ثبت نشده'
                  }
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {fetchError && (
        <div className="error-message" style={{color: 'red', padding: '10px', background: '#ffe6e6', borderRadius: '4px', margin: '10px 0'}}>
          {fetchError}
        </div>
      )}

      <div className="tabs">
        <button 
          className={activeTab === 'new' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('new')}
        >
          ثبت مورد جدید
        </button>
        <button 
          className={activeTab === 'history' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('history')}
        >
          سوابق انضباطی
        </button>
        <button 
          className={activeTab === 'visits' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('visits')}
        >
          مراجعات والدین
        </button>
      </div>

      {activeTab === 'new' && (
        <form onSubmit={handleSubmit} className="form">
          {/* فیلد تاریخ - اضافه شد */}
          <div className="form-group">
            <label htmlFor="record_date">تاریخ رویداد *</label>
            <input
              type="date"
              id="record_date"
              name="record_date"
              value={formData.record_date}
              onChange={handleInputChange}
              max={new Date().toISOString().split('T')[0]}
              required
              className="date-input"
            />
            <small style={{color: '#666', fontSize: '12px'}}>
              تاریخ تاخیر یا غیبت دانش‌آموز
            </small>
          </div>

          <div className="form-group">
            <label>نوع رکورد:</label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.record_type === 'delay'}
                  onChange={() => handleRecordTypeChange('delay')}
                />
                <span className="checkmark"></span>
                تاخیر
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.record_type === 'absence'}
                  onChange={() => handleRecordTypeChange('absence')}
                />
                <span className="checkmark"></span>
                غیبت
              </label>
            </div>
            {!formData.record_type && (
              <span className="error-text">لطفاً یک نوع انتخاب کنید</span>
            )}
          </div>

          <div className="form-group">
            <label>توضیحات:</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              required
              placeholder="توضیحات کامل را وارد کنید..."
            />
          </div>

          <div className="form-group">
            <label>ارسال پیامک به:</label>
            <select
              name="sms_recipient"
              value={formData.sms_recipient}
              onChange={handleInputChange}
            >
              <option value="none">ارسال نشود</option>
              <option value="father">پدر</option>
              <option value="mother">مادر</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="submit-btn"
            disabled={isLoading || !formData.student}
          >
            {isLoading ? 'در حال ثبت...' : 'ثبت رکورد انضباطی'}
          </button>
        </form>
      )}

      {activeTab === 'history' && (
        <div className="records-section">
          <h4>سوابق انضباطی {selectedStudentInfo && `- ${selectedStudentInfo.first_name} ${selectedStudentInfo.last_name}`}</h4>
          
          <div className="table-container">
            <table className="records-table">
              <thead>
                <tr>
                  <th>ردیف</th>
                  <th>تاریخ</th>
                  <th>نوع</th>
                  <th>توضیحات</th>
                  <th>وضعیت پیامک</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(disciplineRecords) && disciplineRecords.length > 0 ? (
                  disciplineRecords.map((record, index) => (
                    <tr key={record.id}>
                      <td>{index + 1}</td>
                      <td>{record.record_date}</td>
                      <td>
                        <span className={`type-badge ${record.record_type}`}>
                          {record.record_type === 'delay' ? 'تاخیر' : 'غیبت'}
                        </span>
                      </td>
                      <td className="description-cell">{record.description}</td>
                      <td>
                        <span className={`sms-status ${record.sms_sent ? 'sent' : 'not-sent'}`}>
                          {record.sms_sent ? '✅ ارسال شد' : '❌ ارسال نشد'}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="delete-btn"
                          onClick={() => deleteRecord(record.id, 'discipline')}
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="no-data">
                      {formData.student ? 'مورد انضباطی ثبت نشده است' : 'لطفاً دانش‌آموز را انتخاب کنید'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'visits' && (
        <div className="visits-section">
          <div className="visits-header">
            <h4>مراجعات والدین {selectedStudentInfo && `- ${selectedStudentInfo.first_name} ${selectedStudentInfo.last_name}`}</h4>
            <button 
              onClick={handleAddParentVisit} 
              className="add-visit-btn"
              disabled={!formData.student}
            >
              + ثبت مراجعه جدید
            </button>
          </div>
          
          <div className="table-container">
            <table className="visits-table">
              <thead>
                <tr>
                  <th>ردیف</th>
                  <th>تاریخ مراجعه</th>
                  <th>دلیل مراجعه</th>
                  <th>توضیحات</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(parentVisits) && parentVisits.length > 0 ? (
                  parentVisits.map((visit, index) => (
                    <tr key={visit.id}>
                      <td>{index + 1}</td>
                      <td>{visit.visit_date}</td>
                      <td>{visit.reason}</td>
                      <td className="description-cell">{visit.notes || '---'}</td>
                      <td>
                        <button 
                          className="delete-btn"
                          onClick={() => deleteRecord(visit.id, 'visit')}
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="no-data">
                      {formData.student ? 'مراجعه‌ای ثبت نشده است' : 'لطفاً دانش‌آموز را انتخاب کنید'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* بخش دیباگ - با منبع DisciplineList */}
      <div className="debug-section" style={{fontSize: '12px', color: '#666', marginTop: '20px', padding: '10px', background: '#f5f5f5'}}>
        <strong>وضعیت دیباگ (منبع مشترک با DisciplineList):</strong><br/>
        دانش‌آموز انتخاب شده: {formData.student || '---'}<br/>
        
        {/* استفاده از sharedStats به جای disciplineRecords */}
        <strong>تعداد کل سوابق انضباطی:</strong> {Array.isArray(sharedStats) ? sharedStats.length : 'خطا'} مورد<br/>
        
        {/* مقایسه با state داخلی */}
        <strong>مقایسه:</strong><br/>
        - منبع مشترک: {Array.isArray(sharedStats) ? sharedStats.length : 'خطا'} مورد<br/>
        - state داخلی: {Array.isArray(disciplineRecords) ? disciplineRecords.length : 'خطا'} مورد
        
        {formData.student && (
          <>
            <br/><strong>دانش‌آموز انتخاب شده (ID: {formData.student}):</strong><br/>
            - در منبع مشترک: {
              sharedStats.filter(stat => stat.student == formData.student).length
            } مورد<br/>
            - در state داخلی: {
              disciplineRecords.filter(record => record.student == formData.student).length
            } مورد
          </>
        )}
        
        مراجعات والدین: {Array.isArray(parentVisits) ? parentVisits.length : 'خطا'} مورد<br/>
        دانش‌آموزان: {students.length} مورد
      </div>
    </div>
  );
};

export default DisciplineForm;