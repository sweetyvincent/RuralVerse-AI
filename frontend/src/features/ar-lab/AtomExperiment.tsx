import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Play, Pause, RotateCcw, CheckCircle2, Sparkles, Atom, Info } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

interface ElementData {
  name: string;
  symbol: string;
  atomicNumber: number;
  massNumber: number;
  protons: number;
  neutrons: number;
  electrons: number[]; // distribution across shells [K, L, M]
  category: string;
  funFact: string;
}

const ELEMENTS: ElementData[] = [
  {
    name: 'Hydrogen',
    symbol: 'H',
    atomicNumber: 1,
    massNumber: 1,
    protons: 1,
    neutrons: 0,
    electrons: [1],
    category: 'Non-metal',
    funFact: 'Most abundant element in the universe, powering stars through nuclear fusion.',
  },
  {
    name: 'Helium',
    symbol: 'He',
    atomicNumber: 2,
    massNumber: 4,
    protons: 2,
    neutrons: 2,
    electrons: [2],
    category: 'Noble Gas',
    funFact: 'Completely filled K-shell makes it exceptionally stable and chemically inert.',
  },
  {
    name: 'Carbon',
    symbol: 'C',
    atomicNumber: 6,
    massNumber: 12,
    protons: 6,
    neutrons: 6,
    electrons: [2, 4],
    category: 'Non-metal',
    funFact: 'The foundation of organic chemistry and all known biological life on Earth.',
  },
  {
    name: 'Oxygen',
    symbol: 'O',
    atomicNumber: 8,
    massNumber: 16,
    protons: 8,
    neutrons: 8,
    electrons: [2, 6],
    category: 'Chalcogen',
    funFact: 'Electronegative gas essential for aerobic respiration and atmospheric ozone (O3).',
  },
  {
    name: 'Sodium',
    symbol: 'Na',
    atomicNumber: 11,
    massNumber: 23,
    protons: 11,
    neutrons: 12,
    electrons: [2, 8, 1],
    category: 'Alkali Metal',
    funFact: 'Has a single valence electron in the M-shell, making it vigorously reactive with water.',
  },
];

export const AtomExperiment: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedElement, setSelectedElement] = useState<ElementData>(ELEMENTS[2]); // Carbon default
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [orbitSpeed, setOrbitSpeed] = useState<number>(1);
  const [showShellLabels, setShowShellLabels] = useState<boolean>(true);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const atomGroupRef = useRef<THREE.Group | null>(null);
  const electronsGroupRef = useRef<THREE.Group | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Setup Three.js scene
  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const width = currentMount.clientWidth;
    const height = currentMount.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 12, 24);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    currentMount.appendChild(renderer.domElement);

    // Ambient and point light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const centerPointLight = new THREE.PointLight(0x38bdf8, 2.5, 50);
    centerPointLight.position.set(0, 0, 0);
    scene.add(centerPointLight);

    const topLight = new THREE.DirectionalLight(0xffffff, 0.8);
    topLight.position.set(10, 20, 10);
    scene.add(topLight);

    const atomGroup = new THREE.Group();
    scene.add(atomGroup);
    atomGroupRef.current = atomGroup;

    const electronsGroup = new THREE.Group();
    atomGroup.add(electronsGroup);
    electronsGroupRef.current = electronsGroup;

    // Render loop
    let angle = 0;
    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);

      if (isPlaying) {
        angle += 0.015 * orbitSpeed;
        if (electronsGroupRef.current) {
          electronsGroupRef.current.children.forEach((child, idx) => {
            const shellIdx = child.userData.shellIndex || 1;
            const orbitOffset = child.userData.initialAngle || 0;
            const radius = child.userData.radius || 4;
            const tilt = child.userData.tilt || 0;

            const currentAngle = angle * (2.2 / Math.sqrt(shellIdx)) + orbitOffset;
            child.position.x = Math.cos(currentAngle) * radius;
            child.position.z = Math.sin(currentAngle) * radius * Math.cos(tilt);
            child.position.y = Math.sin(currentAngle) * radius * Math.sin(tilt);
          });
        }

        if (atomGroupRef.current) {
          atomGroupRef.current.rotation.y += 0.002 * orbitSpeed;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!currentMount) return;
      const newWidth = currentMount.clientWidth;
      const newHeight = currentMount.clientHeight || 500;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      renderer.dispose();
      if (currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Atom structure when element changes
  useEffect(() => {
    if (!atomGroupRef.current || !electronsGroupRef.current) return;

    const atomGroup = atomGroupRef.current;
    const electronsGroup = electronsGroupRef.current;

    // Remove old nucleus and orbits
    while (atomGroup.children.length > 0) {
      const obj = atomGroup.children[0];
      if (obj === electronsGroup) {
        atomGroup.remove(electronsGroup);
      } else {
        atomGroup.remove(obj);
      }
    }
    while (electronsGroup.children.length > 0) {
      electronsGroup.remove(electronsGroup.children[0]);
    }

    atomGroup.add(electronsGroup);

    // 1. Build Central Nucleus (Protons + Neutrons cluster)
    const nucleusGroup = new THREE.Group();
    const nucleonRadius = 0.42;

    const protonMat = new THREE.MeshStandardMaterial({
      color: 0xef4444, // Red
      roughness: 0.2,
      metalness: 0.1,
      emissive: 0x7f1d1d,
    });

    const neutronMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4, // Cyan
      roughness: 0.2,
      metalness: 0.1,
      emissive: 0x083344,
    });

    const sphereGeo = new THREE.SphereGeometry(nucleonRadius, 16, 16);
    const totalNucleons = selectedElement.protons + selectedElement.neutrons;

    for (let i = 0; i < totalNucleons; i++) {
      const isProton = i < selectedElement.protons;
      const mesh = new THREE.Mesh(sphereGeo, isProton ? protonMat : neutronMat);

      if (totalNucleons === 1) {
        mesh.position.set(0, 0, 0);
      } else {
        const phi = Math.acos(-1 + (2 * i) / totalNucleons);
        const theta = Math.sqrt(totalNucleons * Math.PI) * phi;
        const r = Math.cbrt((i + 1) / totalNucleons) * 1.2;
        mesh.position.set(r * Math.cos(theta) * Math.sin(phi), r * Math.sin(theta) * Math.sin(phi), r * Math.cos(phi));
      }
      nucleusGroup.add(mesh);
    }

    // Glowing core aura
    const auraGeo = new THREE.SphereGeometry(1.8, 32, 32);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.15,
      wireframe: true,
    });
    nucleusGroup.add(new THREE.Mesh(auraGeo, auraMat));
    atomGroup.add(nucleusGroup);

    // 2. Build Electron Shells and Orbiting Electrons
    const shellRadii = [4.5, 7.5, 10.5]; // K, L, M radii

    selectedElement.electrons.forEach((electronCount, shellIdx) => {
      const radius = shellRadii[shellIdx];
      const shellName = shellIdx === 0 ? 'K' : shellIdx === 1 ? 'L' : 'M';

      // Ring line geometry
      const ringGeo = new THREE.BufferGeometry();
      const points: THREE.Vector3[] = [];
      const segments = 64;
      for (let s = 0; s <= segments; s++) {
        const theta = (s / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
      }
      ringGeo.setFromPoints(points);

      const ringMat = new THREE.LineBasicMaterial({
        color: shellIdx === 0 ? 0x38bdf8 : shellIdx === 1 ? 0xa855f7 : 0xec4899,
        transparent: true,
        opacity: 0.4,
      });

      const ringLine = new THREE.Line(ringGeo, ringMat);
      atomGroup.add(ringLine);

      // Add electrons on this shell
      const electronGeo = new THREE.SphereGeometry(0.25, 16, 16);
      const electronMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        roughness: 0.2,
      });

      for (let e = 0; e < electronCount; e++) {
        const electronMesh = new THREE.Mesh(electronGeo, electronMat);
        const initialAngle = (e / electronCount) * Math.PI * 2;
        const tilt = (shellIdx * 0.2) + (e * 0.1);

        electronMesh.userData = {
          shellIndex: shellIdx + 1,
          shellName,
          radius,
          initialAngle,
          tilt,
        };

        electronMesh.position.set(Math.cos(initialAngle) * radius, 0, Math.sin(initialAngle) * radius);
        electronsGroup.add(electronMesh);
      }
    });
  }, [selectedElement]);

  return (
    <div className="space-y-6">
      {/* Simulation Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="cyan">Chemistry & Atomic Physics</Badge>
            <span className="text-xs text-slate-400">Class 8–10 NCERT Curriculum</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Atom className="w-5 h-5 text-cyan-400" /> Rutherford-Bohr Atomic Structure 3D
          </h2>
          <p className="text-xs text-slate-400">
            Interactive quantized electron shells, subatomic nucleon clustering, and valence configuration.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5"
          >
            {isPlaying ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
            <span>{isPlaying ? 'Pause' : 'Resume'}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOrbitSpeed(1)}
            className="text-slate-400 hover:text-white"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Simulation Viewport and Element Picker */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 3D Canvas */}
        <div className="lg:col-span-3 relative h-[500px] rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
          <div ref={mountRef} className="w-full h-full" />

          {/* 3D Viewport HUD Overlay */}
          <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-3 text-xs space-y-1 pointer-events-none">
            <div className="flex items-center gap-2 text-white font-bold">
              <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm font-black">
                {selectedElement.symbol}
              </span>
              <span>{selectedElement.name} (Z = {selectedElement.atomicNumber})</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Shells: {selectedElement.electrons.map((count, i) => `${i === 0 ? 'K' : i === 1 ? 'L' : 'M'}:${count}`).join(' • ')}
            </div>
          </div>

          {/* Nucleus Legend */}
          <div className="absolute bottom-4 left-4 flex items-center gap-4 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 px-3 py-2 rounded-xl text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
              <span>Proton (p+)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" />
              <span>Neutron (n0)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" />
              <span>Electron (e-)</span>
            </div>
          </div>

          {/* Speed slider overlay */}
          <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 px-3 py-2 rounded-xl flex items-center gap-2 text-xs text-slate-300">
            <span>Orbit:</span>
            <input
              type="range"
              min="0.2"
              max="2.5"
              step="0.1"
              value={orbitSpeed}
              onChange={(e) => setOrbitSpeed(parseFloat(e.target.value))}
              className="w-20 accent-cyan-500 cursor-pointer"
            />
            <span className="w-8 text-[11px] text-cyan-400">{orbitSpeed.toFixed(1)}x</span>
          </div>
        </div>

        {/* Element Selection and Telemetry Sidebar */}
        <div className="space-y-4">
          <Card className="p-4 bg-slate-900/90 border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Select Periodic Element</h3>
            <div className="grid grid-cols-1 gap-2">
              {ELEMENTS.map((elem) => (
                <button
                  key={elem.symbol}
                  onClick={() => setSelectedElement(elem)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all text-left ${
                    selectedElement.symbol === elem.symbol
                      ? 'bg-cyan-500/20 border-cyan-500/60 text-white font-bold shadow-lg shadow-cyan-500/10'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center font-black text-cyan-300">
                      {elem.symbol}
                    </span>
                    <div>
                      <span className="block leading-tight">{elem.name}</span>
                      <span className="text-[10px] text-slate-500">{elem.category}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    Z={elem.atomicNumber}
                  </Badge>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-4 bg-slate-900/90 border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-purple-400" /> Subatomic Telemetry
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Atomic Number (Z):</span>
                <span className="text-white font-bold font-mono">{selectedElement.atomicNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Mass Number (A):</span>
                <span className="text-white font-bold font-mono">{selectedElement.massNumber} u</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Protons / Neutrons:</span>
                <span className="text-white font-mono">{selectedElement.protons}p / {selectedElement.neutrons}n</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Valence Shell:</span>
                <span className="text-cyan-400 font-bold font-mono">
                  {selectedElement.electrons[selectedElement.electrons.length - 1]} valence e-
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              <strong className="text-slate-200 block mb-1">Scientific Insight:</strong>
              {selectedElement.funFact}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
