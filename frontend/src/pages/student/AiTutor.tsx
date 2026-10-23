import React from 'react';
import { ChatInterface } from '../../features/ai-tutor/ChatInterface';

export const AiTutor: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">AI Multilingual Tutor & RAG</h1>
          <p className="text-xs text-slate-400 mt-1">
            Ask academic questions in English, தமிழ், हिन्दी, or తెలుగు. Answers cite indexed local textbooks.
          </p>
        </div>
      </div>
      <ChatInterface />
    </div>
  );
};
