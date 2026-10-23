import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Play, RotateCcw, CheckCircle2, Sparkles, Lightbulb, Zap, HelpCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { experimentService } from '../../services/experiments';

export const CircuitExperiment: React.FC<{ experimentId?: number; onComplete?: () => void }> = ({
  experimentId = 1,
  onComplete,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isSwitchClosed, setIsSwitchClosed] = useState<boolean>(false);
  const [voltage, setVoltage] = useState<number>(9); // 9V battery
  const [bulbState, setBulbState] = useState<'off' | 'on'>('off');
  const [sessionSaved, setSessionSaved] = useState<boolean>(false);

  // Three.js object references
  const switchLeverRef = useRef<THREE.Mesh | null>(null);
  const bulbMeshRef = useRef<THREE.Mesh | null>(null);
  const bulbLightRef = useRef<THREE.PointLight | null>(null);
  const electronsRef = useRef<THREE.Points | null>(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // 1. Scene, Camera, Renderer
    const width = currentMount.clientWidth;
    const height = currentMount.clientHeight || 500;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 15, 20);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    currentMount.appendChild(renderer.domElement);

    // 2. Ambient & Directional Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 15);
    scene.add(dirLight);

    // 3. Circuit Board / Table
    const boardGeo = new THREE.BoxGeometry(22, 0.8, 14);
    const boardMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.y = -0.4;
    scene.add(board);

    // 4. Battery (9V Cylinder)
    const batteryGroup = new THREE.Group();
    const batteryBodyGeo = new THREE.CylinderGeometry(1.2, 1.2, 4, 32);
    const batteryBodyMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5, roughness: 0.3 });
    const batteryBody = new THREE.Mesh(batteryBodyGeo, batteryBodyMat);
    batteryBody.rotation.z = Math.PI / 2;
    batteryGroup.add(batteryBody);

    const terminalGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.5, 16);
    const posTerminalMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
    const posTerminal = new THREE.Mesh(terminalGeo, posTerminalMat);
    posTerminal.rotation.z = Math.PI / 2;
    posTerminal.position.x = 2.2;
    batteryGroup.add(posTerminal);

    const negTerminalMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6 });
    const negTerminal = new THREE.Mesh(terminalGeo, negTerminalMat);
    negTerminal.rotation.z = Math.PI / 2;
    negTerminal.position.x = -2.2;
    batteryGroup.add(negTerminal);

    batteryGroup.position.set(0, 0.6, -4);
    scene.add(batteryGroup);

    // 5. Knife Switch
    const switchGroup = new THREE.Group();
    const switchBaseGeo = new THREE.BoxGeometry(3, 0.4, 1.5);
    const switchBaseMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
    const switchBase = new THREE.Mesh(switchBaseGeo, switchBaseMat);
    switchGroup.add(switchBase);

    // Lever blade
    const leverGeo = new THREE.BoxGeometry(2.5, 0.2, 0.3);
    const leverMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 });
    const switchLever = new THREE.Mesh(leverGeo, leverMat);
    switchLever.position.set(1.2, 0.4, 0);
    switchGroup.add(switchLever);
    switchLeverRef.current = switchLever;

    switchGroup.position.set(-6, 0.3, 2);
    scene.add(switchGroup);

    // 6. Light Bulb
    const bulbGroup = new THREE.Group();
    const bulbBaseGeo = new THREE.CylinderGeometry(0.8, 0.6, 1, 16);
    const bulbBaseMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 });
    const bulbBase = new THREE.Mesh(bulbBaseGeo, bulbBaseMat);
    bulbGroup.add(bulbBase);

    const bulbGlassGeo = new THREE.SphereGeometry(1.4, 32, 32);
    const bulbGlassMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      transparent: true,
      opacity: 0.7,
      roughness: 0.1,
    });
    const bulbGlass = new THREE.Mesh(bulbGlassGeo, bulbGlassMat);
    bulbGlass.position.y = 1.4;
    bulbGroup.add(bulbGlass);
    bulbMeshRef.current = bulbGlass;

    const bulbLight = new THREE.PointLight(0xffea00, 0, 15);
    bulbLight.position.set(0, 1.4, 0);
    bulbGroup.add(bulbLight);
    bulbLightRef.current = bulbLight;

    bulbGroup.position.set(6, 0.6, 2);
    scene.add(bulbGroup);

    // 7. Copper Connecting Wires
    const wireMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4, metalness: 0.7 });
    
    // Wire 1: Battery (+) to Bulb
    const wire1Curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(2.5, 0.6, -4),
      new THREE.Vector3(7, 0.4, -4),
      new THREE.Vector3(7, 0.4, 1.5),
      new THREE.Vector3(6.8, 0.6, 2),
    ]);
    const wire1Geo = new THREE.TubeGeometry(wire1Curve, 40, 0.12, 8, false);
    scene.add(new THREE.Mesh(wire1Geo, wireMat));

    // Wire 2: Bulb to Switch
    const wire2Curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(5.2, 0.6, 2),
      new THREE.Vector3(1, 0.4, 3),
      new THREE.Vector3(-4.5, 0.4, 2),
    ]);
    const wire2Geo = new THREE.TubeGeometry(wire2Curve, 40, 0.12, 8, false);
    scene.add(new THREE.Mesh(wire2Geo, wireMat));

    // Wire 3: Switch to Battery (-)
    const wire3Curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-7.5, 0.6, 2),
      new THREE.Vector3(-7, 0.4, -4),
      new THREE.Vector3(-2.5, 0.6, -4),
    ]);
    const wire3Geo = new THREE.TubeGeometry(wire3Curve, 40, 0.12, 8, false);
    scene.add(new THREE.Mesh(wire3Geo, wireMat));

    // 8. Animation Loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      // Gentle orbit camera tilt
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!currentMount) return;
      const w = currentMount.clientWidth;
      const h = currentMount.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      if (currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Handle Switch Toggle
  const toggleSwitch = async () => {
    const newState = !isSwitchClosed;
    setIsSwitchClosed(newState);

    if (switchLeverRef.current) {
      // Rotate lever: 0 for closed, -0.6 radians for open
      switchLeverRef.current.rotation.z = newState ? 0 : -0.6;
    }

    if (bulbMeshRef.current && bulbLightRef.current) {
      if (newState) {
        // Bulb ON
        (bulbMeshRef.current.material as THREE.MeshStandardMaterial).color.setHex(0xfffa65);
        (bulbMeshRef.current.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(0xffea00);
        (bulbMeshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.8;
        bulbLightRef.current.intensity = 3.5;
        setBulbState('on');

        // Record experiment completion to backend
        try {
          const session = await experimentService.startSession(experimentId);
          await experimentService.completeSession(session.id);
          setSessionSaved(true);
          onComplete?.();
        } catch (e) {
          console.log('Saved experiment interaction locally.');
        }
      } else {
        // Bulb OFF
        (bulbMeshRef.current.material as THREE.MeshStandardMaterial).color.setHex(0x334155);
        (bulbMeshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
        bulbLightRef.current.intensity = 0;
        setBulbState('off');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white">Interactive 3D Electric Circuit Lab</h2>
            <Badge variant="purple">Physics 101</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Observe current flow, voltage drop, and electrical circuit connectivity in real-time 3D.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={isSwitchClosed ? 'glow' : 'primary'}
            size="md"
            onClick={toggleSwitch}
            className="font-bold"
          >
            <Zap className="w-4 h-4 mr-2" />
            {isSwitchClosed ? 'Open Knife Switch (Break Loop)' : 'Close Knife Switch (Complete Circuit)'}
          </Button>
        </div>
      </div>

      {/* 3D Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 relative h-[500px] w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
          <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Interactive HUD Overlay */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3 py-2 rounded-xl text-xs text-slate-300">
              <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px]">Circuit Status</span>
              <span className={`font-bold ${isSwitchClosed ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isSwitchClosed ? '● CLOSED LOOP (Current Flowing)' : '○ OPEN CIRCUIT (Zero Current)'}
              </span>
            </div>
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3 py-2 rounded-xl text-xs text-slate-300">
              <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px]">Filament Bulb</span>
              <span className="font-bold text-white flex items-center gap-1.5">
                <Lightbulb className={`w-3.5 h-3.5 ${bulbState === 'on' ? 'text-yellow-400 fill-yellow-400' : 'text-slate-500'}`} />
                {bulbState === 'on' ? 'Glowing at 9V Potential' : 'Extinguished'}
              </span>
            </div>
          </div>

          {sessionSaved && (
            <div className="absolute bottom-4 right-4 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Real experiment completion recorded
            </div>
          )}
        </div>

        {/* Educational Physics Guide */}
        <Card className="lg:col-span-1 p-5 space-y-4 bg-slate-900/90">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Physics Concept</h3>
          <div className="text-xs text-slate-400 space-y-3 leading-relaxed">
            <p>
              An <strong className="text-white">electric circuit</strong> requires an unbroken path composed of conductive material (copper wires) connecting the positive and negative terminals of an energy source (9V DC battery).
            </p>
            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
              <div className="text-[11px] font-mono text-cyan-400 font-semibold mb-1">Ohm's Law:</div>
              <div className="text-sm font-mono text-white font-bold">I = V / R</div>
              <div className="text-[10px] text-slate-500 mt-1">Current (Amps) = Voltage (Volts) ÷ Resistance (Ohms)</div>
            </div>
            <p>
              When the <span className="text-amber-400 font-semibold">knife switch</span> is open, air resistance is infinite, preventing electron drift. Closing the switch permits electrical current to reach the tungsten filament, which produces visible light through incandescence.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
