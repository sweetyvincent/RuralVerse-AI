import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle,
  HelpCircle,
  Download,
  BookOpen,
  ArrowRight,
  RotateCcw,
  Check,
  X,
  FileQuestion,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { aiService, LessonAnalysisResult } from '../../services/ai';

interface Props {
  onStartChatWithContext?: (lessonTitle: string, lessonContent: string) => void;
}

const SAMPLE_LESSONS = [
  {
    title: 'Photosynthesis & Chloroplast Function',
    content: `# Photosynthesis in Green Plants

Photosynthesis is the biochemical process by which autotrophic organisms (plants and algae) convert light energy from the sun into chemical energy stored in glucose.

### The Photosynthesis Equation:
6CO₂ + 6H₂O + Sunlight (Photons) ➔ C₆H₁₂O₆ + 6O₂

### Key Organelles & Pigments:
- **Chloroplast:** Double-membrane plastid containing stacks of thylakoid membranes called grana.
- **Chlorophyll:** The green pigment located in the thylakoid membrane that absorbs blue and red wavelengths while reflecting green light.
- **Stomata:** Microscopic pores on leaf epidermis regulated by guard cells that facilitate gas exchange (CO₂ in, O₂ out).
- **Light Reactions:** Occur in the thylakoid membrane where light splits water molecules (photolysis) to generate ATP and NADPH.
- **Calvin Cycle (Dark Reactions):** Occurs in the stroma where CO₂ is fixed into carbohydrate glucose molecules without direct light requirement.

### Ecological Importance:
Photosynthesis produces virtually all breathable oxygen in Earth's atmosphere and serves as the primary base for global food chains and rural agricultural harvests.`,
  },
  {
    title: "Ohm's Law & Electric DC Circuits",
    content: `# Electric Circuits & Ohm's Law

An electric circuit is a continuous closed conducting path through which electric charges (electrons) drift under the influence of an electric potential difference.

### Ohm's Law Statement:
At constant temperature, the electric current (I) flowing through a metallic conductor is directly proportional to the potential difference (V) applied across its terminals.

Formula: V = I × R
- **V (Voltage):** Measured in Volts (V), the electromotive force driving charge carriers.
- **I (Current):** Measured in Amperes (A), the rate of charge flow: I = Q / t.
- **R (Resistance):** Measured in Ohms (Ω), the opposition offered by atoms of the conductor to electron flow.

### Circuit Components & Laws:
- **Series Circuit:** Current remains identical through all resistors, while total voltage divides: R_total = R₁ + R₂ + R₃.
- **Parallel Circuit:** Voltage remains identical across all branches, while current divides: 1/R_total = 1/R₁ + 1/R₂ + 1/R₃.
- **Tungsten Filament:** High-resistance thin wire inside incandescent bulbs that heats to white-hot incandescence when current passes through.`,
  },
];

export const StudentLessonUploader: React.FC<Props> = ({ onStartChatWithContext }) => {
  const [lessonTitle, setLessonTitle] = useState<string>('');
  const [lessonText, setLessonText] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<LessonAnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'notes' | 'quiz' | 'ask_ai'>('notes');

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [revealedShortAnswers, setRevealedShortAnswers] = useState<Record<number, boolean>>({});

  // Question chat question input
  const [directQuestion, setDirectQuestion] = useState<string>('');
  const [notesFilter, setNotesFilter] = useState<string>('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setErrorMessage(null);

    try {
      setIsProcessing(true);
      setProcessingStatus(file.name.toLowerCase().endsWith('.pdf') ? 'Extracting text from PDF document...' : 'Reading file content...');
      const res = await aiService.uploadStudentLesson(file);
      
      if (res.content.startsWith('%PDF-') || res.content.includes('/FlateDecode')) {
        throw new Error('This PDF contains compressed binary streams without a readable text layer. Please copy-paste the text directly into the box.');
      }

      setLessonTitle(res.title);
      setLessonText(res.content);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to read PDF text. Please copy and paste the lesson text directly.');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const handleGenerateNotes = async () => {
    const trimmed = lessonText.trim();
    if (!trimmed) return;
    setErrorMessage(null);

    // Guard against binary PDF streams
    if (trimmed.startsWith('%PDF-') || trimmed.includes('/FlateDecode') || trimmed.includes('endobj')) {
      setErrorMessage('Raw binary PDF data detected. Please erase and copy-paste the actual readable text of your lesson.');
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('Analyzing lesson and generating revision notes & quiz...');
    try {
      const result = await aiService.analyzeLesson({
        title: lessonTitle.trim() || 'My Lesson',
        content: trimmed,
      });
      setAnalysis(result);
      setActiveTab('notes');
      setSelectedAnswers({});
      setRevealedShortAnswers({});
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to analyze lesson.');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const loadSample = (sample: typeof SAMPLE_LESSONS[0]) => {
    setLessonTitle(sample.title);
    setLessonText(sample.content);
    setSelectedFile(null);
    setErrorMessage(null);
  };

  const handleSelectOption = (questionId: number, option: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const toggleRevealShortAnswer = (id: number) => {
    setRevealedShortAnswers((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleDownloadRevisionSheet = () => {
    if (!analysis) return;
    let md = `# ${analysis.title} — Key Revision Points Sheet\n\n`;

    md += `## 📌 Executive Summary (Key Points)\n`;
    const summaryList =
      analysis.summary_points && analysis.summary_points.length > 0
        ? analysis.summary_points
        : analysis.summary
        ? analysis.summary.split('. ').map((s) => s.trim()).filter(Boolean)
        : [];
    summaryList.forEach((pt) => {
      md += `- ${pt.endsWith('.') ? pt : pt + '.'}\n`;
    });
    md += `\n`;

    if (analysis.comprehensive_key_points && analysis.comprehensive_key_points.length > 0) {
      md += `## 📚 Comprehensive Section-by-Section Key Notes (All Topics Covered)\n\n`;
      analysis.comprehensive_key_points.forEach((cat) => {
        md += `### ${cat.category}\n`;
        cat.points.forEach((pt) => {
          md += `- ${pt}\n`;
        });
        md += `\n`;
      });
    }

    md += `## 💡 Key Definitions & Scientific Nomenclature\n`;
    analysis.key_concepts.forEach((c) => {
      md += `- **${c.term}:** ${c.definition}\n`;
    });
    md += `\n## ⚡ Core Formulas, Equations & Laws\n`;
    analysis.formulas_and_rules.forEach((f) => {
      md += `- ${f}\n`;
    });
    md += `\n## 🎯 High-Yield Exam Takeaways\n`;
    analysis.bullet_takeaways.forEach((t) => {
      md += `- ${t}\n`;
    });
    md += `\n## 📝 Assessment Quiz Questions\n`;
    analysis.mcq_questions.forEach((q, i) => {
      md += `\n### Q${i + 1}: ${q.question}\n`;
      q.options.forEach((opt) => (md += `- ${opt}\n`));
      md += `**Correct Answer:** ${q.correct_answer}\n*Explanation:* ${q.explanation}\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${analysis.title.replace(/\s+/g, '_')}_Key_Revision_Notes.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Calculate score
  const answeredCount = Object.keys(selectedAnswers).length;
  const correctCount = analysis
    ? analysis.mcq_questions.filter((q) => selectedAnswers[q.id] === q.correct_answer).length
    : 0;

  return (
    <div className="space-y-6">
      {/* Upload & Input Panel */}
      <Card className="p-6 bg-slate-900/90 border-slate-800 space-y-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="cyan">AI Lesson Assistant</Badge>
              <span className="text-xs text-slate-400">PDF, TXT, or Notes</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-cyan-400" /> Upload Your Own Lesson & Notes
            </h2>
            <p className="text-xs text-slate-400">
              Upload textbook chapters or type class notes. RuralVerse AI will automatically generate structured revision notes and an interactive self-test quiz.
            </p>
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-slate-400 font-semibold">Presets:</span>
            {SAMPLE_LESSONS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => loadSample(s)}
                className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-all font-medium"
              >
                {s.title.split('&')[0]}
              </button>
            ))}
          </div>
        </div>

        {errorMessage && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-start gap-2.5">
            <X className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">Document Processing Notice:</span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {processingStatus && (
          <div className="p-3.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-xs text-cyan-300 flex items-center gap-2.5 animate-pulse">
            <Sparkles className="w-4 h-4 shrink-0 text-cyan-400" />
            <span>{processingStatus}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* File drag/drop upload box */}
          <div className="lg:col-span-1 border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 flex flex-col items-center justify-center text-center space-y-3 bg-slate-950/60 transition-all relative">
            <input
              type="file"
              accept=".pdf,.txt,.md"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                {selectedFile ? selectedFile.name : 'Choose Lesson File (PDF / TXT)'}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Drag and drop or click to browse'}
              </span>
            </div>
          </div>

          {/* Title and Content text input */}
          <div className="lg:col-span-2 space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Lesson / Topic Title</label>
              <input
                type="text"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                placeholder="e.g. Newton's Laws of Motion, Plant Tissue Types, Fractions & Ratios"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Lesson Notes & Content (Type or Paste)
              </label>
              <textarea
                value={lessonText}
                onChange={(e) => setLessonText(e.target.value)}
                placeholder="Paste lesson text, textbook paragraphs, definitions, formulas, or study notes..."
                className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 resize-none font-sans leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-slate-500">
            {lessonText ? `${lessonText.length} characters loaded` : 'Enter or upload lesson content above'}
          </span>
          <Button
            variant="primary"
            size="md"
            disabled={!lessonText.trim() || isProcessing}
            onClick={handleGenerateNotes}
            className="flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-cyan-300" />
            <span>{isProcessing ? 'Analyzing Lesson & Generating...' : 'Generate Notes & Questions'}</span>
          </Button>
        </div>
      </Card>

      {/* Analysis Output Section */}
      {analysis && (
        <div className="space-y-4">
          {/* Output Mode Switcher Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'notes'
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>📝 Key Revision Notes</span>
              </button>

              <button
                onClick={() => setActiveTab('quiz')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'quiz'
                    ? 'bg-purple-600 text-white font-black shadow-lg shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileQuestion className="w-4 h-4" />
                <span>❓ Self-Test Quiz ({analysis.mcq_questions.length})</span>
                {answeredCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-slate-900 text-[10px] text-purple-300">
                    {correctCount}/{analysis.mcq_questions.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('ask_ai')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'ask_ai'
                    ? 'bg-emerald-600 text-white font-black shadow-lg shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>💬 Ask AI on this Lesson</span>
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadRevisionSheet}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Revision Sheet (.md)</span>
            </Button>
          </div>

          {/* TAB 1: KEY REVISION NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-6">
              {/* Search & Stats Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900/90 border border-slate-800 rounded-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="cyan" className="font-mono text-xs">
                    {(analysis.comprehensive_key_points?.reduce((acc, c) => acc + c.points.length, 0) || 0) +
                      (analysis.summary_points?.length || 0)}{' '}
                    Key Points Extracted
                  </Badge>
                  <span className="text-xs text-slate-400">
                    All major content from the document organized into high-yield revision bullet points
                  </span>
                </div>
                <div className="w-full sm:w-72">
                  <input
                    type="text"
                    value={notesFilter}
                    onChange={(e) => setNotesFilter(e.target.value)}
                    placeholder="Search key points or concepts..."
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              {/* Main Grid: Left 2 Cols (Key Points & Sections) + Right 1 Col (Formulas, Concepts, Takeaways) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Executive Summary Points & Section-by-Section Points */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Executive Key Points */}
                  <Card className="p-6 bg-slate-900/90 border-slate-800 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                        <BookOpen className="w-4 h-4" />
                        <span>Executive Summary (Key Points)</span>
                      </div>
                      <Badge variant="cyan">High-Yield Core</Badge>
                    </div>
                    <ul className="space-y-2.5">
                      {(analysis.summary_points && analysis.summary_points.length > 0
                        ? analysis.summary_points
                        : analysis.summary
                        ? analysis.summary.split('. ').map((s) => s.trim()).filter(Boolean)
                        : []
                      )
                        .filter((p) => !notesFilter || p.toLowerCase().includes(notesFilter.toLowerCase()))
                        .map((point, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-3 text-xs text-slate-200 leading-relaxed font-sans"
                          >
                            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                              {idx + 1}
                            </span>
                            <span>{point.endsWith('.') ? point : `${point}.`}</span>
                          </li>
                        ))}
                    </ul>
                  </Card>

                  {/* Comprehensive Section-by-Section Key Points (All Content Covered) */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Layers className="w-4 h-4 text-purple-400" /> Comprehensive Notes (All Topics Covered from Document)
                      </h3>
                      <span className="text-[11px] text-slate-400">
                        {analysis.comprehensive_key_points?.length || 0} Categories
                      </span>
                    </div>

                    <div className="space-y-4">
                      {analysis.comprehensive_key_points?.map((section, catIdx) => {
                        const filteredPoints = section.points.filter(
                          (p) => !notesFilter || p.toLowerCase().includes(notesFilter.toLowerCase())
                        );
                        if (notesFilter && filteredPoints.length === 0) return null;

                        return (
                          <Card key={catIdx} className="p-5 bg-slate-900/90 border-slate-800 space-y-3 shadow-lg">
                            <div className="flex items-center justify-between border-b border-slate-800/70 pb-2.5">
                              <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                                {section.category}
                              </h4>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {filteredPoints.length} points
                              </span>
                            </div>
                            <ul className="space-y-2">
                              {filteredPoints.map((pt, pIdx) => (
                                <li
                                  key={pIdx}
                                  className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed pl-1"
                                >
                                  <span className="text-cyan-400 font-black text-sm shrink-0 leading-none mt-0.5">
                                    •
                                  </span>
                                  <span>{pt}</span>
                                </li>
                              ))}
                            </ul>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Column: Formulas, Concepts & Exam Takeaways */}
                <div className="space-y-6">
                  {/* Formulas & Governing Rules */}
                  <Card className="p-5 bg-slate-900/90 border-slate-800 space-y-3 shadow-lg">
                    <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Important Formulas & Laws
                    </h3>
                    <div className="space-y-2">
                      {analysis.formulas_and_rules.map((rule, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200 font-mono"
                        >
                          {rule}
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Key Concepts and Definitions */}
                  <Card className="p-5 bg-slate-900/90 border-slate-800 space-y-3 shadow-lg">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-purple-400" /> Key Concepts & Terms
                      </h3>
                      <Badge variant="purple">{analysis.key_concepts.length}</Badge>
                    </div>

                    <div className="space-y-2.5">
                      {analysis.key_concepts.map((concept, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1"
                        >
                          <span className="font-bold text-cyan-300 text-xs block">{concept.term}</span>
                          <p className="text-[11px] text-slate-400 leading-relaxed">{concept.definition}</p>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Quick Exam Revision Takeaways */}
                  <Card className="p-5 bg-slate-900/90 border-slate-800 space-y-3 shadow-lg">
                    <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" /> High-Yield Exam Takeaways
                    </h3>
                    <ul className="space-y-2.5">
                      {analysis.bullet_takeaways.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                          <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE SELF-TEST QUIZ */}
          {activeTab === 'quiz' && (
            <div className="space-y-6">
              {/* Score Header */}
              <div className="p-4 bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Lesson Assessment & Knowledge Verification</h3>
                  <p className="text-[11px] text-slate-400">
                    Click an option to test your understanding. Instant feedback and explanations are provided.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Score:</span>
                  <Badge variant="purple" className="text-xs font-mono font-bold px-3 py-1">
                    {correctCount} / {analysis.mcq_questions.length} Correct
                  </Badge>
                </div>
              </div>

              {/* MCQs */}
              <div className="space-y-4">
                {analysis.mcq_questions.map((q, idx) => {
                  const userAnswer = selectedAnswers[q.id];
                  const hasAnswered = !!userAnswer;
                  const isCorrect = userAnswer === q.correct_answer;

                  return (
                    <Card key={q.id} className="p-5 bg-slate-900/90 border-slate-800 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-slate-800 text-cyan-400 flex items-center justify-center text-xs shrink-0">
                            Q{idx + 1}
                          </span>
                          <span>{q.question}</span>
                        </h4>
                        {hasAnswered && (
                          <Badge variant={isCorrect ? 'emerald' : 'rose'} className="text-[10px] shrink-0">
                            {isCorrect ? 'Correct' : 'Incorrect'}
                          </Badge>
                        )}
                      </div>

                      {/* Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {q.options.map((opt, optIdx) => {
                          let buttonStyle = 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700';

                          if (hasAnswered) {
                            if (opt === q.correct_answer) {
                              buttonStyle = 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold';
                            } else if (opt === userAnswer) {
                              buttonStyle = 'bg-rose-500/20 border-rose-500/60 text-rose-300 line-through';
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleSelectOption(q.id, opt)}
                              className={`p-3 rounded-xl border text-xs text-left transition-all flex items-start gap-2.5 ${buttonStyle}`}
                            >
                              <span className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center font-mono text-[10px] shrink-0 text-slate-400">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className="leading-relaxed">{opt}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation Reveal */}
                      {hasAnswered && (
                        <div
                          className={`p-3 rounded-xl text-xs space-y-1 ${
                            isCorrect
                              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                              : 'bg-slate-950 border border-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="font-bold flex items-center gap-1.5">
                            {isCorrect ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-rose-400" />}
                            <span>{isCorrect ? 'Well done!' : `Correct Answer: ${q.correct_answer}`}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">{q.explanation}</p>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>

              {/* Conceptual Short-Answer Questions with Model Answer Reveal */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" /> Conceptual Discussion & Exam Flashcards
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.short_answer_questions.map((sq, idx) => {
                    const isRevealed = !!revealedShortAnswers[sq.id];
                    return (
                      <Card key={sq.id} className="p-5 bg-slate-900/90 border-slate-800 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-white text-xs">
                            Essay Flashcard {idx + 1}: {sq.question}
                          </span>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRevealShortAnswer(sq.id)}
                          className="w-full flex items-center justify-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 bg-slate-950 border border-slate-800"
                        >
                          {isRevealed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          <span>{isRevealed ? 'Hide Model Answer' : 'Reveal Ideal Model Answer'}</span>
                        </Button>

                        {isRevealed && (
                          <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-800 text-xs space-y-2">
                            <div className="text-emerald-400 font-semibold text-[11px]">Model Answer:</div>
                            <p className="text-slate-300 leading-relaxed text-[11px]">{sq.ideal_answer}</p>
                            <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
                              Key mark criteria: <span className="text-slate-400">{sq.key_point}</span>
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DIRECT GROUNDED CHAT WITH AI ON THIS LESSON */}
          {activeTab === 'ask_ai' && (
            <Card className="p-6 bg-slate-900/90 border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Ask the AI Tutor About "{analysis.title}"</h3>
              </div>
              <p className="text-xs text-slate-400">
                The AI Tutor will answer your questions specifically based on your uploaded lesson text.
              </p>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
                <div className="font-semibold text-emerald-400">Grounded Lesson Context:</div>
                <div className="font-mono text-[11px] text-slate-400 max-h-28 overflow-y-auto pr-1">
                  {analysis.summary}
                </div>
              </div>

              <Button
                variant="primary"
                onClick={() => {
                  if (onStartChatWithContext) {
                    onStartChatWithContext(analysis.title, analysis.summary);
                  }
                }}
                className="w-full flex items-center justify-center gap-2"
              >
                <span>Launch Interactive Tutor Chat with this Lesson</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
