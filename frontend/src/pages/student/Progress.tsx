import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { TrendingUp, Clock, BookOpen, Award, Atom, AlertCircle } from 'lucide-react';
import { studentService } from '../../services/student';
import { ProgressRecord } from '../../types';

export const Progress: React.FC = () => {
  const [records, setRecords] = useState<ProgressRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentService.getProgress()
      .then((data) => setRecords(data))
      .catch((err) => console.log('Error fetching progress:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Learning Progress & Analytics</h1>
        <p className="text-xs text-slate-400 mt-1">
          Complete, tamper-evident timeline of your lessons, experiment runs, and air-writing sessions.
        </p>
      </div>

      <Card className="p-6 bg-slate-900/90 border-slate-800">
        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" /> Activity Records Timeline
        </h2>

        {records.length > 0 ? (
          <div className="space-y-3">
            {records.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 font-bold">
                    {r.activity_type === 'lesson' && <BookOpen className="w-4 h-4" />}
                    {r.activity_type === 'quiz' && <Award className="w-4 h-4" />}
                    {r.activity_type === 'experiment' && <Atom className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-white capitalize">{r.activity_type} Activity</h4>
                    <p className="text-[10px] text-slate-500">
                      Recorded on {r.created_at ? new Date(r.created_at).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {r.score !== null && r.score !== undefined && (
                    <span className="font-mono text-cyan-400 font-bold">{r.score} pts</span>
                  )}
                  <Badge variant={r.status === 'completed' ? 'emerald' : 'default'}>
                    {r.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-xs text-slate-500 space-y-2">
            <AlertCircle className="w-6 h-6 text-slate-600 mx-auto" />
            <p className="font-semibold text-slate-400">No student activity has been recorded yet.</p>
            <p>Every lesson you read, experiment you conduct, or quiz you submit will appear here.</p>
          </div>
        )}
      </Card>
    </div>
  );
};
