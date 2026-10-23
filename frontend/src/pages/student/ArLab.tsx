import React, { useState } from 'react';
import { CircuitExperiment } from '../../features/ar-lab/CircuitExperiment';
import { SolarSystem } from '../../features/ar-lab/SolarSystem';
import { HeartModel } from '../../features/ar-lab/HeartModel';
import { Zap, Globe, Heart } from 'lucide-react';

export const ArLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'circuit' | 'solar' | 'heart'>('circuit');

  return (
    <div className="space-y-6">
      {/* Simulation Selector Bar */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('circuit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'circuit'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Electric Circuit Lab</span>
        </button>

        <button
          onClick={() => setActiveTab('solar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'solar'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30 font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4 text-cyan-400" />
          <span>Solar System 3D</span>
        </button>

        <button
          onClick={() => setActiveTab('heart')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'heart'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Heart className="w-4 h-4 text-rose-400" />
          <span>Human Heart Anatomy</span>
        </button>
      </div>

      {/* Active 3D Experiment Simulation */}
      {activeTab === 'circuit' && <CircuitExperiment />}
      {activeTab === 'solar' && <SolarSystem />}
      {activeTab === 'heart' && <HeartModel />}
    </div>
  );
};
