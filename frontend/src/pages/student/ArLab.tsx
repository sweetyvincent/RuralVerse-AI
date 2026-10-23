import React, { useState } from 'react';
import { CircuitExperiment } from '../../features/ar-lab/CircuitExperiment';
import { SolarSystem } from '../../features/ar-lab/SolarSystem';
import { HeartModel } from '../../features/ar-lab/HeartModel';
import { AtomExperiment } from '../../features/ar-lab/AtomExperiment';
import { OpticsPrismExperiment } from '../../features/ar-lab/OpticsPrismExperiment';
import { PlantCellExperiment } from '../../features/ar-lab/PlantCellExperiment';
import { Zap, Globe, Heart, Atom, Sun, Sprout, Sparkles } from 'lucide-react';
import { Badge } from '../../components/ui/badge';

type ExperimentTab = 'circuit' | 'solar' | 'heart' | 'atom' | 'optics' | 'plant_cell';

export const ArLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ExperimentTab>('circuit');

  const tabs: { id: ExperimentTab; label: string; icon: React.ReactNode; category: string; badgeColor: string }[] = [
    {
      id: 'circuit',
      label: 'Electric Circuit',
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      category: 'Physics',
      badgeColor: 'border-amber-500/30 text-amber-400',
    },
    {
      id: 'solar',
      label: 'Solar System',
      icon: <Globe className="w-4 h-4 text-cyan-400" />,
      category: 'Astronomy',
      badgeColor: 'border-cyan-500/30 text-cyan-400',
    },
    {
      id: 'heart',
      label: 'Human Heart',
      icon: <Heart className="w-4 h-4 text-rose-400" />,
      category: 'Biology',
      badgeColor: 'border-rose-500/30 text-rose-400',
    },
    {
      id: 'atom',
      label: 'Bohr Atom Structure',
      icon: <Atom className="w-4 h-4 text-sky-400" />,
      category: 'Chemistry',
      badgeColor: 'border-sky-500/30 text-sky-400',
    },
    {
      id: 'optics',
      label: 'Light Prism Dispersion',
      icon: <Sun className="w-4 h-4 text-orange-400" />,
      category: 'Optics',
      badgeColor: 'border-orange-500/30 text-orange-400',
    },
    {
      id: 'plant_cell',
      label: 'Plant Cell & Chloroplast',
      icon: <Sprout className="w-4 h-4 text-emerald-400" />,
      category: 'Botany',
      badgeColor: 'border-emerald-500/30 text-emerald-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Simulation Selector Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="cyan">Interactive Virtual Science Facility</Badge>
            <span className="text-xs text-slate-400">6 Real-Time 3D Simulations Available</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">AR Science Laboratory</h1>
          <p className="text-xs text-slate-400">
            Hardware-accelerated Three.js 3D experiments designed for rural students without physical laboratory access.
          </p>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto max-w-full pb-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                isActive
                  ? 'bg-slate-800 text-white shadow-lg border border-slate-700 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${tab.badgeColor} hidden md:inline-block`}>
                {tab.category}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active 3D Experiment Simulation */}
      <div className="transition-opacity duration-300">
        {activeTab === 'circuit' && <CircuitExperiment />}
        {activeTab === 'solar' && <SolarSystem />}
        {activeTab === 'heart' && <HeartModel />}
        {activeTab === 'atom' && <AtomExperiment />}
        {activeTab === 'optics' && <OpticsPrismExperiment />}
        {activeTab === 'plant_cell' && <PlantCellExperiment />}
      </div>
    </div>
  );
};
