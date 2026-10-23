import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Globe, ArrowRight, Download, Search, AlertCircle } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { lessonService } from '../../services/lessons';
import { Lesson, Course } from '../../types';

export const Lessons: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([lessonService.getLessons(), lessonService.getCourses()])
      .then(([lessonsData, coursesData]) => {
        setLessons(lessonsData);
        setCourses(coursesData);
      })
      .catch((err) => console.log('Error loading lessons:', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredLessons = lessons.filter((l) => {
    const matchesCourse = selectedCourse ? l.course_id === selectedCourse : true;
    const matchesSearch = l.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCourse && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Lesson Library</h1>
          <p className="text-xs text-slate-400 mt-1">Structured curriculum modules published by authorized educators.</p>
        </div>

        {/* Search */}
        <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="Search lessons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Course Filter Pills */}
      {courses.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCourse(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
              selectedCourse === null ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            All Courses
          </button>
          {courses.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCourse(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                selectedCourse === c.id ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              {c.title}
            </button>
          ))}
        </div>
      )}

      {/* Lesson Grid */}
      {filteredLessons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.map((lesson) => (
            <Card key={lesson.id} className="p-5 flex flex-col justify-between bg-slate-900/80 hover:border-cyan-500/40 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="cyan">Module #{lesson.order + 1}</Badge>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {lesson.duration_minutes || 20} min
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{lesson.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {lesson.content || 'Comprehensive educational module covering foundational concepts, formulas, and real-world examples.'}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 flex items-center gap-1 uppercase">
                  <Globe className="w-3 h-3 text-cyan-400" /> Language: {lesson.language}
                </span>
                <Link to={`/student/lessons/${lesson.id}`}>
                  <Button variant="outline" size="sm">
                    Read Lesson <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-2">
          <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-400">No lessons available yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Authorized teachers or administrators have not published lessons in this course category yet. Check back soon!
          </p>
        </div>
      )}
    </div>
  );
};
