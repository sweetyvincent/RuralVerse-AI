import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Award,
  Atom,
  HandMetal,
  Bot,
  Clock,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Download,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { studentService } from '../../services/student';
import { StudentDashboardData } from '../../types';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<StudentDashboardData>({
    total_lessons_completed: 0,
    total_quizzes_taken: 0,
    total_experiments_completed: 0,
    average_quiz_score: 0.0,
    total_time_spent_seconds: 0,
    recent_activity: [],
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    studentService.getDashboard()
      .then((data) => setDashboard(data))
      .catch((err) => console.log('Error fetching dashboard:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-950/40 via-purple-950/30 to-slate-900 border border-slate-800 p-6 sm:p-8">
        <div className="max-w-2xl space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <Badge variant="cyan">Welcome Back</Badge>
            <span className="text-xs text-slate-400">Class: {user?.grade || 'General Education'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Hello, {user?.full_name || 'Student'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Ready to explore? Practice science formulas in the Air-Writing Studio, launch interactive AR experiments, or ask the Multilingual AI Tutor.
          </p>
        </div>
      </div>

      {/* Metrics Row (Strictly DB-Backed, zeros if empty) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-slate-900/80">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Completed Lessons</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400"><BookOpen className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-black text-white mt-2">{dashboard.total_lessons_completed}</div>
          <div className="text-[10px] text-slate-500 mt-1">Syllabus modules finished</div>
        </Card>

        <Card className="p-5 bg-slate-900/80">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Quizzes Completed</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400"><Award className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-black text-white mt-2">{dashboard.total_quizzes_taken}</div>
          <div className="text-[10px] text-slate-500 mt-1">Average score: {dashboard.average_quiz_score}%</div>
        </Card>

        <Card className="p-5 bg-slate-900/80">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">AR Lab Sessions</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400"><Atom className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-black text-white mt-2">{dashboard.total_experiments_completed}</div>
          <div className="text-[10px] text-slate-500 mt-1">Interactive 3D simulations</div>
        </Card>

        <Card className="p-5 bg-slate-900/80">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Learning Time</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400"><Clock className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {Math.round(dashboard.total_time_spent_seconds / 60)} <span className="text-sm font-normal text-slate-400">min</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Total active recorded learning</div>
        </Card>
      </div>

      {/* Quick Launch Cards */}
      <div>
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" /> Core Interactive Learning Tools
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-slate-900/70 border-slate-800 hover:border-cyan-500/40 transition-colors space-y-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold">
              <HandMetal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Air-Writing Studio</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Draw equations, letters, and scientific diagrams in the air using your webcam. Real-time fingertip tracking.
              </p>
            </div>
            <Link to="/student/air-writing">
              <Button variant="outline" size="sm" className="w-full justify-between">
                <span>Open Studio</span> <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </Card>

          <Card className="p-6 bg-slate-900/70 border-slate-800 hover:border-purple-500/40 transition-colors space-y-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
              <Atom className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">AR Science Laboratory</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Simulate electrical circuits, observe current incandescence, and inspect the human heart and solar system in 3D.
              </p>
            </div>
            <Link to="/student/ar-lab">
              <Button variant="outline" size="sm" className="w-full justify-between">
                <span>Launch Experiments</span> <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </Card>

          <Card className="p-6 bg-slate-900/70 border-slate-800 hover:border-emerald-500/40 transition-colors space-y-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Multilingual AI Tutor</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Step-by-step explanations in Tamil, Hindi, Telugu, or English, grounded in verified textbook passages.
              </p>
            </div>
            <Link to="/student/ai-tutor">
              <Button variant="outline" size="sm" className="w-full justify-between">
                <span>Ask AI Tutor</span> <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </Card>
        </div>
      </div>

      {/* Recent Activity Table (Real DB Records Only) */}
      <Card className="p-6 bg-slate-900/80">
        <CardTitle className="text-sm mb-4">Recent Learning Records</CardTitle>
        {dashboard.recent_activity.length > 0 ? (
          <div className="space-y-3">
            {dashboard.recent_activity.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                    {item.activity_type === 'lesson' ? <BookOpen className="w-4 h-4" /> : <Award className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="font-semibold text-white capitalize">{item.activity_type}</span>
                    <p className="text-[10px] text-slate-500">{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}</p>
                  </div>
                </div>
                <Badge variant={item.status === 'completed' ? 'emerald' : 'default'}>
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-500 space-y-1">
            <AlertCircle className="w-6 h-6 text-slate-600 mx-auto mb-2" />
            <p className="font-semibold text-slate-400">No student activity has been recorded yet.</p>
            <p>Start a lesson, complete a quiz, or practice in the air-writing studio to see your progress here.</p>
          </div>
        )}
      </Card>
    </div>
  );
};
