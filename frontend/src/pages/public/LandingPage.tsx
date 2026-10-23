import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  HandMetal,
  Atom,
  Bot,
  WifiOff,
  ArrowRight,
  ShieldCheck,
  Languages,
  BookOpen,
  Award,
  Zap,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

export const LandingPage: React.FC = () => {
  return (
    <div className="space-y-24 py-12">
      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold backdrop-blur-md">
          <Sparkles className="w-4 h-4" />
          <span>Next-Generation Rural Education Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight">
          Intelligent. Multilingual.{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-500 bg-clip-text text-transparent">
            Immersive.
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 leading-relaxed">
          Bridging the rural education divide with camera air-writing, interactive AR science simulations,
          offline-first lesson storage, and multilingual AI tutoring grounded in verified textbooks.
        </p>

        {/* Essential Requirement: Air-writing replaces VR */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link to="/student/register">
            <Button variant="glow" size="lg" className="w-full sm:w-auto shadow-cyan-500/25">
              Start Free Student Access <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link to="/student/air-writing">
            <Button variant="outline" size="lg" className="w-full sm:w-auto border-cyan-500/40 text-cyan-300">
              <HandMetal className="w-4 h-4 mr-2 text-cyan-400" /> Try Air-Writing Studio
            </Button>
          </Link>
        </div>

        {/* Feature Badges */}
        <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
            <HandMetal className="w-6 h-6 text-cyan-400 mb-2" />
            <h4 className="text-sm font-bold text-white">Air-Writing</h4>
            <p className="text-xs text-slate-400 mt-1">Write in the air using your webcam. No VR hardware required.</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
            <Atom className="w-6 h-6 text-purple-400 mb-2" />
            <h4 className="text-sm font-bold text-white">AR Science Lab</h4>
            <p className="text-xs text-slate-400 mt-1">Interactive 3D electric circuits, astronomy, and biology.</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
            <Languages className="w-6 h-6 text-emerald-400 mb-2" />
            <h4 className="text-sm font-bold text-white">Multilingual AI</h4>
            <p className="text-xs text-slate-400 mt-1">Tamil, Hindi, Telugu, & English tutoring with RAG textbook citations.</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
            <WifiOff className="w-6 h-6 text-amber-400 mb-2" />
            <h4 className="text-sm font-bold text-white">Offline Ready</h4>
            <p className="text-xs text-slate-400 mt-1">Download lessons and sync progress when connectivity returns.</p>
          </div>
        </div>
      </section>

      {/* Air-Writing Spotlight Section */}
      <section id="air-writing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-cyan-950/40 border border-cyan-500/20 rounded-3xl p-8 sm:p-12 overflow-hidden relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="cyan">Replacing the VR Classroom</Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Air-Writing Studio — Write in Front of Any Webcam
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Rural students often lack expensive stylus pens or touch tablets. Using real-time computer vision
                (MediaPipe Hand Landmarker), students move their index fingertip in front of a standard low-cost webcam.
                Strokes appear smoothly on the screen in real-time.
              </p>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">✓</span>
                  <span><strong>Deliberate gesture tracking:</strong> Extended index finger draws, pinch gesture lifts the pen.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">✓</span>
                  <span><strong>4 Purpose-Built Learning Modes:</strong> Free Writing, Alphabet Practice, Math Board, Science Diagrams.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">✓</span>
                  <span><strong>100% In-Browser Privacy:</strong> No camera feed is ever uploaded to external servers.</span>
                </li>
              </ul>
              <Link to="/student/air-writing">
                <Button variant="glow">Launch Air-Writing Studio</Button>
              </Link>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-6 flex flex-col items-center justify-center min-h-[300px] shadow-2xl">
              <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 animate-bounce">
                <HandMetal className="w-10 h-10" />
              </div>
              <h4 className="text-white font-bold text-sm">Real-Time Fingertip Stroke Engine</h4>
              <p className="text-slate-500 text-xs text-center mt-1 max-w-xs">
                Supports drawing colors, undo/redo, PNG exports, and mouse/touch fallback modes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AR Science Lab Spotlight */}
      <section id="ar-lab" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-purple-950/40 border border-purple-500/20 rounded-3xl p-8 sm:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-6 flex flex-col items-center justify-center min-h-[300px]">
              <Atom className="w-16 h-16 text-purple-400 mb-3 animate-spin" style={{ animationDuration: '12s' }} />
              <h4 className="text-white font-bold text-sm">Three.js Interactive 3D Physics & Biology</h4>
              <p className="text-slate-500 text-xs text-center mt-1 max-w-xs">
                Clickable switches, live current glow, solar orbit physics, and cardiac chambers.
              </p>
            </div>

            <div className="order-1 lg:order-2 space-y-6">
              <Badge variant="purple">Virtual Experimentation</Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                AR Virtual Science Laboratory
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Rural schools frequently face laboratory equipment shortages. RuralVerse AI delivers fully interactive 3D simulations that let students manipulate physical switches, observe electron current, and explore the solar system without specialized hardware.
              </p>
              <Link to="/student/ar-lab">
                <Button variant="primary">Explore AR Science Laboratory</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Portal Selection Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Three Dedicated Access Portals</h2>
          <p className="text-slate-400 text-xs sm:text-sm">Separate, role-guarded environments designed for each stakeholder.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-slate-900/80 border-slate-800 hover:border-cyan-500/40 transition-colors space-y-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Student Portal</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Personalized learning dashboard, AI tutor with RAG citations, air-writing studio, AR lab, and offline quizzes.
            </p>
            <div className="pt-2">
              <Link to="/student/login">
                <Button variant="outline" size="sm" className="w-full">Student Sign In</Button>
              </Link>
            </div>
          </Card>

          <Card className="p-6 bg-slate-900/80 border-slate-800 hover:border-purple-500/40 transition-colors space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Teacher Portal</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Assigned classes, assessment creation, genuine student progress review, and weak topic identification.
            </p>
            <div className="pt-2">
              <Link to="/teacher/login">
                <Button variant="outline" size="sm" className="w-full">Teacher Sign In</Button>
              </Link>
            </div>
          </Card>

          <Card className="p-6 bg-slate-900/80 border-slate-800 hover:border-rose-500/40 transition-colors space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Administrator Portal</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Platform-wide user management, AI tutor parameter configuration, RAG textbook PDF indexing, and audit trail.
            </p>
            <div className="pt-2">
              <Link to="/admin/login">
                <Button variant="outline" size="sm" className="w-full border-rose-500/30 text-rose-300">Admin Sign In</Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};
