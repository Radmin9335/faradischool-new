import React, { useState } from 'react';
import StudentForm from '../components/StudentForm';
import StudentList from '../components/StudentList';
import DisciplineForm from '../components/DisciplineForm';
import DisciplineList from '../components/DisciplineList'; // ✅ جدید
import PrintReport from '../components/PrintReport';
import './Dashboard.css';

const Dashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('students');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [refreshDisciplineTrigger, setRefreshDisciplineTrigger] = useState(0); // ✅ جدید

  return (
    <div className="dashboard">
      {/* هدر */}
      <header className="dashboard-header">
        <h1>سامانه مدیریت مدرسه</h1>
        <button onClick={onLogout} className="logout-btn">
          خروج
        </button>
      </header>

      {/* نوار تب‌ها */}
      <nav className="tabs">
        <button 
          className={activeTab === 'students' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('students')}
        >
          مدیریت دانش‌آموزان
        </button>
        <button 
          className={activeTab === 'discipline' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('discipline')}
        >
          سیستم انضباط
        </button>
        <button 
          className={activeTab === 'reports' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('reports')}
        >
          گزارش‌گیری و پرینت
        </button>
      </nav>

      {/* محتوای تب‌ها */}
      <main className="dashboard-content">
        {activeTab === 'students' && (
          <div className="tab-content">
            <StudentForm onStudentAdded={() => setRefreshTrigger(prev => prev + 1)} />
            <StudentList 
              onStudentSelect={setSelectedStudent} 
              refreshTrigger={refreshTrigger} 
            />
          </div>
        )}

        {activeTab === 'discipline' && (
          <div className="tab-content">
            {/* ✅ اضافه شدن onDisciplineAdded و DisciplineList */}
            <DisciplineForm 
              selectedStudent={selectedStudent} 
              onDisciplineAdded={() => setRefreshDisciplineTrigger(prev => prev + 1)}
            />
            <DisciplineList 
              refreshTrigger={refreshDisciplineTrigger}
            />
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="tab-content">
            <PrintReport />
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;