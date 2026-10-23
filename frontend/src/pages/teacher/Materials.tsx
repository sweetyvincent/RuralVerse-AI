import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { lessonService } from '../../services/lessons';
import { Lesson } from '../../types';
import { BookOpen, Plus, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Materials: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    lessonService.getAdminLessons().then(setLessons);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Curriculum & Handouts</h1>
          <p className="text-xs text-slate-400 mt-1">Review approved lessons and attach supplementary reading guides.</p>
        </div>
      </div>

      <div className="space-y-3">
        {lessons.map((l) => (
          <Card key={l.id} className="p-4 bg-slate-900/80 border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-white text-sm">{l.title}</span>
              <p className="text-[10px] text-slate-400">Duration: {l.duration_minutes || 20}m • Language: {l.language.toUpperCase()}</p>
            </div>
            <Badge variant={l.is_published ? 'emerald' : 'outline'}>
              {l.is_published ? 'Published' : 'Draft'}
            </Badge>
          </Card>
        ))}
        {lessons.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-xs">
            No lessons available to manage.
          </div>
        )}
      </div>
    </div>
  );
};
