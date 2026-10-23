import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  LayoutDashboard,
  Users,
  BookOpen,
  FolderTree,
  Bot,
  Award,
  Atom,
  HandMetal,
  Settings,
  FileText,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { to: '/admin/users', icon: Users, label: 'User Management' },
    { to: '/admin/courses', icon: FolderTree, label: 'Subjects & Courses' },
    { to: '/admin/lessons', icon: BookOpen, label: 'Lessons & Content' },
    { to: '/admin/ai-config', icon: Bot, label: 'AI Tutor & RAG' },
    { to: '/admin/quizzes', icon: Award, label: 'Assessments' },
    { to: '/admin/ar-lab', icon: Atom, label: 'AR Lab Config' },
    { to: '/admin/air-writing', icon: HandMetal, label: 'Air-Writing Config' },
    { to: '/admin/settings', icon: Settings, label: 'Platform Settings' },
    { to: '/admin/audit-logs', icon: FileText, label: 'Audit Trail' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-100">
      <aside className="w-64 bg-slate-900/95 backdrop-blur-2xl border-r border-slate-800/80 flex flex-col">
        <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-orange-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-white tracking-tight">RuralVerse <span className="text-rose-400">Admin</span></span>
            <p className="text-[10px] text-rose-400 font-medium uppercase tracking-wider">Master Platform Console</p>
          </div>
        </div>

        <div className="p-4 mx-3 my-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-sm border border-rose-500/30">
            {user?.full_name?.charAt(0) || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.full_name}</p>
            <p className="text-[10px] text-rose-400 font-semibold truncate">Super Administrator</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
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
            <span>Sign Out Admin</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto max-h-screen p-6 lg:p-8 bg-slate-950">
        <Outlet />
      </main>
    </div>
  );
};
