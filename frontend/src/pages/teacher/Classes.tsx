import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import api from '../../services/api';
import { Users, AlertCircle } from 'lucide-react';

export const Classes: React.FC = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/teacher/classes')
      .then((res) => setClasses(res.data))
      .catch((err) => console.log('Error loading teacher classes:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Assigned Classes & Cohorts</h1>
        <p className="text-xs text-slate-400 mt-1">Authorized student groups assigned to your teaching schedule.</p>
      </div>

      {classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {classes.map((c) => (
            <Card key={c.id} className="p-5 bg-slate-900/80 border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-base">{c.name}</span>
                <Badge variant="purple">{c.grade}</Badge>
              </div>
              <p className="text-xs text-slate-400">Enrolled Students: <strong>{c.student_count}</strong></p>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-2 text-xs">
          <Users className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="font-semibold text-slate-400">No classes assigned yet.</p>
          <p>School administrators allocate classes to educators through the administrative console.</p>
        </div>
      )}
    </div>
  );
};
