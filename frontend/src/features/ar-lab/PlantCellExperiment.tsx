import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Play, Pause, RotateCcw, Sun, Sparkles, Sprout, Info, Shield, Droplets, Compass } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

interface OrganelleInfo {
  id: string;
  name: string;
  role: string;
  description: string;
  color: string;
}

const ORGANELLES: OrganelleInfo[] = [
  {
    id: 'wall',
    name: 'Cellulose Cell Wall',
    role: 'Structural Support & Protection',
    description: 'A tough, rigid outer layer made of cellulose fibers that maintains plant cell shape and prevents osmotic lysis.',
    color: '#10b981',
  },
  {
    id: 'chloroplast',
    name: 'Chloroplasts (with Chlorophyll)',
    role: 'Photosynthesis & Solar Energy Capture',
    description: 'Double-membrane green plastids packed with chlorophyll that convert light photons, water, and CO2 into chemical glucose.',
    color: '#22c55e',
  },
  {
    id: 'vacuole',
    name: 'Large Central Vacuole',
    role: 'Turgor Pressure & Osmotic Storage',
    description: 'Occupies up to 90% of mature plant cell volume, storing water, cellular sap, nutrients, and waste products.',
    color: '#06b6d4',
  },
  {
    id: 'nucleus',
    name: 'Nucleus & Nucleolus',
    role: 'Genetic Control Center',
    description: 'Encloses genomic DNA chromatin and coordinates cell division, enzyme synthesis, and vegetative development.',
    color: '#a855f7',
  },
  {
    id: 'mitochondria',
    name: 'Mitochondria',
    role: 'Cellular Respiration & ATP Production',
    description: 'Known as the powerhouse of the cell, oxidizes sugars to yield adenosine triphosphate (ATP) for growth.',
    color: '#f59e0b',
  },
];

export const PlantCellExperiment: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedOrganelle, setSelectedOrganelle] = useState<OrganelleInfo>(ORGANELLES[1]); // Chloroplast default
  const [sunlight, setSunlight] = useState<number>(75); // 0 to 100%
  const [isRotating, setIsRotating] = useState<boolean>(true);

  const cellGroupRef = useRef<THREE.Group | null>(null);
  const chloroplastsRef = useRef<THREE.Mesh[]>([]);
  const bubblesGroupRef = useRef<THREE.Group | null>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const width = currentMount.clientWidth;
    const height = currentMount.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 10, 20);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    currentMount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 6;
    controls.maxDistance = 40;

    // Ambient and Directional Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfef08a, 1.2);
    sunLight.position.set(12, 18, 12);
    scene.add(sunLight);

    const cellGroup = new THREE.Group();
    scene.add(cellGroup);
    cellGroupRef.current = cellGroup;

    // 1. Rigid Polygonal Plant Cell Wall (Hexagonal Prism / Rounded Box)
    const wallGeo = new THREE.BoxGeometry(11, 7, 7, 2, 2, 2);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x059669,
      roughness: 0.6,
      metalness: 0.1,
      wireframe: true,
    });
    const wallMesh = new THREE.Mesh(wallGeo, wallMat);
    cellGroup.add(wallMesh);

    // Inner Cytoplasm Jelly Matrix
    const cytoGeo = new THREE.BoxGeometry(10.6, 6.6, 6.6);
    const cytoMat = new THREE.MeshPhysicalMaterial({
      color: 0x064e3b,
      transparent: true,
      opacity: 0.25,
      roughness: 0.3,
      transmission: 0.8,
    });
    cellGroup.add(new THREE.Mesh(cytoGeo, cytoMat));

    // 2. Large Central Vacuole (Translucent Water Bubble)
    const vacuoleGeo = new THREE.SphereGeometry(2.4, 32, 32);
    vacuoleGeo.scale(1.4, 0.9, 1.0);
    const vacuoleMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      transmission: 0.9,
    });
    const vacuoleMesh = new THREE.Mesh(vacuoleGeo, vacuoleMat);
    vacuoleMesh.position.set(-1.2, 0.2, 0);
    cellGroup.add(vacuoleMesh);

    // 3. Nucleus with Nucleolus
    const nucleusGroup = new THREE.Group();
    const nucleusGeo = new THREE.SphereGeometry(1.4, 24, 24);
    const nucleusMat = new THREE.MeshStandardMaterial({
      color: 0x9333ea,
      roughness: 0.4,
      metalness: 0.2,
      emissive: 0x3b0764,
    });
    const nucleusMesh = new THREE.Mesh(nucleusGeo, nucleusMat);
    nucleusGroup.add(nucleusMesh);

    const nucleolusGeo = new THREE.SphereGeometry(0.5, 16, 16);
    const nucleolusMat = new THREE.MeshBasicMaterial({ color: 0xf472b6 });
    const nucleolus = new THREE.Mesh(nucleolusGeo, nucleolusMat);
    nucleolus.position.set(0.3, 0.3, 0.3);
    nucleusGroup.add(nucleolus);

    nucleusGroup.position.set(2.8, -0.6, 0.8);
    cellGroup.add(nucleusGroup);

    // 4. Chloroplasts (Green disc-shaped organelles)
    const chloroplastMeshes: THREE.Mesh[] = [];
    const chloroGeo = new THREE.SphereGeometry(0.75, 16, 16);
    chloroGeo.scale(1.4, 0.6, 0.8);
    const chloroMat = new THREE.MeshStandardMaterial({
      color: 0x16a34a,
      roughness: 0.3,
      emissive: 0x14532d,
      emissiveIntensity: 0.4,
    });

    const chloroPositions = [
      [-3.2, 2.2, 1.2],
      [-2.0, 2.4, -1.5],
      [1.2, 2.3, 1.4],
      [2.5, 2.1, -1.2],
      [-3.6, -2.0, 0.8],
      [0.8, -2.2, -1.6],
    ];

    chloroPositions.forEach((pos) => {
      const mesh = new THREE.Mesh(chloroGeo, chloroMat.clone());
      mesh.position.set(pos[0], pos[1], pos[2]);
      mesh.rotation.x = Math.random() * Math.PI;
      cellGroup.add(mesh);
      chloroplastMeshes.push(mesh);
    });
    chloroplastsRef.current = chloroplastMeshes;

    // 5. Mitochondria (Orange oval bodies)
    const mitoGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.1, 16);
    const mitoMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
    const mito1 = new THREE.Mesh(mitoGeo, mitoMat);
    mito1.rotation.z = Math.PI / 3;
    mito1.position.set(2.2, 1.2, 1.5);
    cellGroup.add(mito1);

    const mito2 = new THREE.Mesh(mitoGeo, mitoMat);
    mito2.rotation.y = Math.PI / 4;
    mito2.position.set(-2.8, -1.2, -1.8);
    cellGroup.add(mito2);

    // 6. Oxygen & Glucose Photosynthesis Bubbles Group
    const bubblesGroup = new THREE.Group();
    cellGroup.add(bubblesGroup);
    bubblesGroupRef.current = bubblesGroup;

    const bubbleGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const bubbleMat = new THREE.MeshBasicMaterial({ color: 0x86efac, transparent: true, opacity: 0.8 });

    const totalBubbles = 24;
    for (let i = 0; i < totalBubbles; i++) {
      const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
      bubble.position.set((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4);
      bubble.userData = {
        speed: 0.02 + Math.random() * 0.03,
        initialY: -2.5,
        maxY: 3.2,
      };
      bubblesGroup.add(bubble);
    }

    // Animation Loop
    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);
      controls.update();

      if (isRotating && cellGroupRef.current) {
        cellGroupRef.current.rotation.y += 0.003;
      }

      // Animate Oxygen/Glucose bubbles based on sunlight intensity
      if (bubblesGroupRef.current) {
        const factor = sunlight / 100;
        bubblesGroupRef.current.children.forEach((b) => {
          b.position.y += b.userData.speed * factor * 1.5;
          if (b.position.y > b.userData.maxY) {
            b.position.y = b.userData.initialY;
            b.position.x = (Math.random() - 0.5) * 7;
            b.position.z = (Math.random() - 0.5) * 5;
          }
        });
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
      controls.dispose();
      renderer.dispose();
      if (currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update chloroplast glow when sunlight changes
  useEffect(() => {
    chloroplastsRef.current.forEach((mesh) => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.emissiveIntensity = 0.2 + (sunlight / 100) * 0.9;
      }
    });
  }, [sunlight]);

  return (
    <div className="space-y-6">
      {/* Simulation Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="emerald">Cell Biology & Botany</Badge>
            <span className="text-xs text-slate-400">Class 8–10 NCERT Biology</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sprout className="w-5 h-5 text-emerald-400" /> Plant Cell Structure & Photosynthesis 3D
          </h2>
          <p className="text-xs text-slate-400">
            Explore chloroplast thylakoid solar capture, cellulose cell wall rigidity, and large central vacuole turgor pressure.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRotating(!isRotating)}
            className="flex items-center gap-1.5"
          >
            {isRotating ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
            <span>{isRotating ? 'Pause Spin' : 'Rotate Cell'}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSunlight(75);
              setIsRotating(true);
            }}
            className="text-slate-400 hover:text-white"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Viewport & Interactive Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 3D Canvas */}
        <div className="lg:col-span-3 relative h-[500px] rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
          <div ref={mountRef} className="w-full h-full" />

          {/* Plant Cell HUD */}
          <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-3 text-xs space-y-1 pointer-events-none">
            <div className="flex items-center gap-2 text-white font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Inspecting: {selectedOrganelle.name}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Sunlight Exposure: <span className="text-amber-400 font-mono font-bold">{sunlight}%</span> • Photosynthesis: <span className="text-emerald-400 font-bold">{sunlight > 20 ? 'Active (Producing O₂)' : 'Dormant'}</span>
            </div>
          </div>

          {/* Sunlight Slider Control */}
          <div className="absolute bottom-4 right-4 bg-slate-900/85 backdrop-blur-md border border-slate-800/80 px-4 py-2.5 rounded-2xl flex items-center gap-3 text-xs text-slate-300">
            <Sun className={`w-4 h-4 ${sunlight > 50 ? 'text-amber-400' : 'text-slate-500'}`} />
            <span>Solar Intensity:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={sunlight}
              onChange={(e) => setSunlight(parseInt(e.target.value))}
              className="w-24 accent-amber-400 cursor-pointer"
            />
            <span className="w-10 text-[11px] text-amber-400 font-mono">{sunlight}%</span>
          </div>
        </div>

        {/* Organelle Inspector Sidebar */}
        <div className="space-y-4">
          <Card className="p-4 bg-slate-900/90 border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Cell Organelle Directory</h3>
            <div className="grid grid-cols-1 gap-2">
              {ORGANELLES.map((org) => (
                <button
                  key={org.id}
                  onClick={() => setSelectedOrganelle(org)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all text-left ${
                    selectedOrganelle.id === org.id
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-white font-bold'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: org.color }} />
                    <span className="truncate">{org.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Selected Organelle Card */}
          <Card className="p-4 bg-slate-900/90 border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedOrganelle.color }} />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">{selectedOrganelle.name}</h3>
            </div>

            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="text-[11px] text-emerald-400 font-semibold">
                Role: {selectedOrganelle.role}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {selectedOrganelle.description}
              </p>
            </div>

            <div className="p-2.5 bg-emerald-950/20 border border-emerald-800/40 rounded-xl text-[11px] text-emerald-300 space-y-1">
              <strong className="block text-emerald-200">Biochemical Equation:</strong>
              <div className="font-mono text-[10px] text-slate-300">
                6CO₂ + 6H₂O + Sunlight → C₆H₁₂O₆ + 6O₂
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
