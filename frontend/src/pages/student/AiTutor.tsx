import React, { useState } from 'react';
import { ChatInterface } from '../../features/ai-tutor/ChatInterface';
import { StudentLessonUploader } from '../../features/ai-tutor/StudentLessonUploader';
import { Bot, UploadCloud, Sparkles, BookOpen } from 'lucide-react';
import { Badge } from '../../components/ui/badge';

export const AiTutor: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'uploader'>('uploader');
  const [initialContext, setInitialContext] = useState<string | undefined>(undefined);

  const handleStartChatWithContext = (title: string, content: string) => {
    setInitialContext(`Lesson: ${title}\n${content}`);
    setActiveTab('chat');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="cyan">Multilingual AI Tutor & RAG</Badge>
            <span className="text-xs text-slate-400">Personalized Rural Education Assistant</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">
            AI Tutor & Student Lesson Study Center
          </h1>
          <p className="text-xs text-slate-400">
            Upload your own textbook chapters, generate revision notes & self-test questions, or chat in English, Tamil, Hindi, or Telugu.
          </p>
        </div>
      </div>

      {/* Top Navigation Pill Bar */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('uploader')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'uploader'
              ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <UploadCloud className="w-4 h-4 text-cyan-900" />
          <span>Upload Lesson & Generate Notes/Questions</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 hidden sm:inline-block">
            New Feature
          </span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'chat'
              ? 'bg-purple-600 text-white font-black shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bot className="w-4 h-4 text-white" />
          <span>AI Tutor Chat & Q&A</span>
        </button>
      </div>

      {/* Active Tab View */}
      {activeTab === 'uploader' && (
        <StudentLessonUploader onStartChatWithContext={handleStartChatWithContext} />
      )}

      {activeTab === 'chat' && (
        <ChatInterface initialContext={initialContext} />
      )}
    </div>
  );
};
