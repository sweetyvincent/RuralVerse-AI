import api from './api';
import { DocumentItem } from '../types';

export const aiService = {
  async chat(message: string, language: string = 'en', context?: string): Promise<{ response: string; sources: string[] }> {
    const res = await api.post('/ai/chat', { message, language, context });
    return res.data;
  },

  async generateQuestionsFromPdf(documentId: number, numQuestions: number = 5): Promise<{
    document_title: string;
    document_id: number;
    questions: Array<{
      question: string;
      type: string;
      options: string[];
      correct_answer: string;
      explanation: string;
    }>;
  }> {
    const res = await api.post(`/ai/generate-questions/${documentId}`, null, {
      params: { num_questions: numQuestions },
    });
    return res.data;
  },

  async getKnowledgeDocuments(): Promise<DocumentItem[]> {
    const res = await api.get('/ai/knowledge-base/documents');
    return res.data;
  },

  async uploadKnowledgeDocument(file: File): Promise<DocumentItem> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/ai/knowledge-base/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async indexDocument(documentId: number): Promise<{ status: string; message: string; chunks_indexed: number }> {
    const res = await api.post(`/ai/knowledge-base/documents/${documentId}/index`);
    return res.data;
  },

  async deleteDocument(documentId: number): Promise<void> {
    await api.delete(`/ai/knowledge-base/documents/${documentId}`);
  },
};
