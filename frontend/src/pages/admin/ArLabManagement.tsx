import React from 'react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Atom, Zap, Globe, Heart, Sun, Sprout, Sparkles, Activity, CheckCircle2 } from 'lucide-react';

export const ArLabManagement: React.FC = () => {
  const experiments = [
    {
      title: '3D Molecular Geometry & Chemical Bonds',
      subject: 'Chemistry',
      badgeVariant: 'cyan' as const,
      icon: <Sparkles className="w-5 h-5 text-cyan-400" />,
      desc: 'Interactive Ball-and-Stick and CPK Space-Filling 3D molecular models (H₂O, CH₄, CO₂, NH₃, C₂H₅OH, NaCl lattice).',
      features: '360° OrbitControls • Thermal Vibration (0–500K) • Dipole Vectors • Atom Click Inspector',
    },
    {
      title: 'Electromagnetic Induction & AC Generator',
      subject: 'Physics',
      badgeVariant: 'amber' as const,
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      desc: "Bar magnet moving through a copper solenoid coil demonstrating Faraday's and Lenz's laws with live galvanometer and bulb.",
      features: 'Faraday Induced EMF (ℰ = -N dΦ/dt) • Live Needle Deflection • Auto Generator Mode • Pole Flip',
    },
    {
      title: 'Rutherford-Bohr Atomic Structure',
      subject: 'Chemistry / Physics',
      badgeVariant: 'sky' as const,
      icon: <Atom className="w-5 h-5 text-sky-400" />,
      desc: 'Quantized K, L, M electron shells revolving around a dense nucleus of protons and neutrons across periodic elements.',
      features: 'Subatomic Nucleon Cluster • Element Picker (H, He, C, O, Na) • OrbitControls 360° • Valence Distribution',
    },
    {
      title: 'Light Ray Dispersion & Refraction Prism',
      subject: 'Optics',
      badgeVariant: 'orange' as const,
      icon: <Sun className="w-5 h-5 text-orange-400" />,
      desc: "Newton's spectral dispersion through an equilateral crown glass prism exhibiting continuous 7-color ROYGBIV refraction.",
      features: "Snell's Law (n₁ sin θ₁ = n₂ sin θ₂) • Material Index (Water, Glass, Diamond) • Incident Angle Slider",
    },
    {
      title: 'Plant Cell Structure & Photosynthesis',
      subject: 'Botany',
      badgeVariant: 'emerald' as const,
      icon: <Sprout className="w-5 h-5 text-emerald-400" />,
      desc: 'Cellulose cell wall rigidity, large central vacuole turgor pressure, and chloroplast photosynthesis generating O₂ and glucose.',
      features: 'Chloroplast Solar Activation • Organelle Directory • Real-Time Photosynthesis Oxygen Bubbles',
    },
    {
      title: 'Electric Circuit Simulation',
      subject: 'Electronics',
      badgeVariant: 'purple' as const,
      icon: <Zap className="w-5 h-5 text-purple-400" />,
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
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="cyan">Virtual Science Facility</Badge>
          <span className="text-xs text-slate-400">Total Active Simulations: 8</span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight mt-1">AR Science Lab Management</h1>
        <p className="text-xs text-slate-400 mt-1">
          Monitor and configure interactive 3D simulations across Chemistry, Physics, Biology, Electronics, and Astronomy.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {experiments.map((exp, idx) => (
          <Card key={idx} className="p-5 bg-slate-900/90 border-slate-800 space-y-3 hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center">
                  {exp.icon}
                </div>
                <Badge variant={exp.badgeVariant}>{exp.subject}</Badge>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> LIVE 3D
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white">{exp.title}</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-1 line-clamp-3">{exp.desc}</p>
            </div>

            <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 space-y-1">
              <div className="text-slate-400 font-semibold">Features:</div>
              <div className="text-slate-400 line-clamp-2">{exp.features}</div>
              <div className="text-cyan-500/80 pt-1 font-mono text-[9px]">Three.js • WebGL 2.0 • OrbitControls</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
