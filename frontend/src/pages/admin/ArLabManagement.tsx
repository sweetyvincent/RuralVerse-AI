import React from 'react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Atom, Zap, Globe, Heart, Sun, Sprout, CheckCircle2 } from 'lucide-react';

export const ArLabManagement: React.FC = () => {
  const experiments = [
    {
      title: 'Electric Circuit Simulation',
      subject: 'Physics',
      badgeVariant: 'purple' as const,
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      desc: "Interactive knife switch, 9V battery terminal connections, and glowing tungsten filament incandescence based on Ohm's Law.",
      features: "Ohm's Law (V=IR) • Live Electron Drift Animation • Closed Circuit Logic",
    },
    {
      title: 'Solar System & Planet Orbits',
      subject: 'Astronomy',
      badgeVariant: 'cyan' as const,
      icon: <Globe className="w-5 h-5 text-cyan-400" />,
      desc: 'Multi-body gravitational orbit simulator, planetary telemetry inspection, and relative atmospheric facts.',
      features: 'Keplerian Orbits • Real-Time Revolution Rates • Planetary Telemetry HUD',
    },
    {
      title: 'Human Heart Anatomy',
      subject: 'Biology',
      badgeVariant: 'rose' as const,
      icon: <Heart className="w-5 h-5 text-rose-400" />,
      desc: 'Rhythmic cardiac systole/diastole 72 BPM animation with oxygenated (Aorta) and deoxygenated (Vena Cava) vascular models.',
      features: 'Cardiac Systole/Diastole • Chamber Inspection • Oxygenated vs Deoxygenated Blood Flow',
    },
    {
      title: 'Rutherford-Bohr Atomic Structure',
      subject: 'Chemistry',
      badgeVariant: 'sky' as const,
      icon: <Atom className="w-5 h-5 text-sky-400" />,
      desc: 'Quantized K, L, M electron shells revolving around a dense nucleus of protons and neutrons across multiple periodic elements.',
      features: 'Subatomic Nucleon Cluster • Dynamic Element Picker (H, He, C, O, Na) • Valence Distribution',
    },
    {
      title: 'Light Ray Dispersion & Refraction Prism',
      subject: 'Optics',
      badgeVariant: 'orange' as const,
      icon: <Sun className="w-5 h-5 text-orange-400" />,
      desc: "Newton's spectral dispersion through an equilateral crown glass prism exhibiting continuous 7-color ROYGBIV refraction.",
      features: "Snell's Law Refraction • Material Selector (Water, Glass, Diamond) • Incident Angle Slider",
    },
    {
      title: 'Plant Cell Structure & Photosynthesis',
      subject: 'Botany',
      badgeVariant: 'emerald' as const,
      icon: <Sprout className="w-5 h-5 text-emerald-400" />,
      desc: 'Plant cell wall rigidity, large central vacuole turgor pressure, and chloroplast photosynthesis generating O₂ and glucose.',
      features: 'Chloroplast Solar Activation • Organelle Directory • Real-Time Photosynthesis Oxygen Bubbles',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="cyan">Hardware-Accelerated Virtual Science</Badge>
          <span className="text-xs text-slate-400">Total Active Simulations: 6</span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight mt-1">AR Science Lab Management</h1>
        <p className="text-xs text-slate-400 mt-1">
          Monitor and configure interactive 3D simulations across Physics, Chemistry, Biology, and Astronomy.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {experiments.map((exp, idx) => (
          <Card key={idx} className="p-6 bg-slate-900/90 border-slate-800 space-y-4 hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center">
                  {exp.icon}
                </div>
                <Badge variant={exp.badgeVariant}>{exp.subject}</Badge>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> LIVE 3D
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-white">{exp.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">{exp.desc}</p>
            </div>

            <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500 space-y-1">
              <div className="text-slate-400 font-semibold">Features:</div>
              <div className="text-slate-400">{exp.features}</div>
              <div className="text-cyan-500/80 pt-1 font-mono text-[10px]">Engine: Three.js • WebGL 2.0</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
