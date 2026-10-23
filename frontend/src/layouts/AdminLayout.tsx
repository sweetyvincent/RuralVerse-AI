import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
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
  Menu,
  X,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    try {
      await logout();
    } catch (err) {
      console.warn('Logout handler error:', err);
    }
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row text-slate-100">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <span className="font-bold text-white text-sm">RuralVerse Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="p-1.5 text-xs text-rose-400 hover:text-white bg-rose-500/10 rounded-lg flex items-center gap-1"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-slate-400 hover:text-white p-1"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar for Desktop & Mobile Overlay */}
      <aside
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-slate-900/95 backdrop-blur-2xl border-r border-slate-800/80 flex flex-col shrink-0 z-30`}
      >
        <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-orange-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-white tracking-tight">
              RuralVerse <span className="text-rose-400">Admin</span>
            </span>
            <p className="text-[10px] text-rose-400 font-medium uppercase tracking-wider">Master Platform Console</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Card & Sign Out Button */}
        <div className="p-4 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center gap-2.5 px-2 py-1.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
            <UserCheck className="w-4 h-4 text-rose-400 shrink-0" />
            <div className="truncate">
              <span className="text-white font-medium block truncate">{user?.full_name || 'Administrator'}</span>
              <span className="text-[10px] text-slate-500 block truncate">{user?.email || 'admin@ruralverse.org'}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area with Top Header */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-slate-900/60 border-b border-slate-800/60">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Signed in as:</span>
            <span className="text-white font-semibold">{user?.email || 'admin@ruralverse.org'}</span>
            <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] uppercase font-bold">
              Super Admin
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-xs text-rose-400 hover:text-white hover:bg-rose-500/10 flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto max-h-[calc(100vh-65px)] p-6 lg:p-8 bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
