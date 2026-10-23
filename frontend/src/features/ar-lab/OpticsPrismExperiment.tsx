import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Play, RotateCcw, Lightbulb, Sparkles, Sun, Eye, Info } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

interface MediumData {
  name: string;
  n: number; // refractive index
  description: string;
}

const MEDIA: MediumData[] = [
  { name: 'Crown Glass', n: 1.52, description: 'Standard optical glass used in rural school laboratory prisms.' },
  { name: 'Flint Glass', n: 1.66, description: 'Dense optical glass exhibiting high optical dispersion.' },
  { name: 'Water Prism', n: 1.33, description: 'Liquid refraction simulating natural atmospheric raindrop rainbows.' },
  { name: 'Pure Diamond', n: 2.42, description: 'Highest optical refractive index with extreme light bending and brilliance.' },
];

// 7 Rainbow spectral colors (ROYGBIV)
const SPECTRUM_COLORS = [
  { name: 'Red', hex: 0xef4444, wavelength: '700 nm', deltaN: -0.015 },
  { name: 'Orange', hex: 0xf97316, wavelength: '620 nm', deltaN: -0.010 },
  { name: 'Yellow', hex: 0xeab308, wavelength: '580 nm', deltaN: -0.005 },
  { name: 'Green', hex: 0x22c55e, wavelength: '530 nm', deltaN: 0.000 },
  { name: 'Cyan', hex: 0x06b6d4, wavelength: '490 nm', deltaN: 0.006 },
  { name: 'Blue', hex: 0x3b82f6, wavelength: '450 nm', deltaN: 0.012 },
  { name: 'Violet', hex: 0xa855f7, wavelength: '400 nm', deltaN: 0.020 },
];

export const OpticsPrismExperiment: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedMedium, setSelectedMedium] = useState<MediumData>(MEDIA[0]); // Crown Glass
  const [incidenceAngle, setIncidenceAngle] = useState<number>(45); // degrees
  const [isLightOn, setIsLightOn] = useState<boolean>(true);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const raysGroupRef = useRef<THREE.Group | null>(null);
  const prismMeshRef = useRef<THREE.Mesh | null>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const width = currentMount.clientWidth;
    const height = currentMount.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 10, 22);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    currentMount.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set(10, 20, 15);
    scene.add(directionalLight);

    // Lab Optics Bench Table
    const benchGeo = new THREE.BoxGeometry(26, 0.6, 16);
    const benchMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7, metalness: 0.2 });
    const bench = new THREE.Mesh(benchGeo, benchMat);
    bench.position.y = -3;
    scene.add(bench);

    // Grid on bench
    const grid = new THREE.GridHelper(24, 24, 0x1e293b, 0x0f172a);
    grid.position.y = -2.69;
    scene.add(grid);

    // Create Triangular Glass Prism
    // An equilateral triangle prism
    const prismShape = new THREE.Shape();
    const prismRadius = 3.8;
    prismShape.moveTo(0, prismRadius);
    prismShape.lineTo(-prismRadius * Math.cos(Math.PI / 6), -prismRadius * Math.sin(Math.PI / 6));
    prismShape.lineTo(prismRadius * Math.cos(Math.PI / 6), -prismRadius * Math.sin(Math.PI / 6));
    prismShape.closePath();

    const extrudeSettings = {
      depth: 4.5,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.1,
      bevelThickness: 0.1,
    };

    const prismGeo = new THREE.ExtrudeGeometry(prismShape, extrudeSettings);
    prismGeo.center();

    const prismMat = new THREE.MeshPhysicalMaterial({
      color: 0xe2e8f0,
      transmission: 0.9,
      opacity: 0.85,
      transparent: true,
      roughness: 0.05,
      ior: selectedMedium.n,
      reflectivity: 0.5,
      metalness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });

    const prismMesh = new THREE.Mesh(prismGeo, prismMat);
    prismMesh.position.set(0, 0, 0);
    scene.add(prismMesh);
    prismMeshRef.current = prismMesh;

    // Light Source Emitter Box
    const emitterGeo = new THREE.BoxGeometry(2.5, 1.8, 1.8);
    const emitterMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6 });
    const emitter = new THREE.Mesh(emitterGeo, emitterMat);
    emitter.position.set(-10, 0, 0);
    scene.add(emitter);

    const lensGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 24);
    const lensMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.rotation.z = Math.PI / 2;
    lens.position.set(-8.6, 0, 0);
    scene.add(lens);

    // Group for rays
    const raysGroup = new THREE.Group();
    scene.add(raysGroup);
    raysGroupRef.current = raysGroup;

    // Render loop
    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);
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

  // Update rays whenever incidenceAngle, selectedMedium, or isLightOn changes
  useEffect(() => {
    if (!raysGroupRef.current) return;
    const group = raysGroupRef.current;

    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    if (!isLightOn) return;

    const rad = (incidenceAngle * Math.PI) / 180;
    const emitterPos = new THREE.Vector3(-8.6, 0, 0);
    const entryPoint = new THREE.Vector3(-1.8, Math.sin(rad - Math.PI / 4) * 0.8, 0);

    // 1. Incident White Light Beam
    const incidentPoints = [emitterPos, entryPoint];
    const incidentGeo = new THREE.BufferGeometry().setFromPoints(incidentPoints);
    const incidentMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 3,
      transparent: true,
      opacity: 0.95,
    });
    group.add(new THREE.Line(incidentGeo, incidentMat));

    // Glow tube around incident ray
    const tubeCurve = new THREE.LineCurve3(emitterPos, entryPoint);
    const tubeGeo = new THREE.TubeGeometry(tubeCurve, 12, 0.08, 8, false);
    const tubeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
    group.add(new THREE.Mesh(tubeGeo, tubeMat));

    // 2. Dispersed Beams (Internal Refraction & External Exit)
    SPECTRUM_COLORS.forEach((color, idx) => {
      const effectiveN = selectedMedium.n + color.deltaN;
      // Snell's Law angle calculation
      const internalAngle = Math.asin(Math.sin(rad * 0.5) / effectiveN);
      const exitDeviation = (rad * 0.4) + (idx * 0.055 * (selectedMedium.n - 1));

      const midPoint = new THREE.Vector3(
        1.8,
        entryPoint.y + Math.tan(internalAngle - 0.2) * 2.8 - (idx * 0.12),
        0
      );

      const exitPoint = new THREE.Vector3(
        9.5,
        midPoint.y - Math.sin(exitDeviation) * 5.5,
        0
      );

      // Internal ray
      const internalGeo = new THREE.BufferGeometry().setFromPoints([entryPoint, midPoint]);
      const internalMat = new THREE.LineBasicMaterial({
        color: color.hex,
        linewidth: 2,
        transparent: true,
        opacity: 0.7,
      });
      group.add(new THREE.Line(internalGeo, internalMat));

      // Dispersed exited ray
      const exitCurve = new THREE.LineCurve3(midPoint, exitPoint);
      const exitTubeGeo = new THREE.TubeGeometry(exitCurve, 16, 0.05, 8, false);
      const exitTubeMat = new THREE.MeshBasicMaterial({
        color: color.hex,
        transparent: true,
        opacity: 0.85,
      });
      group.add(new THREE.Mesh(exitTubeGeo, exitTubeMat));

      // Projection screen dot at destination
      const dotGeo = new THREE.SphereGeometry(0.12, 12, 12);
      const dotMat = new THREE.MeshBasicMaterial({ color: color.hex });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(exitPoint);
      group.add(dot);
    });

    // Projection White Screen
    const screenGeo = new THREE.BoxGeometry(0.2, 8, 4);
    const screenMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.set(9.7, -1.5, 0);
    group.add(screenMesh);
  }, [incidenceAngle, selectedMedium, isLightOn]);

  return (
    <div className="space-y-6">
      {/* Simulation Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="cyan">Geometrical & Wave Optics</Badge>
            <span className="text-xs text-slate-400">Class 8–10 NCERT Physics</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sun className="w-5 h-5 text-amber-400" /> Light Ray Dispersion & Refraction Prism 3D
          </h2>
          <p className="text-xs text-slate-400">
            Interactive Snell's Law refraction, Newton's spectral dispersion (ROYGBIV), and angle of deviation.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLightOn(!isLightOn)}
            className="flex items-center gap-1.5"
          >
            <Lightbulb className={`w-4 h-4 ${isLightOn ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
            <span>{isLightOn ? 'Lamp Active' : 'Lamp Off'}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIncidenceAngle(45);
              setSelectedMedium(MEDIA[0]);
              setIsLightOn(true);
            }}
            className="text-slate-400 hover:text-white"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 3D Viewport & Parameter Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 3D Canvas */}
        <div className="lg:col-span-3 relative h-[500px] rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
          <div ref={mountRef} className="w-full h-full" />

          {/* Optical Telemetry HUD */}
          <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-3 text-xs space-y-1 pointer-events-none">
            <div className="flex items-center gap-2 text-white font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>Prism Medium: {selectedMedium.name}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Refractive Index: <span className="text-cyan-400 font-mono font-bold">n = {selectedMedium.n.toFixed(2)}</span> • Incidence: <span className="text-amber-400 font-mono">{incidenceAngle}°</span>
            </div>
          </div>

          {/* Rainbow Spectral Legend */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 px-3 py-2 rounded-xl text-[11px] overflow-x-auto max-w-[85%]">
            <span className="text-slate-400 font-semibold mr-1">Spectrum:</span>
            {SPECTRUM_COLORS.map((c) => (
              <span key={c.name} className="flex items-center gap-1 text-slate-300">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: `#${c.hex.toString(16)}` }} />
                <span>{c.name}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Experiment Sidebar Controls */}
        <div className="space-y-4">
          <Card className="p-4 bg-slate-900/90 border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Optical Parameters</h3>

            {/* Incidence Angle Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Angle of Incidence (i):</span>
                <span className="text-amber-400 font-mono font-bold">{incidenceAngle}°</span>
              </div>
              <input
                type="range"
                min="20"
                max="65"
                step="1"
                value={incidenceAngle}
                onChange={(e) => setIncidenceAngle(parseInt(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block">Typical range: 25°–60° for visible dispersion.</span>
            </div>

            {/* Medium Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 block">Prism Material</label>
              <div className="grid grid-cols-1 gap-2">
                {MEDIA.map((m) => (
                  <button
                    key={m.name}
                    onClick={() => setSelectedMedium(m)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all text-left ${
                      selectedMedium.name === m.name
                        ? 'bg-amber-500/10 border-amber-500/40 text-white font-bold'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span>{m.name}</span>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      n = {m.n}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-slate-900/90 border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400" /> Scientific Principles
            </h3>

            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-2 text-slate-300">
              <div className="font-mono text-cyan-300 text-[11px]">
                n₁ · sin(θ₁) = n₂ · sin(θ₂)
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                <strong>Why dispersion occurs:</strong> Different wavelengths of light travel at different speeds through the glass prism. Violet light slows down the most (highest refractive index) and bends sharply, while red light bends the least.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
