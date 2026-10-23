import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock, Download, CheckCircle, FileText } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { lessonService } from '../../services/lessons';
import { Lesson } from '../../types';

export const LessonView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    if (id) {
      lessonService.getLesson(Number(id))
        .then((data) => {
          setLesson(data);
          // Check if already in IndexedDB/localStorage offline cache
          const cached = localStorage.getItem(`offline_lesson_${id}`);
          if (cached) setDownloaded(true);
        })
        .catch((err) => console.log('Error fetching lesson:', err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleDownloadOffline = () => {
    if (!lesson) return;
    localStorage.setItem(`offline_lesson_${lesson.id}`, JSON.stringify(lesson));
    setDownloaded(true);
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-400 text-xs">Loading lesson content...</div>;
  }

  if (!lesson) {
    return (
      <div className="text-center py-20 text-slate-400 text-xs space-y-4">
        <p>Lesson not found or unavailable.</p>
        <Link to="/student/lessons"><Button variant="outline" size="sm">Back to Library</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link to="/student/lessons">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Lessons
          </Button>
        </Link>

        <Button
          variant={downloaded ? 'secondary' : 'outline'}
          size="sm"
          onClick={handleDownloadOffline}
        >
          {downloaded ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2 text-emerald-400" /> Available Offline
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" /> Download for Offline
            </>
          )}
        </Button>
      </div>

      {/* Main Content Article */}
      <Card className="p-8 bg-slate-900/90 border-slate-800 space-y-6">
        <div className="space-y-3 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Badge variant="cyan">Lesson #{lesson.order + 1}</Badge>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" /> {lesson.duration_minutes || 20} min read
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{lesson.title}</h1>
        </div>

        {/* Content Body */}
        <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
          {lesson.content || 'Content for this lesson has not been formatted yet.'}
        </div>

        {/* Attached Educational Resources */}
        {lesson.resources && lesson.resources.length > 0 && (
          <div className="pt-6 border-t border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Attached Learning Documents
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {lesson.resources.map((res) => (
                <a
                  key={res.id}
                  href={`/${res.file_path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3 hover:border-cyan-500/50 transition-colors"
                >
                  <FileText className="w-5 h-5 text-cyan-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate">{res.file_name}</p>
                    <p className="text-[10px] text-slate-500">{Math.round((res.file_size || 0) / 1024)} KB</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
