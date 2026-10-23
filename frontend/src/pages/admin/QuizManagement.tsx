import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { quizService } from '../../services/quizzes';
import { lessonService } from '../../services/lessons';
import { Quiz, Course } from '../../types';
import { Award, Plus, CheckCircle, Trash2 } from 'lucide-react';

export const QuizManagement: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  // New Quiz form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [passingScore, setPassingScore] = useState(60);
  const [timeLimit, setTimeLimit] = useState(20);

  // Question adding state
  const [activeQuizId, setActiveQuizId] = useState<number | null>(null);
  const [qText, setQText] = useState('');
  const [opt1, setOpt1] = useState('');
  const [opt2, setOpt2] = useState('');
  const [opt3, setOpt3] = useState('');
  const [opt4, setOpt4] = useState('');
  const [correctOptIdx, setCorrectOptIdx] = useState(0);
  const [explanation, setExplanation] = useState('');

  const [message, setMessage] = useState<string | null>(null);

  const loadData = () => {
    lessonService.getAdminCourses().then((c) => {
      setCourses(c);
      if (c.length > 0 && !selectedCourseId) setSelectedCourseId(c[0].id);
    });
    quizService.getAdminQuizzes().then(setQuizzes);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !title) return;
    await quizService.createQuiz({
      course_id: selectedCourseId,
      title,
      description,
      passing_score: passingScore,
      time_limit_minutes: timeLimit,
      is_published: true,
    });
    setTitle('');
    setDescription('');
    setMessage('Quiz created successfully.');
    loadData();
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuizId || !qText) return;

    const options = [
      { option_text: opt1, is_correct: correctOptIdx === 0 },
      { option_text: opt2, is_correct: correctOptIdx === 1 },
      { option_text: opt3, is_correct: correctOptIdx === 2 },
      { option_text: opt4, is_correct: correctOptIdx === 3 },
    ].filter((o) => o.option_text.trim() !== '');

    await quizService.addQuestion(activeQuizId, {
      question_text: qText,
      question_type: 'multiple_choice',
      points: 10,
      explanation,
      options,
    });

    setQText('');
    setOpt1('');
    setOpt2('');
    setOpt3('');
    setOpt4('');
    setExplanation('');
    setMessage('Question added to quiz.');
    loadData();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Quiz & Assessment Management</h1>
        <p className="text-xs text-slate-400 mt-1">Author quizzes, configure multiple-choice questions and explanations.</p>
      </div>

      {message && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> <span>{message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Quiz Form */}
        <Card className="lg:col-span-1 p-6 bg-slate-900/90 border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-purple-400" /> Create Assessment
          </h2>
          <form onSubmit={handleCreateQuiz} className="space-y-3">
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
              label="Quiz Title"
              placeholder="e.g. Electric Circuit Concepts Quiz"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <Input
              label="Description"
              placeholder="Instructions for students"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                label="Passing Score (%)"
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
              />
              <Input
                type="number"
                label="Time Limit (min)"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
              />
            </div>

            <Button type="submit" variant="glow" size="sm" className="w-full">
              Publish Quiz
            </Button>
          </form>
        </Card>

        {/* Existing Quizzes & Question Editor */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            Active Assessments ({quizzes.length})
          </h2>

          <div className="space-y-3">
            {quizzes.map((q) => (
              <Card key={q.id} className="p-4 bg-slate-900/80 border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm">{q.title}</h3>
                    <p className="text-[10px] text-slate-400">Pass: {q.passing_score}% • {q.time_limit_minutes} min limit</p>
                  </div>
                  <Button
                    variant={activeQuizId === q.id ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setActiveQuizId(activeQuizId === q.id ? null : q.id)}
                  >
                    {activeQuizId === q.id ? 'Close Question Form' : '+ Add Question'}
                  </Button>
                </div>

                {/* Question Form when active */}
                {activeQuizId === q.id && (
                  <form onSubmit={handleAddQuestion} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 mt-3">
                    <h4 className="text-xs font-bold text-cyan-400">Add Question to "{q.title}"</h4>
                    <Input
                      label="Question Prompt"
                      placeholder="e.g. Which of the following is a good electrical conductor?"
                      value={qText}
                      onChange={(e) => setQText(e.target.value)}
                      required
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label="Option A"
                        value={opt1}
                        onChange={(e) => setOpt1(e.target.value)}
                        placeholder="e.g. Copper Wire"
                        required
                      />
                      <Input
                        label="Option B"
                        value={opt2}
                        onChange={(e) => setOpt2(e.target.value)}
                        placeholder="e.g. Rubber Eraser"
                        required
                      />
                      <Input
                        label="Option C"
                        value={opt3}
                        onChange={(e) => setOpt3(e.target.value)}
                        placeholder="e.g. Dry Wood"
                      />
                      <Input
                        label="Option D"
                        value={opt4}
                        onChange={(e) => setOpt4(e.target.value)}
                        placeholder="e.g. Glass Tube"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-300 font-medium block mb-1">Correct Option</label>
                      <select
                        value={correctOptIdx}
                        onChange={(e) => setCorrectOptIdx(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                      >
                        <option value={0}>Option A is Correct</option>
                        <option value={1}>Option B is Correct</option>
                        <option value={2}>Option C is Correct</option>
                        <option value={3}>Option D is Correct</option>
                      </select>
                    </div>

                    <Input
                      label="Concept Explanation (Displayed post-submission)"
                      placeholder="e.g. Copper contains free mobile electrons that drift easily."
                      value={explanation}
                      onChange={(e) => setExplanation(e.target.value)}
                    />

                    <Button type="submit" variant="glow" size="sm" className="w-full">
                      Save Question
                    </Button>
                  </form>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
