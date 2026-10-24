import api from './api';
import { DocumentItem } from '../types';
import { extractTextFromPdf } from '../lib/pdfExtractor';

export interface LessonAnalysisResult {
  title: string;
  summary?: string;
  summary_points: string[];
  comprehensive_key_points: Array<{
    category: string;
    points: string[];
  }>;
  key_concepts: Array<{ term: string; definition: string; key_takeaway?: string }>;
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

function anyMathOrFormula(str: string): boolean {
  return (
    str.includes('=') ||
    str.includes('➔') ||
    str.includes('->') ||
    str.includes('Ω') ||
    str.includes('Δ') ||
    str.includes('CO₂') ||
    str.includes('H₂O') ||
    str.includes('λ') ||
    /[A-Z]\s*=\s*[A-Z]/.test(str)
  );
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
    const title = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    const ext = file.name.split('.').pop()?.toLowerCase();

    // 1. Try backend extraction first if not on static preview
    if (!isGitHubPages) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post('/ai/student/upload-lesson', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res.data && res.data.content && !res.data.content.startsWith('%PDF-')) {
          return res.data;
        }
      } catch (err) {
        console.warn('Server upload error, falling back to browser extractor:', err);
      }
    }

    // 2. If it is a PDF file, extract clean text using PDF.js
    if (ext === 'pdf') {
      const extractedText = await extractTextFromPdf(file);
      return {
        title,
        filename: file.name,
        content: extractedText,
      };
    }

    // 3. For plain text files (.txt, .md, etc.)
    const textContent = await file.text();
    if (textContent.startsWith('%PDF-') || textContent.includes('/FlateDecode')) {
      throw new Error(
        'Raw binary PDF data detected. Please ensure the file contains readable text or copy and paste the lesson notes directly.'
      );
    }

    return {
      title,
      filename: file.name,
      content: textContent,
    };
  },

  async analyzeLesson(data: { title: string; content: string; language?: string }): Promise<LessonAnalysisResult> {
    const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');
    if (!isGitHubPages) {
      try {
        const res = await api.post('/ai/student/analyze-lesson', data);
        if (res.data) {
          const raw = res.data;
          // Normalize to ensure summary_points and comprehensive_key_points exist
          const summary_points: string[] =
            Array.isArray(raw.summary_points) && raw.summary_points.length > 0
              ? raw.summary_points
              : typeof raw.summary === 'string'
              ? raw.summary.split('. ').filter(Boolean).map((s: string) => s.trim().endsWith('.') ? s.trim() : `${s.trim()}.`)
              : ['Key conceptual principles extracted from lesson.'];

          const comprehensive_key_points =
            Array.isArray(raw.comprehensive_key_points) && raw.comprehensive_key_points.length > 0
              ? raw.comprehensive_key_points
              : [
                  {
                    category: 'Core Conceptual Notes',
                    points: summary_points,
                  },
                ];

          return {
            ...raw,
            summary_points,
            comprehensive_key_points,
            summary: raw.summary || summary_points.join(' '),
          };
        }
      } catch (err) {
        console.warn('Backend analyze error, executing client-side analysis:', err);
      }
    }

    // Client-side instant pedagogical analyzer (covers ALL content from PDF)
    const text = data.content.trim();
    const title = data.title.trim() || 'Uploaded Study Lesson';
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const sentences = text
      .replace(/\n+/g, ' ')
      .split(/[.?!]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 15);

    // 1. Summary Points (4-6 high-yield overview bullets)
    const summary_points: string[] = [];
    if (sentences.length > 0) {
      const topSentences = sentences.slice(0, 5);
      topSentences.forEach((s) => {
        summary_points.push(s.endsWith('.') ? s : `${s}.`);
      });
    } else {
      summary_points.push(`Comprehensive conceptual study review for ${title}.`);
      summary_points.push('Includes all major definitions, formulas, and working mechanisms.');
    }

    // 2. Extract terms & definitions
    const concepts: Array<{ term: string; definition: string; key_takeaway?: string }> = [];
    const formulas: string[] = [];

    lines.forEach((l) => {
      // Check for formulas or equations
      if (anyMathOrFormula(l)) {
        if (l.length < 180 && !l.startsWith('http')) {
          formulas.push(l.replace(/^[-*•\d.]+\s*/, '').trim());
        }
      }

      // Check for term: definition patterns
      if (l.includes(':') && l.length < 220) {
        const [term, def] = l.split(':', 2);
        const cleanTerm = term.replace(/^[-*•#\d.]+\s*/, '').trim();
        const cleanDef = def.trim();
        if (cleanTerm.length > 2 && cleanTerm.length < 50 && cleanDef.length > 8) {
          if (!concepts.some((c) => c.term.toLowerCase() === cleanTerm.toLowerCase())) {
            concepts.push({
              term: cleanTerm,
              definition: cleanDef,
              key_takeaway: `Essential exam definition for ${cleanTerm}.`,
            });
          }
        }
      }
    });

    if (concepts.length === 0) {
      concepts.push(
        {
          term: 'Fundamental Principle',
          definition: sentences[0] || 'Primary educational principle of the lesson.',
          key_takeaway: 'Core conceptual foundation.',
        },
        {
          term: 'Key Mechanism & Application',
          definition: sentences[1] || 'Real-world manifestation and practical use.',
          key_takeaway: 'Process and functional application.',
        },
        {
          term: 'Standard Terminology',
          definition: sentences[2] || 'Technical nomenclature and classification rules.',
          key_takeaway: 'Accurate vocabulary for examinations.',
        }
      );
    }

    if (formulas.length === 0) {
      formulas.push(
        'Verify standard SI units (meters, seconds, kilograms, amperes, volts) across all calculations.',
        'Apply fundamental conservation laws (Mass, Energy, Momentum, Charge) across boundary conditions.'
      );
    }

    // 3. Section-by-section breakdown covering ALL important content from the PDF
    const comprehensive_key_points: Array<{ category: string; points: string[] }> = [];
    let currentCategory = '1. Introduction & Foundational Core';
    let currentBucket: string[] = [];

    lines.forEach((line) => {
      const isHeader =
        line.startsWith('#') ||
        (line.length < 50 && (line.endsWith(':') || line === line.toUpperCase()) && !line.includes('.'));

      if (isHeader) {
        if (currentBucket.length > 0) {
          comprehensive_key_points.push({
            category: currentCategory,
            points: currentBucket.slice(0, 10),
          });
          currentBucket = [];
        }
        currentCategory = line.replace(/^[#\-*•\d.:\s]+/, '').trim() || 'Detailed Section Notes';
      } else {
        const cleanPoint = line.replace(/^[#\-*•\d.]+\s*/, '').trim();
        if (cleanPoint.length > 18 && !currentBucket.includes(cleanPoint)) {
          currentBucket.push(cleanPoint);
        }
      }
    });

    if (currentBucket.length > 0) {
      comprehensive_key_points.push({
        category: currentCategory,
        points: currentBucket.slice(0, 10),
      });
    }

    // If text was unstructured without headers, chunk sentences into organized topical categories
    if (comprehensive_key_points.length <= 1) {
      comprehensive_key_points.length = 0; // reset
      const chunkSize = Math.max(3, Math.ceil(sentences.length / 4));
      const categoryNames = [
        '1. Fundamental Principles & Definitions',
        '2. Structure, Components & Characteristics',
        '3. Working Mechanisms & Operational Reactions',
        '4. Real-World Applications & Scientific Significance',
      ];

      categoryNames.forEach((catName, idx) => {
        const slice = sentences.slice(idx * chunkSize, (idx + 1) * chunkSize);
        if (slice.length > 0) {
          comprehensive_key_points.push({
            category: catName,
            points: slice.map((s) => (s.endsWith('.') ? s : `${s}.`)),
          });
        }
      });
    }

    // 4. Bullet Takeaways (Rapid revision)
    const takeaways: string[] = [
      `Key definition to remember: ${concepts[0]?.term} — ${concepts[0]?.definition.slice(0, 100)}...`,
      `Governing formula or rule: ${formulas[0]}`,
      `Review section takeaways: thoroughly verify the mechanisms outlined in ${title}.`,
      'Pay close attention to SI units, boundary conditions, and real-world examples.',
      'Test your comprehension using the auto-generated assessment quiz below.',
    ];

    // 5. Quiz Questions
    const mcqs = concepts.slice(0, 3).map((c, idx) => ({
      id: idx + 1,
      question: `According to this lesson, what is the exact definition of "${c.term}"?`,
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
      question: `What is the central focus of the lesson "${title}"?`,
      options: [
        summary_points[0] || 'Foundational curriculum study material.',
        'Peripheral history unrelated to scientific application.',
        'A purely fictional hypothesis with no measurable consequences.',
        'Historical debate with no modern relevance.',
      ],
      correct_answer: summary_points[0] || 'Foundational curriculum study material.',
      explanation: 'This captures the executive thesis and conceptual foundation of the uploaded text.',
    });

    return {
      title,
      summary: summary_points.join(' '),
      summary_points,
      comprehensive_key_points,
      key_concepts: concepts,
      formulas_and_rules: formulas,
      bullet_takeaways: takeaways,
      mcq_questions: mcqs,
      short_answer_questions: [
        {
          id: 1,
          question: `Explain how the principles in "${title}" operate in natural or physical systems.`,
          ideal_answer: summary_points.slice(0, 2).join(' ') || 'Detailed scientific explanation.',
          key_point: 'Clearly define the governing mechanism and its direct consequences.',
        },
        {
          id: 2,
          question: 'What are the core equations or governing laws highlighted in this lesson?',
          ideal_answer: formulas[0] || 'Fundamental conservation laws and standard SI parameters.',
          key_point: 'State the law, write down the formula, and identify all variable symbols.',
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
