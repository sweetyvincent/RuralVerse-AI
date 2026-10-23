import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { quizService } from '../../services/quizzes';
import { Quiz } from '../../types';
import { Award } from 'lucide-react';

export const Assessments: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  useEffect(() => {
    quizService.getAdminQuizzes().then(setQuizzes);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Class Assessments</h1>
        <p className="text-xs text-slate-400 mt-1">Review published student quizzes, passing criteria, and active attempts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quizzes.map((q) => (
          <Card key={q.id} className="p-5 bg-slate-900/80 border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">{q.title}</span>
              <Badge variant="purple">{q.passing_score}% Pass</Badge>
            </div>
            <p className="text-slate-400 line-clamp-2">{q.description || 'General assessment'}</p>
            <div className="pt-2 text-[10px] text-slate-500">
              Time Limit: {q.time_limit_minutes || 20} minutes
            </div>
          </Card>
        ))}
        {quizzes.length === 0 && (
          <div className="col-span-3 text-center py-12 text-slate-500 text-xs">
            No assessments currently assigned.
          </div>
        )}
      </div>
    </div>
  );
};
