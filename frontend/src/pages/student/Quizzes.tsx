import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Clock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { quizService } from '../../services/quizzes';
import { Quiz, QuizAttempt } from '../../types';

export const Quizzes: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [myAttempts, setMyAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([quizService.getQuizzes(), quizService.getMyAttempts()])
      .then(([quizzesData, attemptsData]) => {
        setQuizzes(quizzesData);
        setMyAttempts(attemptsData);
      })
      .catch((err) => console.log('Error loading quizzes:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Assessments & Quizzes</h1>
        <p className="text-xs text-slate-400 mt-1">Test your mastery of academic concepts with genuine evaluated quizzes.</p>
      </div>

      {/* Available Quizzes */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Available Assessments</h2>
        {quizzes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((q) => {
              const attempt = myAttempts.find((a) => a.quiz_id === q.id && a.completed_at);
              return (
                <Card key={q.id} className="p-5 flex flex-col justify-between bg-slate-900/80 hover:border-purple-500/40 transition-colors">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="purple">Passing: {q.passing_score}%</Badge>
                      {q.time_limit_minutes && (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" /> {q.time_limit_minutes} min
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-white">{q.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {q.description || 'Test your knowledge on key topics and receive immediate scoring feedback.'}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                    {attempt ? (
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Score: {attempt.score}%
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">Not Attempted</span>
                    )}

                    <Link to={`/student/quizzes/${q.id}`}>
                      <Button variant={attempt ? 'secondary' : 'primary'} size="sm">
                        {attempt ? 'Retake Quiz' : 'Start Quiz'} <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-2">
            <Award className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-400">No assessments published yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Check back soon as teachers add quizzes for your enrolled subjects.
            </p>
          </div>
        )}
      </div>

      {/* Previous Attempt History (Real Data Only) */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Attempt History</h2>
        {myAttempts.length > 0 ? (
          <div className="space-y-3">
            {myAttempts.map((att) => (
              <div
                key={att.id}
                className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-white">Quiz Attempt #{att.id}</span>
                  <p className="text-[10px] text-slate-500">
                    {att.completed_at ? new Date(att.completed_at).toLocaleString() : 'In Progress'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-sm font-bold text-cyan-400">{att.score} / {att.total_points}</span>
                    <p className="text-[10px] text-slate-500">Total Score</p>
                  </div>
                  <Badge variant={att.score >= 60 ? 'emerald' : 'amber'}>
                    {att.score >= 60 ? 'Passed' : 'Needs Practice'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">No quiz attempts recorded yet.</p>
        )}
      </div>
    </div>
  );
};
