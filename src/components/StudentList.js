import React, { useState, useEffect } from 'react';
import api from '../axiosConfig';
import './StudentList.css';

const StudentList = ({ onStudentSelect, refreshTrigger }) => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudents();
  }, [refreshTrigger]);

  const fetchStudents = async () => {
    setIsLoading(true);
    setError('');
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
      setError('خطا در دریافت لیست دانش‌آموزان');
    } finally {
      setIsLoading(false);
    }
  };

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

  const getClassInfo = (student) => {
    if (!student.class_obj || typeof student.class_obj !== 'object') {
      return '---';
    }
    
    const classObj = student.class_obj;
    const grade = classObj.grade || '---';
    const field = classObj.field || '---';
    const classNumber = classObj.class_number || '---';
    
    const fieldMap = {
      'network': 'شبکه و نرم‌افزار',
      'computer': 'رایانه',
      'architecture': 'معماری داخلی',
      'accounting': 'حسابداری'
    };
    
    const fieldDisplay = fieldMap[field] || field;
    
    const gradeMap = {
      '10': 'دهم',
      '11': 'یازدهم', 
      '12': 'دوازدهم'
    };
    
    const gradeDisplay = gradeMap[grade] || grade;
    
    return `پایه ${gradeDisplay} - ${fieldDisplay} - کلاس ${classNumber}`;
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDelete = async (studentId) => {
    if (window.confirm('آیا از حذف این دانش‌آموز مطمئن هستید؟')) {
      try {
        await api.delete(`/students/${studentId}/`);
        alert('دانش‌آموز با موفقیت حذف شد!');
        fetchStudents();
      } catch (error) {
        console.error('Error deleting student:', error);
        alert('خطا در حذف دانش‌آموز!');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="student-list">
        <div className="loading">در حال بارگذاری...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-list">
        <div className="error-message">{error}</div>
        <button onClick={fetchStudents} className="retry-btn">
          تلاش مجدد
        </button>
      </div>
    );
  }

  return (
    <div className="student-list">
      <div className="list-header">
        <h3>لیست دانش‌آموزان</h3>
        <div className="header-actions">
          <button onClick={fetchStudents} className="refresh-btn">
            🔄 به‌روزرسانی لیست
          </button>
        </div>
      </div>
      
      <div className="search-box">
        <input
          type="text"
          placeholder="جستجو بر اساس نام، نام خانوادگی یا شماره شناسنامه..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>

      <div className="students-count">
        تعداد دانش‌آموزان: {filteredStudents.length}
      </div>

      <div className="students-table">
        <table>
          <thead>
            <tr>
              <th>ردیف</th>
              <th>نام</th>
              <th>نام خانوادگی</th>
              <th>شماره شناسنامه</th>
              <th>نام پدر</th>
              <th>شماره پدر</th>
              <th>شماره مادر</th>
              <th>کلاس</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(filteredStudents) && filteredStudents.length > 0 ? (
              filteredStudents.map((student, index) => (
                <tr key={student.id}>
                  <td>{index + 1}</td>
                  <td>{student.first_name || '-'}</td>
                  <td>{student.last_name || '-'}</td>
                  <td>{student.national_id || '-'}</td>
                  <td>{student.father_name || '-'}</td>
                  <td>{student.father_phone || '-'}</td>
                  <td>{student.mother_phone || '-'}</td>
                  <td>
                    {getClassInfo(student)}
                  </td>
                  <td>
                    <button 
                      onClick={() => handleDelete(student.id)}
                      className="delete-btn"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="no-data">
                  {searchTerm ? 'دانش‌آموزی یافت نشد' : 'دانش‌آموزی ثبت نشده است'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentList;