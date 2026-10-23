import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { lessonService } from '../../services/lessons';
import { Subject, Course } from '../../types';
import { FolderTree, Plus, BookOpen, CheckCircle } from 'lucide-react';

export const Courses: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectDesc, setNewSubjectDesc] = useState('');

  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseGrade, setNewCourseGrade] = useState('8th Grade');
  const [message, setMessage] = useState<string | null>(null);

  const loadData = () => {
    lessonService.getSubjects().then((s) => {
      setSubjects(s);
      if (s.length > 0 && !selectedSubjectId) setSelectedSubjectId(s[0].id);
    });
    lessonService.getAdminCourses().then(setCourses);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName) return;
    await lessonService.createSubject({ name: newSubjectName, description: newSubjectDesc });
    setNewSubjectName('');
    setNewSubjectDesc('');
    setMessage('Subject created successfully.');
    loadData();
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId || !newCourseTitle) return;
    await lessonService.createCourse({
      subject_id: selectedSubjectId,
      title: newCourseTitle,
      grade_level: newCourseGrade,
      is_published: true,
    });
    setNewCourseTitle('');
    setMessage('Course created successfully.');
    loadData();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Curriculum Structure: Subjects & Courses</h1>
        <p className="text-xs text-slate-400 mt-1">Organize educational taxonomy by academic field and grade level.</p>
      </div>

      {message && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> <span>{message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Subject */}
        <Card className="p-6 bg-slate-900/90 border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-cyan-400" /> Add Academic Subject
          </h2>
          <form onSubmit={handleCreateSubject} className="space-y-3">
            <Input
              label="Subject Name"
              placeholder="e.g. Physics, Mathematics, Tamil"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              required
            />
            <Input
              label="Description"
              placeholder="Brief syllabus outline"
              value={newSubjectDesc}
              onChange={(e) => setNewSubjectDesc(e.target.value)}
            />
            <Button type="submit" variant="primary" size="sm">
              <Plus className="w-4 h-4 mr-1.5" /> Create Subject
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-800 space-y-2">
            <h4 className="text-xs font-semibold text-slate-400">Existing Subjects ({subjects.length})</h4>
            <div className="flex flex-wrap gap-2">
              {subjects.map((s) => (
                <span key={s.id} className="p-2 bg-slate-950 rounded-lg border border-slate-800 text-xs text-white">
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        </Card>

        {/* Create Course */}
        <Card className="p-6 bg-slate-900/90 border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-400" /> Add Course / Textbook
          </h2>
          <form onSubmit={handleCreateCourse} className="space-y-3">
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Subject</label>
              <select
                value={selectedSubjectId || ''}
                onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Course Title"
              placeholder="e.g. Grade 8 Basic Electricity & Circuits"
              value={newCourseTitle}
              onChange={(e) => setNewCourseTitle(e.target.value)}
              required
            />

            <Input
              label="Target Grade Level"
              placeholder="e.g. 8th Grade"
              value={newCourseGrade}
              onChange={(e) => setNewCourseGrade(e.target.value)}
            />

            <Button type="submit" variant="glow" size="sm">
              <Plus className="w-4 h-4 mr-1.5" /> Publish Course
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-800 space-y-2">
            <h4 className="text-xs font-semibold text-slate-400">Active Courses ({courses.length})</h4>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {courses.map((c) => (
                <div key={c.id} className="p-2 bg-slate-950 rounded-lg border border-slate-800 text-xs flex justify-between items-center">
                  <span className="font-semibold text-white">{c.title}</span>
                  <Badge variant="cyan">{c.grade_level}</Badge>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
