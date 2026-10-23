import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Bot,
  User as UserIcon,
  BookOpen,
  Sparkles,
  FileQuestion,
  AlertCircle,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { aiService } from '../../services/ai';
import { DocumentItem } from '../../types';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  sources?: string[];
  timestamp: string;
}

interface ChatInterfaceProps {
  initialContext?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ initialContext }) => {
  const [activeContext, setActiveContext] = useState<string | undefined>(initialContext);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: initialContext
        ? `Vanakkam! Namaste! Hello! I have loaded your uploaded lesson into our study session. Ask me any question about it in English, Tamil, Hindi, or Telugu!`
        : 'Vanakkam! Namaste! Hello! I am your RuralVerse Multilingual AI Tutor. Ask me any question about your lessons, science experiments, or math concepts in your preferred language.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState<string>('');
  const [language, setLanguage] = useState<string>('en');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // RAG PDF question generator state
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    // Load indexed documents for RAG question generation
    aiService.getKnowledgeDocuments().then((docs) => {
      setDocuments(docs);
      if (docs.length > 0) setSelectedDocId(docs[0].id);
    }).catch(() => {});
  }, []);

  // Voice speech-to-text
  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use keyboard input.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'ta' ? 'ta-IN' : language === 'hi' ? 'hi-IN' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.start();
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    setErrorMessage(null);

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const result = await aiService.chat(userText, language, activeContext);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: result.response,
        sources: result.sources,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorDetail = err.response?.data?.detail || 'AI Tutor query failed. Please verify internet connection.';
      setErrorMessage(errorDetail);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: `⚠️ ${errorDetail}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Explicit feature: Ask questions from uploaded lesson PDF via RAG
  const handleGeneratePdfQuestions = async () => {
    if (!selectedDocId) return;
    setIsGeneratingQuestions(true);
    setErrorMessage(null);
    try {
      const res = await aiService.generateQuestionsFromPdf(selectedDocId, 3);
      setGeneratedQuestions(res.questions || []);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || 'Failed to generate assessment questions from PDF.');
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      {/* Main Chat Interface */}
      <div className="lg:col-span-2 flex flex-col bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                RuralVerse Multilingual Tutor
                <Badge variant="cyan">Gemini RAG</Badge>
                {activeContext && (
                  <Badge variant="emerald" className="text-[10px]">
                    Lesson Grounded
                  </Badge>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">Ground truth answers backed by indexed local textbooks</p>
            </div>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
            >
              <option value="en">English (English)</option>
              <option value="ta">தமிழ் (Tamil)</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="te">తెలుగు (Telugu)</option>
            </select>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  m.sender === 'user'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                }`}
              >
                {m.sender === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed space-y-2 ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-950/90 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>

                {/* Sourced Passages / Citations */}
                {m.sources && m.sources.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 flex-wrap">
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      Verified Textbook Sources:
                    </span>
                    {m.sources.map((s, idx) => (
                      <span
                        key={idx}
                        className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] px-2 py-0.5 rounded-md"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                <div className="text-[9px] text-slate-500 text-right">{m.timestamp}</div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 text-xs text-slate-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>Searching indexed textbooks & formulating explanation...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-950/80 flex gap-2">
          <Button
            type="button"
            variant={isListening ? 'danger' : 'outline'}
            size="icon"
            onClick={toggleVoiceInput}
            title={isListening ? 'Stop Listening' : 'Speak Question (Speech-to-Text)'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question in English, தமிழ், हिन्दी, or తెలుగు..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />

          <Button type="submit" variant="primary" size="md" disabled={!input.trim() || isLoading}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>

      {/* Right Column: RAG "Ask Questions from Uploaded Lesson PDF" */}
      <Card className="p-5 flex flex-col space-y-4 bg-slate-900/90 overflow-y-auto">
        <div>
          <div className="flex items-center gap-2">
            <FileQuestion className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">RAG Assessment Generator</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Generate self-test questions directly from an uploaded lesson PDF using semantic retrieval.
          </p>
        </div>

        {/* Document Selector */}
        <div>
          <label className="text-xs text-slate-300 font-medium block mb-1.5">Select Textbook Document</label>
          {documents.length > 0 ? (
            <select
              value={selectedDocId || ''}
              onChange={(e) => setSelectedDocId(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            >
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} ({d.status})
                </option>
              ))}
            </select>
          ) : (
            <p className="text-xs text-slate-500 bg-slate-950 p-3 rounded-xl border border-slate-800">
              No textbook PDFs indexed yet. Administrators can upload lesson PDFs in the Admin Console.
            </p>
          )}
        </div>

        <Button
          variant="glow"
          className="w-full"
          disabled={!selectedDocId || isGeneratingQuestions}
          loading={isGeneratingQuestions}
          onClick={handleGeneratePdfQuestions}
        >
          <Sparkles className="w-4 h-4 mr-2" /> Generate Questions from PDF
        </Button>

        {/* Questions Display */}
        <div className="flex-1 space-y-3 overflow-y-auto">
          {generatedQuestions.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                Generated Assessment Questions
              </h4>
              {generatedQuestions.map((q, idx) => (
                <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
                  <div className="font-semibold text-white">
                    Q{idx + 1}: {q.question}
                  </div>
                  {q.options && (
                    <div className="space-y-1 pl-2">
                      {q.options.map((opt: string, optIdx: number) => (
                        <div key={optIdx} className="text-slate-400 text-[11px]">
                          • {opt}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="text-[11px] text-emerald-400 bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                    <strong>Answer:</strong> {q.correct_answer}
                    <div className="text-slate-400 text-[10px] mt-0.5">{q.explanation}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
