import React from 'react';
import { GraduationCap, Building2, ShieldCheck, LogOut, Menu, X } from 'lucide-react';
import { AdminUser } from '../types';

interface NavbarProps {
  adminUser: AdminUser | null;
  onLogout: () => void;
  onNavigate: (tab: string) => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  adminUser, 
  onLogout, 
  onNavigate,
  isMobileMenuOpen = false,
  onToggleMobileMenu
}) => {
  return (
    <header className="glass-panel border-b border-slate-800 sticky top-0 z-30 px-3 sm:px-6 py-2.5 sm:py-3 no-print">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile hamburger menu toggle */}
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <div 
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xs sm:text-base md:text-lg tracking-wide text-white flex items-center gap-1.5 sm:gap-2 line-clamp-1 sm:line-clamp-none">
                Vel Tech High Tech Dr.Rangarajan Dr.Sakunthala Engineering College
              </h1>
              <p className="text-[10px] sm:text-xs text-blue-400 font-medium flex items-center gap-1.5 line-clamp-1 sm:line-clamp-none">
                <Building2 className="w-3.5 h-3.5 flex-shrink-0 hidden xs:inline" /> Department of Computer Science and Engineering • Section Academic System
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {adminUser && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300 font-semibold">{adminUser.name || 'Admin'}</span>
              <span className="text-[10px] text-blue-400 font-mono bg-blue-500/10 px-1.5 py-0.5 rounded">
                ADMIN
              </span>
            </div>
          )}

          {adminUser && (
            <button
              onClick={onLogout}
              title="Logout"
              className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
