import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  LayoutDashboard,
  Users,
  BookOpen,
  Award,
  TrendingUp,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const TeacherLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: '/teacher/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/teacher/classes', icon: Users, label: 'My Classes' },
    { to: '/teacher/materials', icon: BookOpen, label: 'Learning Materials' },
    { to: '/teacher/assessments', icon: Award, label: 'Assessments' },
    { to: '/teacher/progress', icon: TrendingUp, label: 'Student Performance' },
    { to: '/teacher/settings', icon: Settings, label: 'Settings' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.warn('Teacher logout error:', err);
    }
    navigate('/teacher/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-100">
      <aside className="w-64 bg-slate-900/90 backdrop-blur-2xl border-r border-slate-800/80 flex flex-col">
        <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-white tracking-tight">RuralVerse <span className="text-purple-400">AI</span></span>
            <p className="text-[10px] text-purple-400 font-medium">TEACHER CONSOLE</p>
          </div>
        </div>

        <div className="p-4 mx-3 my-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm border border-purple-500/30">
            {user?.full_name?.charAt(0) || 'T'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.full_name}</p>
            <p className="text-[10px] text-slate-400 truncate">Educator</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800/80">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto max-h-screen p-6 lg:p-8 bg-slate-950">
        <Outlet />
      </main>
    </div>
  );
};
