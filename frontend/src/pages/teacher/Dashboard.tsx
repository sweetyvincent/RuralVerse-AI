import React, { useEffect, useState } from 'react';
import { Card, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../hooks/useAuth';
import { Users, Award, BookOpen, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-900 border border-slate-800 p-6 sm:p-8">
        <div className="max-w-2xl space-y-2">
          <Badge variant="purple">Educator Workspace</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome, {user?.full_name || 'Educator'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Manage your student cohorts, monitor genuine quiz scores, publish curriculum materials, and track learning gaps.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-slate-900/90 border-slate-800 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Cohort Management</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            View assigned classes, student attendance, and enrolled rural learners.
          </p>
          <Link to="/teacher/classes">
            <Button variant="outline" size="sm" className="w-full justify-between">
              <span>View Classes</span> <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </Card>

        <Card className="p-6 bg-slate-900/90 border-slate-800 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Assessment Reviews</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Inspect actual submitted quiz scores, question breakdown, and topic mastery.
          </p>
          <Link to="/teacher/assessments">
            <Button variant="outline" size="sm" className="w-full justify-between">
              <span>View Assessments</span> <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </Card>

        <Card className="p-6 bg-slate-900/90 border-slate-800 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Lesson Materials</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Upload regional language explanations, lesson handouts, and science practice guides.
          </p>
          <Link to="/teacher/materials">
            <Button variant="outline" size="sm" className="w-full justify-between">
              <span>Manage Materials</span> <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
};
