import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { adminService } from '../../services/admin';
import { AdminOverviewData, PlatformAnalyticsData } from '../../types';
import {
  Users,
  GraduationCap,
  BookOpen,
  Award,
  Atom,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [overview, setOverview] = useState<AdminOverviewData>({
    total_users: 0,
    total_students: 0,
    total_teachers: 0,
    total_admins: 0,
    total_lessons: 0,
    total_quizzes: 0,
    total_experiments: 0,
    total_courses: 0,
    total_subjects: 0,
    recent_users: [],
  });

  const [analytics, setAnalytics] = useState<PlatformAnalyticsData>({
    total_quiz_attempts: 0,
    average_quiz_score: 0.0,
    total_experiment_sessions: 0,
    total_ai_chats: 0,
    total_air_writing_sessions: 0,
    active_students_count: 0,
    progress_by_activity: {},
  });

  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([adminService.getOverview(), adminService.getAnalytics()])
      .then(([overviewData, analyticsData]) => {
        setOverview(overviewData);
        setAnalytics(analyticsData);
      })
      .catch((err) => console.log('Error fetching admin data:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Super Administrator Console</h1>
            <Badge variant="rose">Database Verified</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time platform metrics, course publishing, RAG indexing, and user administration.
          </p>
        </div>
      </div>

      {/* Metrics Row (Derived purely from DB queries) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 bg-slate-900/80 border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium">Students</span>
          <div className="text-2xl font-black text-white mt-1">{overview.total_students}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Enrolled accounts</p>
        </Card>

        <Card className="p-4 bg-slate-900/80 border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium">Teachers</span>
          <div className="text-2xl font-black text-white mt-1">{overview.total_teachers}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Active educators</p>
        </Card>

        <Card className="p-4 bg-slate-900/80 border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium">Published Lessons</span>
          <div className="text-2xl font-black text-white mt-1">{overview.total_lessons}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Across {overview.total_courses} courses</p>
        </Card>

        <Card className="p-4 bg-slate-900/80 border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium">Assessments</span>
          <div className="text-2xl font-black text-white mt-1">{overview.total_quizzes}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">{analytics.total_quiz_attempts} attempts</p>
        </Card>

        <Card className="p-4 bg-slate-900/80 border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium">AR Lab Modules</span>
          <div className="text-2xl font-black text-white mt-1">{overview.total_experiments}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">{analytics.total_experiment_sessions} completions</p>
        </Card>

        <Card className="p-4 bg-slate-900/80 border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium">Air-Writing Sessions</span>
          <div className="text-2xl font-black text-cyan-400 mt-1">{analytics.total_air_writing_sessions}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Fingertip practice logs</p>
        </Card>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-slate-900/90 border-slate-800 space-y-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" /> Platform Assessment Analytics
          </CardTitle>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block">Average Quiz Score</span>
              <span className="text-xl font-bold text-white mt-1 block">
                {analytics.average_quiz_score}%
              </span>
              <span className="text-[10px] text-slate-500">From verified submissions</span>
            </div>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block">AI Tutor Interactions</span>
              <span className="text-xl font-bold text-white mt-1 block">
                {analytics.total_ai_chats}
              </span>
              <span className="text-[10px] text-slate-500">RAG textbook queries</span>
            </div>
          </div>
        </Card>

        {/* Recently Registered Accounts */}
        <Card className="p-6 bg-slate-900/90 border-slate-800 space-y-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-rose-400" /> Recently Registered Accounts
          </CardTitle>
          {overview.recent_users.length > 0 ? (
            <div className="space-y-2">
              {overview.recent_users.map((u) => (
                <div key={u.id} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-white">{u.full_name}</span>
                    <p className="text-[10px] text-slate-500">{u.email}</p>
                  </div>
                  <Badge variant={u.role === 'admin' ? 'rose' : u.role === 'teacher' ? 'purple' : 'cyan'}>
                    {u.role}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-500">
              No recent users registered.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
