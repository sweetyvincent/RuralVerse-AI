import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Play, Pause, RotateCcw, Zap, Compass, Lightbulb, Activity, ArrowLeftRight, Info } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

export const ElectromagnetismLab: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [magnetPos, setMagnetPos] = useState<number>(-5); // X position from -8 to +8
  const [isNorthLeft, setIsNorthLeft] = useState<boolean>(true);
  const [coilTurns, setCoilTurns] = useState<number>(4); // 2, 4, or 8 turns
  const [autoPlunge, setAutoPlunge] = useState<boolean>(false);
  const [plungeSpeed, setPlungeSpeed] = useState<number>(1);
  const [inducedVoltage, setInducedVoltage] = useState<number>(0); // mV

  const magnetGroupRef = useRef<THREE.Group | null>(null);
  const bulbLightRef = useRef<THREE.PointLight | null>(null);
  const bulbMeshRef = useRef<THREE.Mesh | null>(null);
  const needleMeshRef = useRef<THREE.Mesh | null>(null);
  const coilGroupRef = useRef<THREE.Group | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Velocity tracker for manual slider
  const lastPosRef = useRef<number>(magnetPos);
  const lastTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const width = currentMount.clientWidth;
    const height = currentMount.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 8, 18);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    currentMount.appendChild(renderer.domElement);

    // OrbitControls: 360 degree rotation
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 6;
    controls.maxDistance = 35;
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(10, 20, 15);
    scene.add(dirLight);

    // Lab Workbench Bench
    const benchGeo = new THREE.BoxGeometry(26, 0.6, 16);
    const benchMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const bench = new THREE.Mesh(benchGeo, benchMat);
    bench.position.y = -3;
    scene.add(bench);

    const grid = new THREE.GridHelper(24, 24, 0x1e293b, 0x0f172a);
    grid.position.y = -2.69;
    scene.add(grid);

    // 1. Copper Wire Solenoid (Coil at center X=0)
    const coilGroup = new THREE.Group();
    scene.add(coilGroup);
    coilGroupRef.current = coilGroup;

    // 2. Bar Magnet Group (X-axis position)
    const magnetGroup = new THREE.Group();
    magnetGroup.position.set(magnetPos, 0, 0);
    scene.add(magnetGroup);
    magnetGroupRef.current = magnetGroup;

    // 3. Galvanometer Body & Analog Needle
    const galvoGroup = new THREE.Group();
    galvoGroup.position.set(0, 3.8, -4.5);
    scene.add(galvoGroup);

    // Meter Housing
    const meterBoxGeo = new THREE.BoxGeometry(4.5, 3.2, 1.2);
    const meterBoxMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
    const meterBox = new THREE.Mesh(meterBoxGeo, meterBoxMat);
    galvoGroup.add(meterBox);

    // Meter Dial Face
    const dialGeo = new THREE.CircleGeometry(1.3, 32);
    const dialMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    const dial = new THREE.Mesh(dialGeo, dialMat);
    dial.position.set(0, 0.2, 0.61);
    galvoGroup.add(dial);

    // Galvanometer Needle (Pivot at 0, 0, 0.63)
    const needlePivot = new THREE.Group();
    needlePivot.position.set(0, 0, 0.63);
    galvoGroup.add(needlePivot);

    const needleGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.1, 8);
    const needleMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const needle = new THREE.Mesh(needleGeo, needleMat);
    needle.position.set(0, 0.55, 0);
    needlePivot.add(needle);
    needleMeshRef.current = needlePivot as unknown as THREE.Mesh;

    // Center pivot cap
    const capGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const capMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.set(0, 0, 0.05);
    needlePivot.add(cap);

    // 4. Incandescent Light Bulb (Glows with induced voltage)
    const bulbGroup = new THREE.Group();
    bulbGroup.position.set(5.5, 0.5, -3);
    scene.add(bulbGroup);

    // Socket base
    const baseGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.8, 16);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -0.4;
    bulbGroup.add(base);

    // Glass bulb dome
    const bulbGeo = new THREE.SphereGeometry(1.0, 32, 32);
    const bulbMat = new THREE.MeshPhysicalMaterial({
      color: 0x475569,
      emissive: 0x000000,
      transparent: true,
      opacity: 0.8,
      roughness: 0.1,
      transmission: 0.7,
    });
    const bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
    bulbGroup.add(bulbMesh);
    bulbMeshRef.current = bulbMesh;

    // Glowing point light inside bulb
    const bulbLight = new THREE.PointLight(0xfef08a, 0, 15);
    bulbGroup.add(bulbLight);
    bulbLightRef.current = bulbLight;

    // Circuit wires connecting coil to meter and bulb
    const wireMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 });
    const wirePoints1 = [new THREE.Vector3(0, -1.8, 0), new THREE.Vector3(0, -2.5, -4), new THREE.Vector3(0, 2.2, -4.5)];
    const wirePoints2 = [new THREE.Vector3(0, 1.8, 0), new THREE.Vector3(5.5, 0, -3)];
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(wirePoints1), wireMat));
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(wirePoints2), wireMat));

    // Animation Loop
    let clock = new THREE.Clock();
    let currentX = magnetPos;
    let autoDir = 1;

    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      controls.update();

      // Auto plunge generator mode
      if (autoPlunge && magnetGroupRef.current) {
        currentX += autoDir * delta * 5.5 * plungeSpeed;
        if (currentX > 5.5) {
          currentX = 5.5;
          autoDir = -1;
        } else if (currentX < -5.5) {
          currentX = -5.5;
          autoDir = 1;
        }
        setMagnetPos(currentX);
        magnetGroupRef.current.position.x = currentX;

        // Calculate velocity v = dx/dt
        const velocity = autoDir * 5.5 * plungeSpeed;
        // Faraday's Law: EMF proportional to N * (dPhi/dx) * (dx/dt)
        // Flux peak at x = 0, derivative is maximum near x = +/- 1.5
        const fluxDerivative = -currentX * Math.exp(-(currentX * currentX) / 4);
        const poleSign = isNorthLeft ? 1 : -1;
        const calculatedVoltage = -coilTurns * fluxDerivative * velocity * poleSign * 18;

        setInducedVoltage(Math.round(calculatedVoltage));
        updateVisualFeedback(calculatedVoltage);
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
  }, [coilTurns, autoPlunge, plungeSpeed, isNorthLeft]);

  // Visual helper to update needle deflection and bulb brightness
  const updateVisualFeedback = (voltage: number) => {
    // Needle rotation (max +/- 55 degrees)
    if (needleMeshRef.current) {
      const angle = THREE.MathUtils.clamp((voltage / 80) * (Math.PI / 3.5), -Math.PI / 3, Math.PI / 3);
      needleMeshRef.current.rotation.z = -angle;
    }

    // Bulb glow intensity
    const absV = Math.abs(voltage);
    const intensity = Math.min(absV / 25, 4.0);
    if (bulbLightRef.current) {
      bulbLightRef.current.intensity = intensity;
    }
    if (bulbMeshRef.current) {
      const mat = bulbMeshRef.current.material as THREE.MeshPhysicalMaterial;
      if (mat) {
        if (absV > 5) {
          mat.emissive.setHex(0xfef08a);
          mat.emissiveIntensity = Math.min(absV / 40, 2.5);
        } else {
          mat.emissive.setHex(0x000000);
          mat.emissiveIntensity = 0;
        }
      }
    }
  };

  // Build / Rebuild Solenoid Coil when coilTurns changes
  useEffect(() => {
    if (!coilGroupRef.current) return;
    const group = coilGroupRef.current;
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    // Solenoid winding using CatmullRomCurve3
    const coilRadius = 1.6;
    const coilLength = 3.6;
    const turns = coilTurns;

    const points: THREE.Vector3[] = [];
    const totalSegments = turns * 32;
    for (let i = 0; i <= totalSegments; i++) {
      const t = i / totalSegments;
      const angle = 2 * Math.PI * turns * t;
      const x = (t - 0.5) * coilLength;
      const y = Math.cos(angle) * coilRadius;
      const z = Math.sin(angle) * coilRadius;
      points.push(new THREE.Vector3(x, y, z));
    }

    const path = new THREE.CatmullRomCurve3(points);
    const tubeGeo = new THREE.TubeGeometry(path, 128, 0.12, 12, false);
    const copperMat = new THREE.MeshStandardMaterial({
      color: 0xb45309, // Copper color
      metalness: 0.85,
      roughness: 0.25,
    });
    const coilMesh = new THREE.Mesh(tubeGeo, copperMat);
    group.add(coilMesh);

    // Acrylic support tube
    const glassTubeGeo = new THREE.CylinderGeometry(coilRadius * 0.95, coilRadius * 0.95, coilLength * 1.2, 32, 1, true);
    const glassTubeMat = new THREE.MeshPhysicalMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.2,
      roughness: 0.1,
    });
    const glassTube = new THREE.Mesh(glassTubeGeo, glassTubeMat);
    glassTube.rotation.z = Math.PI / 2;
    group.add(glassTube);
  }, [coilTurns]);

  // Build / Rebuild Bar Magnet with Field Lines
  useEffect(() => {
    if (!magnetGroupRef.current) return;
    const group = magnetGroupRef.current;
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    const poleLength = 1.8;
    const poleRadius = 0.65;
    const northColor = 0xef4444; // Red
    const southColor = 0x3b82f6; // Blue

    const northMat = new THREE.MeshStandardMaterial({ color: isNorthLeft ? northColor : southColor, roughness: 0.3 });
    const southMat = new THREE.MeshStandardMaterial({ color: isNorthLeft ? southColor : northColor, roughness: 0.3 });

    const poleGeo = new THREE.BoxGeometry(poleLength, poleRadius * 2, poleRadius * 2);

    const leftPole = new THREE.Mesh(poleGeo, northMat);
    leftPole.position.x = -poleLength / 2;
    group.add(leftPole);

    const rightPole = new THREE.Mesh(poleGeo, southMat);
    rightPole.position.x = poleLength / 2;
    group.add(rightPole);

    // Add Magnetic Dipole Field Lines
    const fieldLinesGroup = new THREE.Group();
    group.add(fieldLinesGroup);

    const loopRadii = [1.8, 2.6, 3.5];
    loopRadii.forEach((r) => {
      [1, -1].forEach((yDir) => {
        const curve = new THREE.EllipseCurve(
          0,
          yDir * r * 0.6, // ax, ay
          poleLength * 1.6,
          r, // xRadius, yRadius
          0,
          Math.PI * 2,
          false,
          0
        );

        const points = curve.getPoints(50);
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineBasicMaterial({
          color: 0x06b6d4,
          transparent: true,
          opacity: 0.35,
        });
        fieldLinesGroup.add(new THREE.Line(lineGeo, lineMat));
      });
    });
  }, [isNorthLeft]);

  // Handle manual slider position change
  const handleSliderChange = (newVal: number) => {
    setAutoPlunge(false);
    const now = Date.now();
    const dt = Math.max((now - lastTimeRef.current) / 1000, 0.016);
    const dx = newVal - lastPosRef.current;
    const velocity = dx / dt;

    lastPosRef.current = newVal;
    lastTimeRef.current = now;
    setMagnetPos(newVal);

    if (magnetGroupRef.current) {
      magnetGroupRef.current.position.x = newVal;
    }

    // Induced EMF = -N * dPhi/dt = -N * (dPhi/dx) * (dx/dt)
    const fluxDerivative = -newVal * Math.exp(-(newVal * newVal) / 4);
    const poleSign = isNorthLeft ? 1 : -1;
    const calculatedVoltage = -coilTurns * fluxDerivative * velocity * poleSign * 12;

    setInducedVoltage(Math.round(calculatedVoltage));
    updateVisualFeedback(calculatedVoltage);
  };

  return (
    <div className="space-y-6">
      {/* Simulation Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="amber">Electromagnetism & Faraday's Law</Badge>
            <span className="text-xs text-slate-400">Class 10–12 NCERT Physics</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" /> Electromagnetic Induction & AC Generator 3D
          </h2>
          <p className="text-xs text-slate-400">
            Slide the bar magnet through the copper coil to generate live induced current. Observe Lenz's Law, galvanometer deflection, and bulb incandescence.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoPlunge(!autoPlunge)}
            className="flex items-center gap-1.5"
          >
            {autoPlunge ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
            <span>{autoPlunge ? 'Pause Plunge' : 'Auto Generator Mode'}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (controlsRef.current) controlsRef.current.reset();
              setMagnetPos(-5);
              setAutoPlunge(false);
              setInducedVoltage(0);
              updateVisualFeedback(0);
            }}
            className="text-slate-400 hover:text-white"
            title="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Simulation Viewport and Sidebar Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 3D Canvas */}
        <div className="lg:col-span-3 relative h-[520px] rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
          <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Telemetry HUD */}
          <div className="absolute top-4 left-4 bg-slate-900/85 backdrop-blur-md border border-slate-800/80 rounded-2xl p-3.5 text-xs space-y-1.5 pointer-events-none">
            <div className="flex items-center gap-2 text-white font-bold">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Induced EMF: </span>
              <span className={`font-mono text-sm font-black ${inducedVoltage > 0 ? 'text-emerald-400' : inducedVoltage < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                {inducedVoltage > 0 ? `+${inducedVoltage}` : inducedVoltage} mV
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Coil Turns: <span className="text-white font-semibold">{coilTurns}</span> • Magnet Pole Facing: <span className="text-cyan-400 font-bold">{isNorthLeft ? 'North (N)' : 'South (S)'}</span>
            </div>
          </div>

          {/* Orbit Navigation Tip */}
          <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 px-3 py-1.5 rounded-xl text-[11px] text-slate-400 flex items-center gap-1.5 pointer-events-none">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>Drag mouse to rotate 360° • Scroll to zoom</span>
          </div>

          {/* Live Magnet Slider Overlay (Floating Center Bottom) */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md border border-slate-800/90 px-6 py-3 rounded-2xl flex flex-col sm:flex-row items-center gap-4 text-xs shadow-2xl w-[90%] sm:w-auto">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
              <span>Magnet Plunger Position:</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-500 font-mono">-6</span>
              <input
                type="range"
                min="-6"
                max="6"
                step="0.05"
                value={magnetPos}
                onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
                className="w-48 sm:w-64 accent-amber-400 cursor-pointer"
              />
              <span className="text-[11px] text-slate-500 font-mono">+6</span>
            </div>

            <span className="text-amber-400 font-mono font-bold w-12 text-center">
              {magnetPos.toFixed(1)} cm
            </span>
          </div>
        </div>

        {/* Experiment Controls Sidebar */}
        <div className="space-y-4">
          <Card className="p-4 bg-slate-900/90 border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Apparatus Controls</h3>

            {/* Coil Turns Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 block">Solenoid Wire Loops (N)</label>
              <div className="grid grid-cols-3 gap-2">
                {[2, 4, 8].map((turns) => (
                  <button
                    key={turns}
                    onClick={() => setCoilTurns(turns)}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                      coilTurns === turns
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {turns} Turns
                  </button>
                ))}
              </div>
            </div>

            {/* Flip Poles Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNorthLeft(!isNorthLeft)}
              className="w-full flex items-center justify-center gap-2 text-xs"
            >
              <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
              <span>Flip Magnetic Dipole (N ↔ S)</span>
            </Button>

            {/* Auto Plunge Speed */}
            {autoPlunge && (
              <div className="space-y-1 pt-2 border-t border-slate-800">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Generator Frequency:</span>
                  <span className="text-amber-400 font-mono font-bold">{plungeSpeed.toFixed(1)} Hz</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={plungeSpeed}
                  onChange={(e) => setPlungeSpeed(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
            )}
          </Card>

          {/* Scientific Equations & Principle */}
          <Card className="p-4 bg-slate-900/90 border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400" /> Faraday & Lenz Laws
            </h3>

            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="font-mono text-amber-400 font-bold text-[12px]">
                ℰ = -N · (dΦ_B / dt)
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                <strong>Faraday's Law:</strong> An electromotive force is induced in a conductor whenever the magnetic flux linking it changes with time.
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                <strong>Lenz's Law (Negative sign):</strong> The induced current creates a magnetic field that opposes the motion of the magnet causing it.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
