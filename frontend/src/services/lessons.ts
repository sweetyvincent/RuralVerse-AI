import api from './api';
import { Subject, Course, Lesson, LessonResource } from '../types';

// Default initial subjects when offline or on static preview
const DEFAULT_SUBJECTS: Subject[] = [
  { id: 1, name: 'Physics', description: 'Mechanics, electricity, circuits, optics, and physical phenomena', icon: 'zap', is_active: true },
  { id: 2, name: 'Chemistry', description: 'Atoms, molecules, chemical bonding, and periodic table fundamentals', icon: 'flask', is_active: true },
  { id: 3, name: 'Biology', description: 'Human anatomy, plant cells, photosynthesis, and physiology', icon: 'dna', is_active: true },
  { id: 4, name: 'Mathematics', description: 'Algebra, geometry, arithmetic, and applied equations', icon: 'calculator', is_active: true },
  { id: 5, name: 'Astronomy & Space', description: 'Planetary orbits, gravity, solar system, and cosmos', icon: 'globe', is_active: true },
];

const DEFAULT_COURSES: Course[] = [
  { id: 1, subject_id: 1, title: 'Grade 8 Basic Electricity & Electric Circuits', description: 'Hands-on Ohm law, switch nodes, and DC current fundamentals', grade_level: '8th Grade', is_published: true },
  { id: 2, subject_id: 2, title: 'Atomic Structure & Periodic Elements', description: 'Rutherford-Bohr model, electron shells, and valence states', grade_level: '8th Grade', is_published: true },
  { id: 3, subject_id: 3, title: 'Cell Biology & Photosynthesis', description: 'Plant cell structure, organelles, chloroplasts, and energy cycles', grade_level: '8th Grade', is_published: true },
  { id: 4, subject_id: 4, title: 'Foundations of Algebra & Linear Equations', description: 'Variables, linear relationships, and Cartesian graphs', grade_level: '8th Grade', is_published: true },
  { id: 5, subject_id: 5, title: 'Planetary Motion & Gravitation', description: 'Keplerian orbits, gravitational acceleration, and planetary bodies', grade_level: '8th Grade', is_published: true },
];

const DEFAULT_LESSONS: Lesson[] = [
  {
    id: 1,
    course_id: 1,
    title: 'Electric Circuits, Voltage & Conductive Loops',
    content: `# Electric Circuits and Current Flow

A closed electric circuit allows electrons to travel continuously from the negative terminal of a voltage source, through conductive wires and loads (like an incandescent lamp), to the positive terminal.

### Key Concepts
- **Voltage (V):** Electrical potential difference driving charge carriers (measured in Volts).
- **Current (I):** Flow rate of electric charge (measured in Amperes, $I = \\frac{Q}{t}$).
- **Resistance (R):** Opposition to current flow inside conductors (measured in Ohms, $\\Omega$).
- **Ohm's Law:** $V = I \\times R$

### Safety Rules
1. Never touch exposed bare metal wire conductors under load.
2. Ensure open switch status before swapping components in physical science laboratories.`,
    order: 1,
    duration_minutes: 25,
    is_published: true,
    language: 'en',
  },
  {
    id: 2,
    course_id: 2,
    title: 'Bohr Model of the Atom & Electron Shells',
    content: `# Bohr Model of the Atom

Atoms are the fundamental building blocks of all matter. In the Bohr model, negatively charged electrons revolve around a dense, positively charged nucleus in quantized energy levels called electron shells.

### Subatomic Particles:
1. **Protons:** Positively charged particles in the nucleus (+1 charge, $1.67 \\times 10^{-27}$ kg).
2. **Neutrons:** Neutral particles in the nucleus (0 charge).
3. **Electrons:** Negatively charged particles orbiting in shells (-1 charge).

### Electron Shell Capacity:
The maximum number of electrons in shell $n$ is given by $2n^2$:
- **K Shell (n = 1):** Up to 2 electrons.
- **L Shell (n = 2):** Up to 8 electrons.
- **M Shell (n = 3):** Up to 18 electrons.`,
    order: 1,
    duration_minutes: 30,
    is_published: true,
    language: 'en',
  },
  {
    id: 3,
    course_id: 3,
    title: 'Plant Cell Structure & Photosynthesis in Chloroplasts',
    content: `# Plant Cell Anatomy & Energy Transformation

Unlike animal cells, plant cells have a rigid outer cell wall composed of cellulose and specialized green organelles called **chloroplasts**.

### Photosynthesis Equation:
$$6CO_2 + 6H_2O + \\text{Sunlight} \\longrightarrow C_6H_{12}O_6 + 6O_2$$

### Key Organelles:
- **Chloroplast:** Contains chlorophyll pigments that absorb light wavelengths to synthesize glucose.
- **Central Vacuole:** Maintains turgor pressure against the cell wall.
- **Cell Wall:** Provides mechanical rigidity and protection for rural flora.`,
    order: 1,
    duration_minutes: 30,
    is_published: true,
    language: 'en',
  },
];

function getStoredCustom<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustom<T>(key: string, items: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch (err) {
    console.error('Error saving to localStorage:', err);
  }
}

export const lessonService = {
  async getSubjects(): Promise<Subject[]> {
    const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');
    const custom = getStoredCustom<Subject>('ruralverse_custom_subjects');

    if (isGitHubPages) {
      return [...DEFAULT_SUBJECTS, ...custom];
    }

    try {
      const res = await api.get('/subjects');
      if (Array.isArray(res.data) && res.data.length > 0) {
        return [...res.data, ...custom];
      }
      return [...DEFAULT_SUBJECTS, ...custom];
    } catch {
      return [...DEFAULT_SUBJECTS, ...custom];
    }
  },

  async createSubject(data: { name: string; description?: string; icon?: string }): Promise<Subject> {
    const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');
    const newSubject: Subject = {
      id: Date.now(),
      name: data.name,
      description: data.description || '',
      icon: data.icon || 'folder',
      is_active: true,
    };

    if (!isGitHubPages) {
      try {
        const res = await api.post('/admin/subjects', data);
        return res.data;
      } catch (err) {
        console.warn('Backend unavailable, saving subject locally:', err);
      }
    }

    // Save locally
    const custom = getStoredCustom<Subject>('ruralverse_custom_subjects');
    custom.push(newSubject);
    saveCustom('ruralverse_custom_subjects', custom);
    return newSubject;
  },

  async getCourses(subjectId?: number): Promise<Course[]> {
    const all = await this.getAdminCourses(subjectId);
    return all.filter((c) => c.is_published);
  },

  async getAdminCourses(subjectId?: number): Promise<Course[]> {
    const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');
    const custom = getStoredCustom<Course>('ruralverse_custom_courses');

    let allCourses: Course[] = [];

    if (isGitHubPages) {
      allCourses = [...DEFAULT_COURSES, ...custom];
    } else {
      try {
        const res = await api.get('/admin/courses', { params: { subject_id: subjectId } });
        if (Array.isArray(res.data) && res.data.length > 0) {
          allCourses = [...res.data, ...custom];
        } else {
          allCourses = [...DEFAULT_COURSES, ...custom];
        }
      } catch {
        allCourses = [...DEFAULT_COURSES, ...custom];
      }
    }

    if (subjectId) {
      return allCourses.filter((c) => c.subject_id === subjectId);
    }
    return allCourses;
  },

  async getCourse(id: number): Promise<Course> {
    const courses = await this.getAdminCourses();
    const found = courses.find((c) => c.id === id);
    if (found) return found;
    return courses[0] || DEFAULT_COURSES[0];
  },

  async createCourse(data: {
    subject_id: number;
    title: string;
    description?: string;
    grade_level?: string;
    is_published?: boolean;
  }): Promise<Course> {
    const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');
    const newCourse: Course = {
      id: Date.now(),
      subject_id: data.subject_id,
      title: data.title,
      description: data.description || '',
      grade_level: data.grade_level || '8th Grade',
      is_published: data.is_published ?? true,
    };

    if (!isGitHubPages) {
      try {
        const res = await api.post('/admin/courses', data);
        return res.data;
      } catch (err) {
        console.warn('Backend unavailable, saving course locally:', err);
      }
    }

    const custom = getStoredCustom<Course>('ruralverse_custom_courses');
    custom.push(newCourse);
    saveCustom('ruralverse_custom_courses', custom);
    return newCourse;
  },

  async getLessons(courseId?: number, language?: string): Promise<Lesson[]> {
    const all = await this.getAdminLessons(courseId);
    return all.filter((l) => l.is_published);
  },

  async getAdminLessons(courseId?: number): Promise<Lesson[]> {
    const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');
    const custom = getStoredCustom<Lesson>('ruralverse_custom_lessons');

    let allLessons: Lesson[] = [];

    if (isGitHubPages) {
      allLessons = [...DEFAULT_LESSONS, ...custom];
    } else {
      try {
        const res = await api.get('/admin/lessons', { params: { course_id: courseId } });
        if (Array.isArray(res.data) && res.data.length > 0) {
          allLessons = [...res.data, ...custom];
        } else {
          allLessons = [...DEFAULT_LESSONS, ...custom];
        }
      } catch {
        allLessons = [...DEFAULT_LESSONS, ...custom];
      }
    }

    if (courseId) {
      return allLessons.filter((l) => l.course_id === courseId);
    }
    return allLessons;
  },

  async getLesson(id: number): Promise<Lesson> {
    const lessons = await this.getAdminLessons();
    const found = lessons.find((l) => l.id === id);
    if (found) return found;
    return lessons[0] || DEFAULT_LESSONS[0];
  },

  async createLesson(data: {
    course_id: number;
    title: string;
    content?: string;
    order?: number;
    duration_minutes?: number;
    is_published?: boolean;
    language?: string;
  }): Promise<Lesson> {
    const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');
    const newLesson: Lesson = {
      id: Date.now(),
      course_id: data.course_id,
      title: data.title,
      content: data.content || '',
      order: data.order || 1,
      duration_minutes: data.duration_minutes || 25,
      is_published: data.is_published ?? true,
      language: data.language || 'en',
    };

    if (!isGitHubPages) {
      try {
        const res = await api.post('/admin/lessons', data);
        return res.data;
      } catch (err) {
        console.warn('Backend unavailable, saving lesson locally:', err);
      }
    }

    const custom = getStoredCustom<Lesson>('ruralverse_custom_lessons');
    custom.push(newLesson);
    saveCustom('ruralverse_custom_lessons', custom);
    return newLesson;
  },

  async updateLesson(id: number, data: Partial<Lesson>): Promise<Lesson> {
    const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');

    if (!isGitHubPages) {
      try {
        const res = await api.patch(`/admin/lessons/${id}`, data);
        return res.data;
      } catch (err) {
        console.warn('Backend unavailable, updating lesson locally:', err);
      }
    }

    const custom = getStoredCustom<Lesson>('ruralverse_custom_lessons');
    const idx = custom.findIndex((l) => l.id === id);
    if (idx !== -1) {
      custom[idx] = { ...custom[idx], ...data };
      saveCustom('ruralverse_custom_lessons', custom);
      return custom[idx];
    }
    const defaultIdx = DEFAULT_LESSONS.findIndex((l) => l.id === id);
    if (defaultIdx !== -1) {
      const updated = { ...DEFAULT_LESSONS[defaultIdx], ...data };
      custom.push(updated);
      saveCustom('ruralverse_custom_lessons', custom);
      return updated;
    }
    return { id, course_id: 1, title: 'Updated Lesson', ...data } as Lesson;
  },

  async deleteLesson(id: number): Promise<void> {
    const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');
    if (!isGitHubPages) {
      try {
        await api.delete(`/admin/lessons/${id}`);
      } catch (err) {
        console.warn('Backend unavailable, deleting locally:', err);
      }
    }
    const custom = getStoredCustom<Lesson>('ruralverse_custom_lessons').filter((l) => l.id !== id);
    saveCustom('ruralverse_custom_lessons', custom);
  },

  async uploadResource(lessonId: number, file: File): Promise<LessonResource> {
    const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');
    if (!isGitHubPages) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post(`/admin/lessons/${lessonId}/resources`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
      } catch (err) {
        console.warn('Upload API unavailable:', err);
      }
    }

    return {
      id: Date.now(),
      lesson_id: lessonId,
      file_name: file.name,
      file_path: URL.createObjectURL(file),
      file_type: file.type || 'application/pdf',
      file_size: file.size,
      created_at: new Date().toISOString(),
    };
  },
};
