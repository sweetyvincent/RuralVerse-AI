import api from './api';
import { DocumentItem } from '../types';

export interface LessonAnalysisResult {
  title: string;
  summary: string;
  key_concepts: Array<{ term: string; definition: string }>;
  formulas_and_rules: string[];
  bullet_takeaways: string[];
  mcq_questions: Array<{
    id: number;
    question: string;
    options: string[];
    correct_answer: string;
    explanation: string;
  }>;
  short_answer_questions: Array<{
    id: number;
    question: string;
    ideal_answer: string;
    key_point: string;
  }>;
}

export const aiService = {
  async chat(message: string, language: string = 'en', context?: string): Promise<{ response: string; sources: string[] }> {
    const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');
    if (!isGitHubPages) {
      try {
        const res = await api.post('/ai/chat', { message, language, context });
        return res.data;
      } catch (err) {
        console.warn('Backend AI chat error, falling back:', err);
      }
    }

    // Static/offline tutor response fallback
    const lower = message.toLowerCase();
    let reply = `Hello! I am your RuralVerse Multilingual AI Tutor. Regarding your question: "${message}": `;
    if (context) {
      reply += `Based directly on your uploaded lesson study notes:\n\n${context.slice(0, 300)}...\n\n`;
    }
    if (lower.includes('heart') || lower.includes('blood')) {
      reply += 'The human heart is a 4-chambered muscular pump. The left ventricle pumps oxygenated blood through the aorta, while the right ventricle pumps deoxygenated blood to the lungs.';
    } else if (lower.includes('circuit') || lower.includes('ohm') || lower.includes('volt')) {
      reply += "Ohm's Law states that V = I * R. Voltage is the electromotive potential driving current (I) through a resistor (R) in a closed circuit loop.";
    } else if (lower.includes('cell') || lower.includes('plant') || lower.includes('photosynthesis')) {
      reply += 'Plant cells possess a rigid cellulose cell wall and chloroplasts containing chlorophyll, which capture sunlight to convert CO2 and water into glucose and oxygen (6CO2 + 6H2O -> C6H12O6 + 6O2).';
    } else if (lower.includes('atom') || lower.includes('electron') || lower.includes('proton')) {
      reply += 'The Bohr model arranges electrons in quantized shells (K, L, M) surrounding a dense nucleus composed of positively charged protons and neutral neutrons.';
    } else {
      reply += 'Key scientific concepts are best understood through observation and fundamental laws. Review the key notes and self-test questions generated from your study material!';
    }

    return {
      response: reply,
      sources: context ? ['Student Uploaded Lesson'] : ['Rural Education Standard Curriculum'],
    };
  },

  async uploadStudentLesson(file: File): Promise<{ title: string; filename: string; content: string }> {
    const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');
    if (!isGitHubPages) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post('/ai/student/upload-lesson', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
      } catch (err) {
        console.warn('Server upload error, reading file locally in browser:', err);
      }
    }

    // Browser client-side file reading fallback (works everywhere, including GitHub Pages)
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const title = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      reader.onload = (e) => {
        const content = (e.target?.result as string) || '';
        resolve({
          title,
          filename: file.name,
          content,
        });
      };
      reader.onerror = () => reject(new Error('Failed to read file in browser.'));
      reader.readAsText(file);
    });
  },

  async analyzeLesson(data: { title: string; content: string; language?: string }): Promise<LessonAnalysisResult> {
    const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');
    if (!isGitHubPages) {
      try {
        const res = await api.post('/ai/student/analyze-lesson', data);
        return res.data;
      } catch (err) {
        console.warn('Backend analyze error, executing client-side analysis:', err);
      }
    }

    // Client-side instant pedagogical analyzer
    const text = data.content.trim();
    const title = data.title.trim() || 'Uploaded Study Lesson';
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const sentences = text.replace(/\n+/g, ' ').split(/[.?!]/).map((s) => s.trim()).filter((s) => s.length > 15);

    const summary = sentences.slice(0, 3).join('. ') + (sentences.length > 0 ? '.' : text.slice(0, 200));

    // Extract terms with colons or hyphens
    const concepts: Array<{ term: string; definition: string }> = [];
    lines.forEach((l) => {
      if (l.includes(':') && l.length < 160) {
        const [term, def] = l.split(':', 2);
        if (term.trim() && def.trim()) {
          concepts.push({
            term: term.replace(/^[-*•\d.]+\s*/, '').trim(),
            definition: def.trim(),
          });
        }
      }
    });

    if (concepts.length === 0) {
      concepts.push(
        { term: 'Core Concept', definition: sentences[0] || 'Primary educational principle of the lesson.' },
        { term: 'Key Application', definition: sentences[1] || 'Real-world manifestation and practical use.' },
        { term: 'Essential Vocabulary', definition: 'Technical nomenclature and standard definitions defined in this chapter.' }
      );
    }

    const takeaways = sentences.slice(1, 6).map((s) => s + '.');
    if (takeaways.length === 0) {
      takeaways.push(
        'Thoroughly review the foundational principles outlined in the text.',
        'Memorize core formulas and their associated physical units.',
        'Use the self-test quiz questions to evaluate your conceptual recall.'
      );
    }

    const mcqs = concepts.slice(0, 3).map((c, idx) => ({
      id: idx + 1,
      question: `According to this lesson, what is the correct definition of "${c.term}"?`,
      options: [
        c.definition,
        `An extraneous condition that only occurs at high temperatures.`,
        `An opposing variable with inverse physical properties.`,
        `A non-standard alternative definition not supported by the lesson.`,
      ],
      correct_answer: c.definition,
      explanation: `As detailed in your uploaded lesson notes, ${c.term} is defined as: ${c.definition}`,
    }));

    mcqs.push({
      id: mcqs.length + 1,
      question: `What is the central learning outcome of the lesson "${title}"?`,
      options: [
        summary.slice(0, 90) + '...',
        'Peripheral history unrelated to scientific application.',
        'A purely fictional hypothesis with no measurable consequences.',
        'Historical debate with no modern relevance.',
      ],
      correct_answer: summary.slice(0, 90) + '...',
      explanation: 'This captures the executive thesis and conceptual foundation of the uploaded text.',
    });

    return {
      title,
      summary,
      key_concepts: concepts,
      formulas_and_rules: [
        'Ensure all variable substitutions match standard SI units (meters, seconds, kilograms, amperes, volts).',
        'Verify conservation laws and boundary conditions governing the system.',
      ],
      bullet_takeaways: takeaways,
      mcq_questions: mcqs,
      short_answer_questions: [
        {
          id: 1,
          question: `Explain how the principles in "${title}" operate in natural or physical systems.`,
          ideal_answer: summary,
          key_point: 'Clearly define the governing mechanism and its direct consequences.',
        },
        {
          id: 2,
          question: 'How can the concepts in this lesson be observed in everyday rural life or agriculture?',
          ideal_answer: 'The foundational concepts describe tangible physical forces, energy transfers, or biological growth seen in everyday local environments.',
          key_point: 'Relate the theoretical textbook concept to observable real-world behavior.',
        },
      ],
    };
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
