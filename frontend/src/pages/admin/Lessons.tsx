import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { lessonService } from '../../services/lessons';
import { Lesson, Course } from '../../types';
import { BookOpen, Plus, Upload, Trash2, CheckCircle, Clock } from 'lucide-react';

export const Lessons: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  // New Lesson form
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [duration, setDuration] = useState(25);
  const [language, setLanguage] = useState('en');
  const [isPublished, setIsPublished] = useState(true);
  const [uploadLessonId, setUploadLessonId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [message, setMessage] = useState<string | null>(null);

  const loadData = () => {
    lessonService.getAdminCourses().then((c) => {
      setCourses(c);
      if (c.length > 0 && !selectedCourseId) setSelectedCourseId(c[0].id);
    });
    lessonService.getAdminLessons().then(setLessons);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !title) return;
    await lessonService.createLesson({
      course_id: selectedCourseId,
      title,
      content,
      duration_minutes: duration,
      language,
      is_published: isPublished,
    });
    setTitle('');
    setContent('');
    setMessage('Lesson created and published.');
    loadData();
  };

  const handleTogglePublish = async (lesson: Lesson) => {
    await lessonService.updateLesson(lesson.id, { is_published: !lesson.is_published });
    setMessage(`Lesson "${lesson.title}" updated.`);
    loadData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;
    await lessonService.deleteLesson(id);
    setMessage('Lesson deleted.');
    loadData();
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadLessonId || !selectedFile) return;
    await lessonService.uploadResource(uploadLessonId, selectedFile);
    setSelectedFile(null);
    setUploadLessonId(null);
    setMessage('Educational resource uploaded.');
    loadData();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Lesson Management & Resource Publishing</h1>
        <p className="text-xs text-slate-400 mt-1">Author lesson modules, attach reference PDFs, and manage visibility.</p>
      </div>

      {message && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> <span>{message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Lesson Form */}
        <Card className="lg:col-span-1 p-6 bg-slate-900/90 border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-cyan-400" /> New Lesson Module
          </h2>

          <form onSubmit={handleCreateLesson} className="space-y-3">
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Target Course</label>
              <select
                value={selectedCourseId || ''}
                onChange={(e) => setSelectedCourseId(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Lesson Title"
              placeholder="e.g. Conductors vs Insulators"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Lesson Text & Explanations</label>
              <textarea
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write lesson syllabus content, key definitions, equations..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                label="Duration (min)"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                >
                  <option value="en">English</option>
                  <option value="ta">Tamil</option>
                  <option value="hi">Hindi</option>
                  <option value="te">Telugu</option>
                </select>
              </div>
            </div>

            <Button type="submit" variant="glow" size="sm" className="w-full">
              Publish Lesson Module
            </Button>
          </form>
        </Card>

        {/* Existing Lessons List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            Curriculum Lessons ({lessons.length})
          </h2>

          {lessons.length > 0 ? (
            <div className="space-y-3">
              {lessons.map((l) => (
                <Card key={l.id} className="p-4 bg-slate-900/80 border-slate-800 flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{l.title}</span>
                      <Badge variant={l.is_published ? 'emerald' : 'outline'}>
                        {l.is_published ? 'Published' : 'Draft'}
                      </Badge>
                      <span className="text-[10px] text-slate-500 uppercase">{l.language}</span>
                    </div>
                    <p className="text-slate-400 text-xs line-clamp-1 max-w-lg">{l.content}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTogglePublish(l)}
                    >
                      {l.is_published ? 'Unpublish' : 'Publish'}
                    </Button>
                    <button
                      onClick={() => handleDelete(l.id)}
                      className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-xs text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
              No lessons created yet. Fill out the form on the left to add your first educational lesson.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
