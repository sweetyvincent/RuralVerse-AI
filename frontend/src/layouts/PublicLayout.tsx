import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Sparkles, BookOpen, HandMetal, Atom, WifiOff, LogIn } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';

export const PublicLayout: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-white tracking-tight flex items-center gap-1.5">
                RuralVerse <span className="text-cyan-400">AI</span>
              </span>
              <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Intelligent • Multilingual</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
            <a href="#air-writing" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
              <HandMetal className="w-4 h-4 text-cyan-400" /> Air-Writing
            </a>
            <a href="#ar-lab" className="hover:text-purple-400 transition-colors flex items-center gap-1.5">
              <Atom className="w-4 h-4 text-purple-400" /> AR Science Lab
            </a>
            <a href="#offline" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
              <WifiOff className="w-4 h-4 text-emerald-400" /> Offline Mode
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (user?.role === 'admin') navigate('/admin/dashboard');
                    else if (user?.role === 'teacher') navigate('/teacher/dashboard');
                    else navigate('/student/dashboard');
                  }}
                >
                  Dashboard ({user?.full_name?.split(' ')[0]})
                </Button>
                <Button variant="ghost" size="sm" onClick={() => logout()}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/student/login">
                  <Button variant="ghost" size="sm">
                    <LogIn className="w-4 h-4 mr-1.5" /> Sign In
                  </Button>
                </Link>
                <Link to="/student/register">
                  <Button variant="glow" size="sm">
                    Start Learning
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-12 text-slate-400 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white">RuralVerse AI</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Empowering rural education through webcam air-writing, interactive AR science experiments,
              and offline-ready multilingual AI tutoring.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Portals</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/student/login" className="hover:text-cyan-400">Student Portal</Link></li>
              <li><Link to="/teacher/login" className="hover:text-cyan-400">Teacher Portal</Link></li>
              <li><Link to="/admin/login" className="hover:text-cyan-400">Administrator Console</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Core Modules</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/student/air-writing" className="hover:text-cyan-400">Air-Writing Studio</Link></li>
              <li><Link to="/student/ar-lab" className="hover:text-purple-400">AR Science Laboratory</Link></li>
              <li><Link to="/student/ai-tutor" className="hover:text-emerald-400">Multilingual AI Tutor</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Security & Privacy</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Camera frames processed locally in browser. No biometric or video data uploaded to servers.
              Compliant with student data protection standards.
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-8 border-t border-slate-900 text-center text-xs text-slate-600">
          © {new Date().getFullYear()} RuralVerse AI. Open-access rural education technology platform.
        </div>
      </footer>
    </div>
  );
};
