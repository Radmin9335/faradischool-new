import React, { useState, useEffect } from 'react';
import api from '../axiosConfig';
import './StudentForm.css';

const StudentForm = ({ onStudentAdded }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    national_id: '',
    father_name: '',
    father_phone: '',
    mother_phone: '',
    class_obj: ''
  });

  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [filters, setFilters] = useState({
    academic_year: '',
    grade: '',
    field: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [excelFile, setExcelFile] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [showImportForm, setShowImportForm] = useState(false);

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
          console.error('Unexpected data format:', data);
          setAcademicYears([]);
        }
        
      } catch (error) {
        console.error('Error fetching academic years:', error);
        alert('خطا در دریافت سال‌های تحصیلی');
        setAcademicYears([]);
      }
    };
    fetchAcademicYears();
  }, []);

  // دریافت کلاس‌ها بر اساس فیلتر
  useEffect(() => {
    const fetchClasses = async () => {
      console.log('🔄 Fetching classes with filters:', filters);
      
      if (filters.academic_year && filters.grade && filters.field) {
        setIsLoading(true);
        try {
          const response = await api.get('/classes/by_grade_field/', {
            params: {
              academic_year: filters.academic_year,
              grade: filters.grade,
              field: filters.field
            }
          });
          
          console.log('✅ Classes received:', response.data);
          
          const data = response.data;
          if (Array.isArray(data)) {
            setClasses(data);
          } else if (data && Array.isArray(data.results)) {
            setClasses(data.results);
          } else if (data && typeof data === 'object') {
            setClasses([data]);
          } else {
            console.warn('⚠️ Unexpected data format, setting empty array');
            setClasses([]);
          }
          
          setErrors(prev => ({ ...prev, classes: '' }));
        } catch (error) {
          console.error('❌ Error fetching classes:', error);
          console.error('Error details:', error.response?.data);
          setErrors(prev => ({ ...prev, classes: 'خطا در دریافت کلاس‌ها' }));
          setClasses([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        console.log('⏸️ Filters not complete, clearing classes');
        setClasses([]);
        setFormData(prev => ({ ...prev, class_obj: '' }));
      }
    };
    fetchClasses();
  }, [filters]);

  const handleFileUpload = (e) => {
    setExcelFile(e.target.files[0]);
    setImportResults(null);
  };

  const handleImport = async () => {
  if (!excelFile) {
    alert('لطفاً یک فایل اکسل انتخاب کنید');
    return;
  }

  setIsLoading(true);
  const formData = new FormData();
  formData.append('excel_file', excelFile);

  console.log('📤 Sending request to:', '/api/students/import-excel/');
  console.log('📦 File:', excelFile.name);

  try {
    const response = await api.post('/api/students/import-excel/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // افزایش timeout
    });

    const data = response.data;
    console.log('✅ Response received:', data);
    
    if (data.success) {
      setImportResults(data.results);
      alert(`با موفقیت ${data.results.success} دانش‌آموز اضافه شد`);
      
      if (onStudentAdded && typeof onStudentAdded === 'function') {
        onStudentAdded();
      }
    } else {
      alert('خطا: ' + data.error);
    }
  } catch (error) {
    console.error('❌ Full error object:', error);
    
    if (error.code === 'NETWORK_ERROR') {
      alert('خطای شبکه: سرور در دسترس نیست');
    } else if (error.code === 'ECONNABORTED') {
      alert('اتصال به سرور timeout خورد');
    } else if (error.response) {
      // سرور پاسخ داده اما با خطا
      console.error('📮 Server response error:', error.response.status, error.response.data);
      alert(`خطای سرور (${error.response.status}): ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      // درخواست ارسال شده اما پاسخی دریافت نشده
      console.error('📮 No response received:', error.request);
      alert('سرور پاسخی نمی‌دهد. لطفاً از در دسترس بودن سرور مطمئن شوید.');
    } else {
      // خطای دیگر
      console.error('📮 Other error:', error.message);
      alert(`خطا: ${error.message}`);
    }
  } finally {
    setIsLoading(false);
  }
};

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (field !== 'class_obj') {
      setFormData(prev => ({ ...prev, class_obj: '' }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'national_id') {
      const numericValue = value.replace(/\D/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: numericValue.slice(0, 13)
      }));
    } 
    else if (name.includes('_phone')) {
      const numericValue = value.replace(/\D/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: numericValue.slice(0, 11)
      }));
    }
    else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      alert('لطفاً خطاهای فرم را برطرف کنید');
      return;
    }

    setIsLoading(true);
    try {
      const submitData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        national_id: formData.national_id,
        father_name: formData.father_name,
        father_phone: formData.father_phone,
        mother_phone: formData.mother_phone,
        class_obj_id: parseInt(formData.class_obj)
      };

      console.log('🎯 داده‌های ارسالی:', submitData);

      const response = await api.post('/students/', submitData);
      console.log('✅ پاسخ سرور:', response.data);
      
      alert('دانش‌آموز با موفقیت ثبت شد!');
      
      if (onStudentAdded && typeof onStudentAdded === 'function') {
        onStudentAdded();
      }
      
      // ریست فرم
      setFormData({
        first_name: '',
        last_name: '',
        national_id: '',
        father_name: '',
        father_phone: '',
        mother_phone: '',
        class_obj: ''
      });
      
      setFilters({
        academic_year: '',
        grade: '',
        field: ''
      });
      
    } catch (error) {
      console.error('❌ Error:', error);
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        console.error('📮 خطاهای validation:', errorData);
        
        let errorMessage = 'خطا در ثبت:\n';
        Object.keys(errorData).forEach(key => {
          errorMessage += `• ${key}: ${errorData[key]}\n`;
        });
        alert(errorMessage);
      } else if (error.response?.status === 409) {
        alert('شماره شناسنامه تکراری است!');
      } else {
        alert('خطا در ثبت دانش‌آموز!');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'نام الزامی است';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'نام خانوادگی الزامی است';
    }

    if (!formData.national_id.trim()) {
      newErrors.national_id = 'شماره شناسنامه الزامی است';
    } else if (!/^\d{9,13}$/.test(formData.national_id)) {
      newErrors.national_id = 'شماره شناسنامه باید بین ۹ تا ۱۳ رقم باشد';
    }

    if (!formData.class_obj) {
      newErrors.class_obj = 'انتخاب کلاس الزامی است';
    }

    if (formData.father_phone && !/^09\d{9}$/.test(formData.father_phone)) {
      newErrors.father_phone = 'شماره تلفن معتبر نیست';
    }

    if (formData.mother_phone && !/^09\d{9}$/.test(formData.mother_phone)) {
      newErrors.mother_phone = 'شماره تلفن معتبر نیست';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <div className="student-form">
      <div className="form-header">
        <h3>مدیریت دانش‌آموزان</h3>
        <button 
          className={`toggle-btn ${showImportForm ? 'active' : ''}`}
          onClick={() => setShowImportForm(!showImportForm)}
        >
          {showImportForm ? '📝 ثبت تک‌تک' : '📥 ورود از اکسل'}
        </button>
      </div>

      {/* فرم آپلود اکسل */}
      {showImportForm && (
        <div className="excel-upload-section">
          <h4>ورود دسته‌جمعی از اکسل</h4>
          <div className="upload-form">
            <div className="form-group">
              <label>انتخاب فایل اکسل:</label>
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                onChange={handleFileUpload}
                disabled={isLoading}
              />
              <div className="form-text">فرمت‌های مجاز: XLSX, XLS</div>
            </div>
            
            <button 
              onClick={handleImport} 
              disabled={isLoading || !excelFile}
              className="btn btn-primary"
            >
              {isLoading ? 'در حال پردازش...' : 'آپلود و پردازش فایل'}
            </button>
          </div>

          {/* نمایش نتایج */}
          {importResults && (
            <div className="import-results">
              <h5>نتایج ورود اطلاعات:</h5>
              <div className="results-summary">
                <span className="success">موفق: {importResults.success}</span>
                <span className="total">از کل: {importResults.total}</span>
                <span className="errors">خطا: {importResults.errors.length}</span>
              </div>
              
              {importResults.errors.length > 0 && (
                <div className="errors-list">
                  <h6>جزئیات خطاها:</h6>
                  <ul>
                    {importResults.errors.map((error, index) => (
                      <li key={index}>
                        <strong>سطر {error.row}:</strong> {error.error}
                        {error.data && (
                          <span> ({error.data.first_name} {error.data.last_name})</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* فرم ثبت تک‌تک */}
      {!showImportForm && (
        <>
          {/* فیلترهای کلاس */}
          <div className="filters-section">
            <h4>انتخاب کلاس</h4>
            <div className="filters">
              <div className="filter-group">
                <label>سال تحصیلی:</label>
                <select 
                  value={filters.academic_year} 
                  onChange={(e) => handleFilterChange('academic_year', e.target.value)}
                >
                  <option value="">انتخاب کنید</option>
                  {Array.isArray(academicYears) && academicYears.map(year => (
                    <option key={year.id} value={year.id}>{year.year_name}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>پایه:</label>
                <select 
                  value={filters.grade} 
                  onChange={(e) => handleFilterChange('grade', e.target.value)}
                >
                  <option value="">انتخاب کنید</option>
                  <option value="10">دهم</option>
                  <option value="11">یازدهم</option>
                  <option value="12">دوازدهم</option>
                </select>
              </div>

              <div className="filter-group">
                <label>رشته:</label>
                <select 
                  value={filters.field} 
                  onChange={(e) => handleFilterChange('field', e.target.value)}
                >
                  <option value="">انتخاب کنید</option>
                  <option value="network">شبکه و نرم‌افزار</option>
                  <option value="computer">رایانه</option>
                  <option value="architecture">معماری داخلی</option>
                  <option value="accounting">حسابداری</option>
                </select>
              </div>

              <div className="filter-group">
                <label>کلاس:</label>
                <select 
                  name="class_obj"
                  value={formData.class_obj} 
                  onChange={handleInputChange}
                  disabled={!classes.length || isLoading}
                  className={errors.class_obj ? 'error' : ''}
                >
                  <option value="">انتخاب کنید</option>
                  {Array.isArray(classes) && classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      کلاس {cls.class_number}
                    </option>
                  ))}
                </select>
                {errors.class_obj && <span className="error-text">{errors.class_obj}</span>}
              </div>
            </div>
            {isLoading && <div className="loading">در حال دریافت کلاس‌ها...</div>}
          </div>

          {/* فرم اطلاعات دانش‌آموز */}
          <form onSubmit={handleSubmit} className="form">
            <div className="form-section">
              <h4>اطلاعات شخصی</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>نام:</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className={errors.first_name ? 'error' : ''}
                    required
                  />
                  {errors.first_name && <span className="error-text">{errors.first_name}</span>}
                </div>

                <div className="form-group">
                  <label>نام خانوادگی:</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className={errors.last_name ? 'error' : ''}
                    required
                  />
                  {errors.last_name && <span className="error-text">{errors.last_name}</span>}
                </div>

                <div className="form-group">
                  <label>شماره شناسنامه (9-13 رقم):</label>
                  <input
                    type="text"
                    name="national_id"
                    value={formData.national_id}
                    onChange={handleInputChange}
                    className={errors.national_id ? 'error' : ''}
                    maxLength="13"
                    placeholder="۹ تا ۱۳ رقم"
                    required
                  />
                  {errors.national_id && <span className="error-text">{errors.national_id}</span>}
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>اطلاعات تماس والدین</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>نام پدر:</label>
                  <input
                    type="text"
                    name="father_name"
                    value={formData.father_name}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>شماره پدر:</label>
                  <input
                    type="text"
                    name="father_phone"
                    value={formData.father_phone}
                    onChange={handleInputChange}
                    className={errors.father_phone ? 'error' : ''}
                    placeholder="09xxxxxxxxx"
                  />
                  {errors.father_phone && <span className="error-text">{errors.father_phone}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>شماره مادر:</label>
                  <input
                    type="text"
                    name="mother_phone"
                    value={formData.mother_phone}
                    onChange={handleInputChange}
                    className={errors.mother_phone ? 'error' : ''}
                    placeholder="09xxxxxxxxx"
                  />
                  {errors.mother_phone && <span className="error-text">{errors.mother_phone}</span>}
                </div>
                
                <div className="form-group"></div>
              </div>
            </div>

            <button 
              type="submit" 
              className="submit-btn"
              disabled={isLoading}
            >
              {isLoading ? 'در حال ثبت...' : 'ثبت دانش‌آموز'}
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default StudentForm;