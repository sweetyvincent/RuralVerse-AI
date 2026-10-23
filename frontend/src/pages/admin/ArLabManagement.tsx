import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { experimentService } from '../../services/experiments';
import { Experiment } from '../../types';
import { Atom, Plus, CheckCircle2 } from 'lucide-react';

export const ArLabManagement: React.FC = () => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    experimentService.getAdminExperiments()
      .then(setExperiments)
      .catch((err) => console.log('Error loading experiments:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">AR Science Lab Management</h1>
        <p className="text-xs text-slate-400 mt-1">Configure interactive 3D simulations across Physics, Chemistry, and Biology.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Module 1: Electric Circuit */}
        <Card className="p-6 bg-slate-900/90 border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="purple">Physics</Badge>
            <span className="text-[10px] text-emerald-400 font-bold">LIVE 3D</span>
          </div>
          <h3 className="text-base font-bold text-white">Electric Circuit Simulation</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Interactive knife switch, 9V battery terminal connections, and glowing tungsten filament incandescence based on Ohm's Law.
          </p>
          <div className="pt-2 text-xs text-slate-500">
            Engine: Three.js • WebGL 2.0
          </div>
        </Card>

        {/* Module 2: Solar System */}
        <Card className="p-6 bg-slate-900/90 border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="cyan">Astronomy</Badge>
            <span className="text-[10px] text-emerald-400 font-bold">LIVE 3D</span>
          </div>
          <h3 className="text-base font-bold text-white">Solar System & Planet Orbits</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Multi-body gravitational orbit simulator, planetary telemetry inspection, and relative atmospheric facts.
          </p>
          <div className="pt-2 text-xs text-slate-500">
            Engine: Three.js • WebGL 2.0
          </div>
        </Card>

        {/* Module 3: Heart */}
        <Card className="p-6 bg-slate-900/90 border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="rose">Biology</Badge>
            <span className="text-[10px] text-emerald-400 font-bold">LIVE 3D</span>
          </div>
          <h3 className="text-base font-bold text-white">Human Heart Anatomy</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Rhythmic cardiac systole/diastole 72 BPM animation with oxygenated (Aorta) and deoxygenated (Vena Cava) vascular models.
          </p>
          <div className="pt-2 text-xs text-slate-500">
            Engine: Three.js • WebGL 2.0
          </div>
        </Card>
      </div>
    </div>
  );
};
