import React from 'react';
import { 
  LayoutDashboard, 
  Building2,
  Layers,
  Users,
  Calendar,
  BookOpen,
  Sliders,
  FileSpreadsheet, 
  AlertTriangle, 
  Download,
  LogOut,
  History,
  FileText,
  X
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  onLogout,
  isMobileOpen = false,
  onCloseMobile
}) => {
  // Navigation matching the exact 13 items from specification
  const primaryNavItems = [
    { id: 'dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
    { id: 'departments', label: '1. Departments', icon: Building2 },
    { id: 'sections', label: '2. Sections', icon: Layers },
    { id: 'students', label: '3. Students', icon: Users },
    { id: 'semesters', label: '4. Semesters', icon: Calendar },
    { id: 'subjects', label: '5. Subjects', icon: BookOpen },
    { id: 'config', label: '6. Academic Configuration', icon: Sliders },
    { id: 'entry', label: '7. Student Academic Records', icon: FileSpreadsheet },
    { id: 'arrears', label: '8. Arrear Management', icon: AlertTriangle },
    { id: 'section-excel', label: '9. Section Excel', icon: FileSpreadsheet },
    { id: 'download', label: '10. Excel Download', icon: Download },
  ];

  const secondaryNavItems = [
    { id: 'history', label: 'Academic History', icon: History },
    { id: 'report', label: 'Printable Transcript', icon: FileText }
  ];

  const handleItemClick = (id: string) => {
    setActiveTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  const renderNavContent = () => (
    <>
      <div className="space-y-4">
        {/* Navigation Section */}
        <div>
          <div className="px-2 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Admin Management
          </div>
          <nav className="space-y-1">
            {primaryNavItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-medium text-xs transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Secondary Analytics */}
        <div>
          <div className="px-2 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Reports & Analysis
          </div>
          <nav className="space-y-1">
            {secondaryNavItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-medium text-xs transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Section: 13. Logout */}
      <div className="pt-4 border-t border-slate-800 space-y-2 mt-4">
        <button
          onClick={() => {
            if (onCloseMobile) onCloseMobile();
            onLogout();
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition duration-150 cursor-pointer"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>12. Logout</span>
        </button>

        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[10px] text-slate-500 text-center">
          Admin Portal • v2.0 Section-Wise
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden animate-fadeIn"
          aria-hidden="true"
        />
      )}

      {/* Mobile Slide-Over Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 border-r border-slate-800 p-4 flex flex-col justify-between transition-transform duration-300 ease-in-out md:hidden no-print overflow-y-auto shadow-2xl ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
          <span className="text-xs font-bold text-white uppercase tracking-wider">Navigation Menu</span>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {renderNavContent()}
      </aside>

      {/* Desktop Persistent Sidebar (Strictly Preserved) */}
      <aside className="hidden md:flex w-64 glass-panel border-r border-slate-800 p-4 min-h-[calc(100vh-65px)] flex-col justify-between no-print flex-shrink-0">
        {renderNavContent()}
      </aside>
    </>
  );
};
