import React, { useState, useEffect } from 'react';
import { BACKEND_URL } from './api';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { AdminLogin } from './pages/AdminLogin';
import { Dashboard } from './pages/Dashboard';
import { DepartmentManagement } from './pages/DepartmentManagement';
import { SectionManagement } from './pages/SectionManagement';
import { StudentManagement } from './pages/StudentManagement';
import { SemesterManagement } from './pages/SemesterManagement';
import { SubjectManagement } from './pages/SubjectManagement';
import { AcademicConfiguration } from './pages/AcademicConfiguration';
import { StudentEntry } from './pages/StudentEntry';
import { ArrearManagement } from './pages/ArrearManagement';
import { SectionExcelView } from './pages/SectionExcelView';
import { CommonExcelView } from './pages/CommonExcelView';
import { AcademicHistory } from './pages/AcademicHistory';
import { PrintableReport } from './pages/PrintableReport';
import { AdminUser } from './types';
import { ArrowLeft } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [tabHistory, setTabHistory] = useState<string[]>(['dashboard']);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  // Check stored session token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('admin_user');

    if (token && storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setAdminUser(parsed);
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('admin_user');
      }
    }
    setIsAuthChecking(false);
  }, []);

  const handleNavigate = (newTab: string) => {
    if (newTab !== activeTab) {
      setTabHistory(prev => [...prev, newTab]);
      setActiveTab(newTab);
    }
  };

  const handleBack = () => {
    if (tabHistory.length > 1) {
      const newHistory = [...tabHistory];
      newHistory.pop(); // pop current tab
      const previousTab = newHistory[newHistory.length - 1] || 'dashboard';
      setTabHistory(newHistory);
      setActiveTab(previousTab);
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLoginSuccess = (user: AdminUser, token: string) => {
    setAdminUser(user);
    setActiveTab('dashboard');
    setTabHistory(['dashboard']);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin_user');
    setAdminUser(null);
    setTabHistory(['dashboard']);
    fetch(`${BACKEND_URL}/api/auth/logout`, { method: 'POST' }).catch(() => {});
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If not authenticated, require Admin Login (Requirements 9 & 10)
  if (!adminUser) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar 
        adminUser={adminUser} 
        onLogout={handleLogout} 
        onNavigate={handleNavigate} 
      />

      <div className="flex flex-1">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={handleNavigate} 
          onLogout={handleLogout} 
        />

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Top-Left Back Button for all subpages */}
            {activeTab !== 'dashboard' && (
              <div className="mb-4">
                <button
                  onClick={handleBack}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/50 text-slate-300 hover:text-white text-xs font-semibold shadow-sm transition duration-150 cursor-pointer group"
                >
                  <ArrowLeft className="w-4 h-4 text-blue-400 group-hover:-translate-x-0.5 transition-transform duration-150" />
                  <span>Back to Dashboard</span>
                </button>
              </div>
            )}

            {activeTab === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
            {activeTab === 'departments' && <DepartmentManagement />}
            {activeTab === 'sections' && <SectionManagement />}
            {activeTab === 'students' && <StudentManagement />}
            {activeTab === 'semesters' && <SemesterManagement />}
            {activeTab === 'subjects' && <SubjectManagement />}
            {activeTab === 'config' && <AcademicConfiguration />}
            {activeTab === 'entry' && <StudentEntry />}
            {activeTab === 'arrears' && <ArrearManagement />}
            {activeTab === 'common-excel' && <CommonExcelView />}
            {activeTab === 'section-excel' && <SectionExcelView />}
            {activeTab === 'download' && <SectionExcelView />}
            {activeTab === 'history' && <AcademicHistory />}
            {activeTab === 'report' && <PrintableReport />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
