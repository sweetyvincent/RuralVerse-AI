import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { lessonService } from '../../services/lessons';
import { Lesson, Course } from '../../types';
import {
  BookOpen,
  Plus,
  Upload,
  Trash2,
  CheckCircle,
  Clock,
  FileText,
  AlertCircle,
  Eye,
  Languages,
} from 'lucide-react';

export const Lessons: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // New Lesson / Study Notes form
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [duration, setDuration] = useState(25);
  const [language, setLanguage] = useState('en');
  const [isPublished, setIsPublished] = useState(true);
  const [creating, setCreating] = useState(false);

  // File Upload
  const [uploadLessonId, setUploadLessonId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Preview Note modal
  const [previewNote, setPreviewNote] = useState<Lesson | null>(null);

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const c = await lessonService.getAdminCourses();
      setCourses(c);
      if (c.length > 0) {
        setSelectedCourseId((prev) => prev ?? c[0].id);
      }
      const l = await lessonService.getAdminLessons();
      setLessons(l);
    } catch (err: any) {
      console.error('Error loading lessons and notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setMessage({ text: 'Please enter a note or lesson title.', type: 'error' });
      return;
    }

    const targetCourseId = selectedCourseId || (courses.length > 0 ? courses[0].id : 1);
    setCreating(true);
    setMessage(null);

    try {
      const created = await lessonService.createLesson({
        course_id: targetCourseId,
        title: title.trim(),
        content: content.trim(),
        duration_minutes: Number(duration) || 20,
        language,
        is_published: isPublished,
      });

      setTitle('');
      setContent('');
      setMessage({ text: `Study Note & Lesson "${created.title}" saved and published successfully!`, type: 'success' });
      await loadData();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to save note.', type: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const handleTogglePublish = async (lesson: Lesson) => {
    try {
      await lessonService.updateLesson(lesson.id, { is_published: !lesson.is_published });
      setMessage({ text: `Updated visibility for "${lesson.title}".`, type: 'success' });
      await loadData();
    } catch (err: any) {
      setMessage({ text: 'Failed to update visibility.', type: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this study note / lesson?')) return;
    try {
      await lessonService.deleteLesson(id);
      setMessage({ text: 'Note deleted.', type: 'success' });
      await loadData();
    } catch (err: any) {
      setMessage({ text: 'Failed to delete note.', type: 'error' });
    }
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadLessonId || !selectedFile) return;
    setUploading(true);
    try {
      await lessonService.uploadResource(uploadLessonId, selectedFile);
      setSelectedFile(null);
      setUploadLessonId(null);
      setMessage({ text: 'Educational PDF / Reference Note attached successfully.', type: 'success' });
      await loadData();
    } catch (err: any) {
      setMessage({ text: 'Failed to upload attachment.', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="cyan">Academic Content</Badge>
          <span className="text-xs text-slate-400">Total Notes & Lessons: {lessons.length}</span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight mt-1">Study Notes & Lesson Materials</h1>
        <p className="text-xs text-slate-400 mt-1">
          Publish chapter notes, educational summaries, formulas, and reference documents for students.
        </p>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2 transition-all ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form: Add New Study Notes / Lesson */}
        <Card className="lg:col-span-1 p-6 bg-slate-900/90 border-slate-800 space-y-4 h-fit">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" /> Add New Study Note
            </h2>
            <Badge variant="outline" className="text-[10px] text-cyan-300">Draft or Publish</Badge>
          </div>

          <form onSubmit={handleCreateLesson} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Target Course / Subject *</label>
              <select
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                value={selectedCourseId || ''}
                onChange={(e) => setSelectedCourseId(Number(e.target.value))}
              >
                {courses.length === 0 ? (
                  <option value={1}>General Curriculum & Science</option>
                ) : (
                  courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.grade_level})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Note / Lesson Title *</label>
              <Input
                placeholder="e.g. Electric Circuit Fundamentals & Ohm's Law"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Language</label>
                <select
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="en">English (Default)</option>
                  <option value="ta">Tamil (தமிழ்)</option>
                  <option value="hi">Hindi (हिन्दी)</option>
                  <option value="te">Telugu (తెలుగు)</option>
                  <option value="kn">Kannada (ಕನ್ನಡ)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Reading (Mins)</label>
                <Input
                  type="number"
                  min="5"
                  max="120"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Study Notes Content & Explanation *
              </label>
              <textarea
                className="w-full h-44 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none leading-relaxed"
                placeholder="# Chapter Summary&#10;&#10;Key definitions, formulas, step-by-step notes:&#10;- V = I * R (Ohm's Law)&#10;- Closed circuit loops allow electron drift..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-0"
                />
                <span>Publish immediately to students</span>
              </label>
            </div>

            <Button type="submit" variant="primary" size="sm" disabled={creating} className="w-full">
              <Plus className="w-4 h-4 mr-1.5" /> {creating ? 'Saving Notes...' : 'Save & Publish Notes'}
            </Button>
          </form>
        </Card>

        {/* Existing Lessons & Notes Table / List */}
        <Card className="lg:col-span-2 p-6 bg-slate-900/90 border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-400" /> Published Study Notes & Lessons ({lessons.length})
              </h2>
              <p className="text-[11px] text-slate-400">Manage lesson content, language tags, and attach PDF documents.</p>
            </div>
          </div>

          {lessons.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No notes or lessons published yet. Use the form on the left to add your first study note.
            </div>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson) => {
                const course = courses.find((c) => c.id === lesson.course_id);
                return (
                  <div
                    key={lesson.id}
                    className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-white">{lesson.title}</h3>
                          <Badge variant={lesson.is_published ? 'emerald' : 'outline'} className="text-[10px]">
                            {lesson.is_published ? 'Published' : 'Draft'}
                          </Badge>
                          <Badge variant="cyan" className="text-[10px] uppercase">
                            {lesson.language}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400">
                          Course: <span className="text-slate-300 font-medium">{course?.title || 'General Curriculum'}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewNote(lesson)}
                          title="Preview Notes"
                          className="text-cyan-400 hover:text-cyan-300 p-2 h-auto"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePublish(lesson)}
                          title="Toggle Visibility"
                          className="text-slate-400 hover:text-white p-2 h-auto text-xs"
                        >
                          {lesson.is_published ? 'Unpublish' : 'Publish'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(lesson.id)}
                          title="Delete Lesson"
                          className="text-red-400 hover:text-red-300 p-2 h-auto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="text-xs text-slate-400 line-clamp-2 font-mono bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/50">
                      {lesson.content || 'No text summary provided.'}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> {lesson.duration_minutes} min read
                        </span>
                      </div>
                      <button
                        onClick={() => setUploadLessonId(lesson.id)}
                        className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 underline underline-offset-4"
                      >
                        <Upload className="w-3.5 h-3.5" /> Attach PDF / Resource Note
                      </button>
                    </div>

                    {uploadLessonId === lesson.id && (
                      <form
                        onSubmit={handleUploadFile}
                        className="mt-3 p-3 bg-purple-950/20 border border-purple-800/40 rounded-xl space-y-2 text-xs"
                      >
                        <span className="font-semibold text-purple-300 block">Attach Educational Document (PDF/Text):</span>
                        <input
                          type="file"
                          accept=".pdf,.txt,.png,.jpg"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                          className="text-xs text-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white file:text-xs"
                        />
                        <div className="flex items-center gap-2 pt-1">
                          <Button type="submit" variant="primary" size="sm" disabled={!selectedFile || uploading}>
                            {uploading ? 'Uploading...' : 'Confirm Upload'}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setUploadLessonId(null);
                              setSelectedFile(null);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Note Preview Modal */}
      {previewNote && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">{previewNote.title}</h3>
                <span className="text-xs text-slate-400">
                  Language: {previewNote.language.toUpperCase()} • {previewNote.duration_minutes} min read
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setPreviewNote(null)}>
                ✕ Close
              </Button>
            </div>
            <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
              {previewNote.content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
