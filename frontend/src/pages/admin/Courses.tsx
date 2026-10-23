import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { lessonService } from '../../services/lessons';
import { Subject, Course } from '../../types';
import { FolderTree, Plus, BookOpen, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

export const Courses: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // New Subject form
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectDesc, setNewSubjectDesc] = useState('');
  const [creatingSubject, setCreatingSubject] = useState(false);

  // New Course form
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [newCourseGrade, setNewCourseGrade] = useState('8th Grade');
  const [creatingCourse, setCreatingCourse] = useState(false);

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const s = await lessonService.getSubjects();
      setSubjects(s);
      if (s.length > 0) {
        setSelectedSubjectId((prev) => prev ?? s[0].id);
      }
      const c = await lessonService.getAdminCourses();
      setCourses(c);
    } catch (err: any) {
      console.error('Error loading curriculum data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) {
      setMessage({ text: 'Please enter a valid subject name.', type: 'error' });
      return;
    }
    setCreatingSubject(true);
    setMessage(null);
    try {
      const created = await lessonService.createSubject({
        name: newSubjectName.trim(),
        description: newSubjectDesc.trim(),
      });
      setNewSubjectName('');
      setNewSubjectDesc('');
      setMessage({ text: `Subject "${created.name}" created successfully!`, type: 'success' });
      await loadData();
      setSelectedSubjectId(created.id);
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to create subject.', type: 'error' });
    } finally {
      setCreatingSubject(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle.trim()) {
      setMessage({ text: 'Please enter a course title.', type: 'error' });
      return;
    }
    const targetSubjectId = selectedSubjectId || (subjects.length > 0 ? subjects[0].id : 1);
    setCreatingCourse(true);
    setMessage(null);
    try {
      const created = await lessonService.createCourse({
        subject_id: targetSubjectId,
        title: newCourseTitle.trim(),
        description: newCourseDesc.trim(),
        grade_level: newCourseGrade,
        is_published: true,
      });
      setNewCourseTitle('');
      setNewCourseDesc('');
      setMessage({ text: `Course "${created.title}" added successfully!`, type: 'success' });
      await loadData();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to create course.', type: 'error' });
    } finally {
      setCreatingCourse(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="cyan">Curriculum Taxonomy</Badge>
          <span className="text-xs text-slate-400">Total Subjects: {subjects.length} • Courses: {courses.length}</span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight mt-1">Subjects & Course Management</h1>
        <p className="text-xs text-slate-400 mt-1">
          Define core academic subjects and structure courses for rural school grade levels.
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Subject */}
        <Card className="p-6 bg-slate-900/90 border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-cyan-400" /> 1. Add Academic Subject
            </h2>
            <Badge variant="outline" className="text-[10px] text-cyan-300">Root Node</Badge>
          </div>
          <form onSubmit={handleCreateSubject} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Subject Name *</label>
              <Input
                placeholder="e.g. Physics, Chemistry, Biology, Tamil, Computer Science"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Description / Syllabus Outline</label>
              <Input
                placeholder="e.g. Fundamental scientific principles, formulas, and concepts"
                value={newSubjectDesc}
                onChange={(e) => setNewSubjectDesc(e.target.value)}
              />
            </div>
            <Button type="submit" variant="primary" size="sm" disabled={creatingSubject} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-1.5" /> {creatingSubject ? 'Adding Subject...' : 'Save Subject'}
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-800 space-y-2">
            <h4 className="text-xs font-semibold text-slate-400">Available Subjects ({subjects.length})</h4>
            <div className="flex flex-wrap gap-2">
              {subjects.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSubjectId(s.id)}
                  className={`px-3 py-1.5 rounded-lg border text-xs transition-all flex items-center gap-1.5 ${
                    selectedSubjectId === s.id
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold'
                      : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <FolderTree className="w-3.5 h-3.5" />
                  <span>{s.name}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Create Course */}
        <Card className="p-6 bg-slate-900/90 border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-400" /> 2. Add Course Under Subject
            </h2>
            <Badge variant="outline" className="text-[10px] text-purple-300">Course Syllabus</Badge>
          </div>
          <form onSubmit={handleCreateCourse} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Target Subject *</label>
              <select
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                value={selectedSubjectId || ''}
                onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Course Title *</label>
              <Input
                placeholder="e.g. Rutherford-Bohr Atomic Structure & Periodic Table"
                value={newCourseTitle}
                onChange={(e) => setNewCourseTitle(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Target Grade</label>
                <select
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  value={newCourseGrade}
                  onChange={(e) => setNewCourseGrade(e.target.value)}
                >
                  <option value="6th Grade">6th Grade</option>
                  <option value="7th Grade">7th Grade</option>
                  <option value="8th Grade">8th Grade</option>
                  <option value="9th Grade">9th Grade</option>
                  <option value="10th Grade">10th Grade</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Course Overview</label>
                <Input
                  placeholder="Summary of modules"
                  value={newCourseDesc}
                  onChange={(e) => setNewCourseDesc(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" variant="secondary" size="sm" disabled={creatingCourse} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-1.5" /> {creatingCourse ? 'Adding Course...' : 'Save Course'}
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-800 space-y-2">
            <h4 className="text-xs font-semibold text-slate-400">Total Courses Registered ({courses.length})</h4>
            <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
              {courses.map((c) => {
                const sub = subjects.find((s) => s.id === c.subject_id);
                return (
                  <div key={c.id} className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-white block">{c.title}</span>
                      <span className="text-[10px] text-slate-400">
                        {sub?.name || 'General'} • {c.grade_level}
                      </span>
                    </div>
                    <Badge variant="purple" className="text-[10px]">Published</Badge>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
