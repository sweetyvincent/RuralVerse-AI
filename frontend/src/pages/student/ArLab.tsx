import React, { useState } from 'react';
import { CircuitExperiment } from '../../features/ar-lab/CircuitExperiment';
import { SolarSystem } from '../../features/ar-lab/SolarSystem';
import { HeartModel } from '../../features/ar-lab/HeartModel';
import { AtomExperiment } from '../../features/ar-lab/AtomExperiment';
import { OpticsPrismExperiment } from '../../features/ar-lab/OpticsPrismExperiment';
import { PlantCellExperiment } from '../../features/ar-lab/PlantCellExperiment';
import { MoleculeLab } from '../../features/ar-lab/MoleculeLab';
import { ElectromagnetismLab } from '../../features/ar-lab/ElectromagnetismLab';
import { Zap, Globe, Heart, Atom, Sun, Sprout, Sparkles, Activity, Compass } from 'lucide-react';
import { Badge } from '../../components/ui/badge';

type ExperimentTab =
  | 'circuit'
  | 'molecules'
  | 'electromagnetism'
  | 'atom'
  | 'optics'
  | 'plant_cell'
  | 'solar'
  | 'heart';

export const ArLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ExperimentTab>('molecules');

  const tabs: {
    id: ExperimentTab;
    label: string;
    icon: React.ReactNode;
    category: string;
    badgeColor: string;
  }[] = [
    {
      id: 'molecules',
      label: '3D Molecules & Bonds',
      icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
      category: 'Chemistry',
      badgeColor: 'border-cyan-500/30 text-cyan-400',
    },
    {
      id: 'electromagnetism',
      label: 'Faraday Induction & Dynamo',
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      category: 'Physics',
      badgeColor: 'border-amber-500/30 text-amber-400',
    },
    {
      id: 'atom',
      label: 'Bohr Atom Structure',
      icon: <Atom className="w-4 h-4 text-sky-400" />,
      category: 'Physics',
      badgeColor: 'border-sky-500/30 text-sky-400',
    },
    {
      id: 'optics',
      label: 'Prism Light Dispersion',
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
    {
      id: 'circuit',
      label: 'Electric Circuit Lab',
      icon: <Zap className="w-4 h-4 text-purple-400" />,
      category: 'Electronics',
      badgeColor: 'border-purple-500/30 text-purple-400',
    },
    {
      id: 'solar',
      label: 'Solar System 3D',
      icon: <Globe className="w-4 h-4 text-cyan-400" />,
      category: 'Astronomy',
      badgeColor: 'border-cyan-500/30 text-cyan-400',
    },
    {
      id: 'heart',
      label: 'Human Heart Anatomy',
      icon: <Heart className="w-4 h-4 text-rose-400" />,
      category: 'Biology',
      badgeColor: 'border-rose-500/30 text-rose-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="cyan">Hardware-Accelerated Virtual Science</Badge>
            <span className="text-xs text-slate-400">8 Interactive 3D Simulations Available</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">Interactive AR Science Laboratory</h1>
          <p className="text-xs text-slate-400">
            Rotate in 360°, zoom in/out, inspect chemical bonds, manipulate electromagnetic flux, and explore subatomic physics.
          </p>
        </div>
      </div>

      {/* Tabs navigation pill bar */}
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
        {activeTab === 'molecules' && <MoleculeLab />}
        {activeTab === 'electromagnetism' && <ElectromagnetismLab />}
        {activeTab === 'atom' && <AtomExperiment />}
        {activeTab === 'optics' && <OpticsPrismExperiment />}
        {activeTab === 'plant_cell' && <PlantCellExperiment />}
        {activeTab === 'circuit' && <CircuitExperiment />}
        {activeTab === 'solar' && <SolarSystem />}
        {activeTab === 'heart' && <HeartModel />}
      </div>
    </div>
  );
};
