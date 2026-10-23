import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Award, Clock } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { quizService } from '../../services/quizzes';
import { Quiz, QuizAttempt as QuizAttemptType } from '../../types';

export const QuizAttempt: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<QuizAttemptType | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      quizService.getQuiz(Number(id))
        .then(async (quizData) => {
          setQuiz(quizData);
          // Start attempt session on server
          const attempt = await quizService.startAttempt(quizData.id);
          setAttemptId(attempt.id);
        })
        .catch((err) => console.log('Error initializing quiz:', err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleSelectOption = (questionId: number, optionId: number) => {
    if (result) return; // Readonly after submit
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    if (!quiz || !attemptId) return;
    setSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([qId, optId]) => ({
        question_id: Number(qId),
        selected_option_id: optId,
      }));
      const evaluated = await quizService.submitAttempt(quiz.id, attemptId, formattedAnswers);
      setResult(evaluated);
    } catch (err: any) {
      alert('Failed to submit quiz attempt. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-xs text-slate-400">Loading assessment questions...</div>;
  }

  if (!quiz) {
    return (
      <div className="text-center py-20 text-xs text-slate-400 space-y-3">
        <p>Quiz not found.</p>
        <Link to="/student/quizzes"><Button variant="outline" size="sm">Back</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/student/quizzes">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" /> All Quizzes
          </Button>
        </Link>
        <Badge variant="purple">Passing Criteria: {quiz.passing_score}%</Badge>
      </div>

      <Card className="p-8 bg-slate-900/90 border-slate-800 space-y-6">
        <div className="space-y-2 pb-4 border-b border-slate-800">
          <h1 className="text-2xl font-black text-white">{quiz.title}</h1>
          <p className="text-xs text-slate-400">{quiz.description}</p>
        </div>

        {/* Post-Submission Result Banner */}
        {result && (
          <div className={`p-6 rounded-2xl border ${
            result.score >= quiz.passing_score
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          } space-y-2 text-center`}>
            <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center font-bold bg-slate-950/40">
              <Award className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black">
              Your Evaluated Score: {result.score} / {result.total_points} ({Math.round((result.score / (result.total_points || 1)) * 100)}%)
            </h2>
            <p className="text-xs">
              {result.score >= quiz.passing_score
                ? 'Congratulations! You have demonstrated strong concept mastery.'
                : 'Good attempt. Review the explanations below and try practicing in the Air-Writing Studio!'}
            </p>
          </div>
        )}

        {/* Questions List */}
        <div className="space-y-6">
          {quiz.questions && quiz.questions.length > 0 ? (
            quiz.questions.map((q, idx) => (
              <div key={q.id} className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-sm font-bold text-white leading-relaxed">
                    <span className="text-cyan-400 mr-2">Q{idx + 1}.</span>
                    {q.question_text}
                  </h3>
                  <span className="text-[10px] text-slate-500 shrink-0">{q.points} pt(s)</span>
                </div>

                {/* Multiple Choice Options */}
                <div className="space-y-2">
                  {q.options.map((opt) => {
                    const isSelected = answers[q.id] === opt.id;
                    return (
                      <label
                        key={opt.id}
                        onClick={() => opt.id && handleSelectOption(q.id, opt.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 font-semibold'
                            : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question_${q.id}`}
                          checked={isSelected}
                          onChange={() => {}}
                          className="text-cyan-500 focus:ring-0"
                        />
                        <span>{opt.option_text}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Show explanation after evaluation */}
                {result && q.explanation && (
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Concept Explanation:</span>
                    <p className="text-slate-300">{q.explanation}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 text-center py-6">No questions have been configured for this quiz.</p>
          )}
        </div>

        {/* Submit Actions */}
        {!result ? (
          <Button
            variant="glow"
            className="w-full text-sm font-bold py-3"
            loading={submitting}
            onClick={handleSubmit}
            disabled={Object.keys(answers).length === 0}
          >
            Submit Assessment for Immediate Grading
          </Button>
        ) : (
          <Link to="/student/quizzes">
            <Button variant="outline" className="w-full">
              Back to Assessment Hub
            </Button>
          </Link>
        )}
      </Card>
    </div>
  );
};
