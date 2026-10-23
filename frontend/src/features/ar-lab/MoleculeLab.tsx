import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Play, Pause, RotateCcw, Sparkles, Layers, Thermometer, Info, Eye, Compass } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

interface AtomData {
  element: string;
  pos: [number, number, number];
  color: number;
  radius: number; // covalent radius in Angstroms/units
  vanDerWaals: number;
  electronegativity: number;
}

interface BondData {
  from: number;
  to: number;
  order: 1 | 2 | 3;
}

interface MoleculeData {
  id: string;
  name: string;
  formula: string;
  geometry: string;
  bondAngle: string;
  isPolar: boolean;
  dipoleMoment: string;
  atoms: AtomData[];
  bonds: BondData[];
  description: string;
  dipoleVector?: [number, number, number]; // direction and magnitude
}

const MOLECULES: MoleculeData[] = [
  {
    id: 'h2o',
    name: 'Water',
    formula: 'H₂O',
    geometry: 'Bent (Non-linear)',
    bondAngle: '104.5°',
    isPolar: true,
    dipoleMoment: '1.85 D',
    dipoleVector: [0, 1.4, 0],
    description: 'Essential for all biological life. Oxygen is highly electronegative (3.44), pulling electron density away from hydrogen to form a permanent polar dipole and vital hydrogen bonds.',
    atoms: [
      { element: 'O', pos: [0, 0.4, 0], color: 0xef4444, radius: 0.66, vanDerWaals: 1.52, electronegativity: 3.44 },
      { element: 'H', pos: [-1.4, -0.6, 0], color: 0xffffff, radius: 0.37, vanDerWaals: 1.2, electronegativity: 2.2 },
      { element: 'H', pos: [1.4, -0.6, 0], color: 0xffffff, radius: 0.37, vanDerWaals: 1.2, electronegativity: 2.2 },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 0, to: 2, order: 1 },
    ],
  },
  {
    id: 'ch4',
    name: 'Methane',
    formula: 'CH₄',
    geometry: 'Tetrahedral',
    bondAngle: '109.5°',
    isPolar: false,
    dipoleMoment: '0.00 D (Non-polar)',
    description: 'The primary constituent of natural biogas and rural gobar gas digesters. The four C-H bond dipoles cancel out perfectly due to tetrahedral symmetry.',
    atoms: [
      { element: 'C', pos: [0, 0, 0], color: 0x475569, radius: 0.77, vanDerWaals: 1.7, electronegativity: 2.55 },
      { element: 'H', pos: [1.2, 1.2, 1.2], color: 0xffffff, radius: 0.37, vanDerWaals: 1.2, electronegativity: 2.2 },
      { element: 'H', pos: [-1.2, -1.2, 1.2], color: 0xffffff, radius: 0.37, vanDerWaals: 1.2, electronegativity: 2.2 },
      { element: 'H', pos: [-1.2, 1.2, -1.2], color: 0xffffff, radius: 0.37, vanDerWaals: 1.2, electronegativity: 2.2 },
      { element: 'H', pos: [1.2, -1.2, -1.2], color: 0xffffff, radius: 0.37, vanDerWaals: 1.2, electronegativity: 2.2 },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 0, to: 2, order: 1 },
      { from: 0, to: 3, order: 1 },
      { from: 0, to: 4, order: 1 },
    ],
  },
  {
    id: 'co2',
    name: 'Carbon Dioxide',
    formula: 'CO₂',
    geometry: 'Linear',
    bondAngle: '180.0°',
    isPolar: false,
    dipoleMoment: '0.00 D (Non-polar)',
    description: 'Key reactant in plant photosynthesis. The two individual polar C=O double bond dipoles point in equal and opposite directions along the linear axis, yielding net zero dipole moment.',
    atoms: [
      { element: 'C', pos: [0, 0, 0], color: 0x475569, radius: 0.75, vanDerWaals: 1.7, electronegativity: 2.55 },
      { element: 'O', pos: [-2.2, 0, 0], color: 0xef4444, radius: 0.65, vanDerWaals: 1.52, electronegativity: 3.44 },
      { element: 'O', pos: [2.2, 0, 0], color: 0xef4444, radius: 0.65, vanDerWaals: 1.52, electronegativity: 3.44 },
    ],
    bonds: [
      { from: 0, to: 1, order: 2 },
      { from: 0, to: 2, order: 2 },
    ],
  },
  {
    id: 'nh3',
    name: 'Ammonia',
    formula: 'NH₃',
    geometry: 'Trigonal Pyramidal',
    bondAngle: '107.8°',
    isPolar: true,
    dipoleMoment: '1.47 D',
    dipoleVector: [0, 1.2, 0],
    description: 'Crucial chemical fertilizer base used across agricultural soil enrichment. The lone electron pair on nitrogen compresses the N-H bond angle slightly below the ideal tetrahedral 109.5° angle.',
    atoms: [
      { element: 'N', pos: [0, 0.6, 0], color: 0x3b82f6, radius: 0.71, vanDerWaals: 1.55, electronegativity: 3.04 },
      { element: 'H', pos: [-1.2, -0.5, 0.7], color: 0xffffff, radius: 0.37, vanDerWaals: 1.2, electronegativity: 2.2 },
      { element: 'H', pos: [1.2, -0.5, 0.7], color: 0xffffff, radius: 0.37, vanDerWaals: 1.2, electronegativity: 2.2 },
      { element: 'H', pos: [0, -0.5, -1.3], color: 0xffffff, radius: 0.37, vanDerWaals: 1.2, electronegativity: 2.2 },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 0, to: 2, order: 1 },
      { from: 0, to: 3, order: 1 },
    ],
  },
  {
    id: 'c2h5oh',
    name: 'Ethanol',
    formula: 'C₂H₅OH',
    geometry: 'Tetrahedral / Bent Hydroxyl',
    bondAngle: '109.5° / 104.5°',
    isPolar: true,
    dipoleMoment: '1.69 D',
    dipoleVector: [1.2, 0.8, 0],
    description: 'Renewable biofuel and solvent. Features an sp3 hybridized carbon chain terminating in a polar electronegative hydroxyl (-OH) group capable of hydrogen bonding with water.',
    atoms: [
      { element: 'C', pos: [-1.2, 0, 0], color: 0x475569, radius: 0.77, vanDerWaals: 1.7, electronegativity: 2.55 },
      { element: 'C', pos: [0.3, 0, 0], color: 0x475569, radius: 0.77, vanDerWaals: 1.7, electronegativity: 2.55 },
      { element: 'O', pos: [1.3, 1.0, 0], color: 0xef4444, radius: 0.66, vanDerWaals: 1.52, electronegativity: 3.44 },
      { element: 'H', pos: [2.1, 0.7, 0], color: 0xffffff, radius: 0.37, vanDerWaals: 1.2, electronegativity: 2.2 },
      { element: 'H', pos: [-1.6, 0.8, 0.6], color: 0xffffff, radius: 0.37, vanDerWaals: 1.2, electronegativity: 2.2 },
      { element: 'H', pos: [-1.6, -0.8, 0.6], color: 0xffffff, radius: 0.37, vanDerWaals: 1.2, electronegativity: 2.2 },
      { element: 'H', pos: [-1.6, 0, -1.0], color: 0xffffff, radius: 0.37, vanDerWaals: 1.2, electronegativity: 2.2 },
      { element: 'H', pos: [0.6, -0.7, 0.7], color: 0xffffff, radius: 0.37, vanDerWaals: 1.2, electronegativity: 2.2 },
      { element: 'H', pos: [0.6, -0.5, -0.9], color: 0xffffff, radius: 0.37, vanDerWaals: 1.2, electronegativity: 2.2 },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 1, to: 2, order: 1 },
      { from: 2, to: 3, order: 1 },
      { from: 0, to: 4, order: 1 },
      { from: 0, to: 5, order: 1 },
      { from: 0, to: 6, order: 1 },
      { from: 1, to: 7, order: 1 },
      { from: 1, to: 8, order: 1 },
    ],
  },
  {
    id: 'nacl',
    name: 'Salt Crystal Lattice',
    formula: 'NaCl (Rock Salt)',
    geometry: 'Face-Centered Cubic (FCC)',
    bondAngle: '90.0°',
    isPolar: true,
    dipoleMoment: 'Ionic Bond (Network)',
    description: 'Ionic crystalline compound. Electropositive Sodium (Na+) transfers an electron to electronegative Chlorine (Cl-), forming a rigid 3D cubic lattice held by powerful electrostatic attraction.',
    atoms: [
      { element: 'Na+', pos: [-1.5, -1.5, -1.5], color: 0xa855f7, radius: 0.5, vanDerWaals: 1.0, electronegativity: 0.93 },
      { element: 'Cl-', pos: [1.5, -1.5, -1.5], color: 0x22c55e, radius: 0.8, vanDerWaals: 1.8, electronegativity: 3.16 },
      { element: 'Cl-', pos: [-1.5, 1.5, -1.5], color: 0x22c55e, radius: 0.8, vanDerWaals: 1.8, electronegativity: 3.16 },
      { element: 'Na+', pos: [1.5, 1.5, -1.5], color: 0xa855f7, radius: 0.5, vanDerWaals: 1.0, electronegativity: 0.93 },
      { element: 'Cl-', pos: [-1.5, -1.5, 1.5], color: 0x22c55e, radius: 0.8, vanDerWaals: 1.8, electronegativity: 3.16 },
      { element: 'Na+', pos: [1.5, -1.5, 1.5], color: 0xa855f7, radius: 0.5, vanDerWaals: 1.0, electronegativity: 0.93 },
      { element: 'Na+', pos: [-1.5, 1.5, 1.5], color: 0xa855f7, radius: 0.5, vanDerWaals: 1.0, electronegativity: 0.93 },
      { element: 'Cl-', pos: [1.5, 1.5, 1.5], color: 0x22c55e, radius: 0.8, vanDerWaals: 1.8, electronegativity: 3.16 },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 0, to: 2, order: 1 },
      { from: 1, to: 3, order: 1 },
      { from: 2, to: 3, order: 1 },
      { from: 0, to: 4, order: 1 },
      { from: 1, to: 5, order: 1 },
      { from: 2, to: 6, order: 1 },
      { from: 3, to: 7, order: 1 },
      { from: 4, to: 5, order: 1 },
      { from: 4, to: 6, order: 1 },
      { from: 5, to: 7, order: 1 },
      { from: 6, to: 7, order: 1 },
    ],
  },
];

type RenderStyle = 'ball_and_stick' | 'space_filling' | 'wireframe';

export const MoleculeLab: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedMolecule, setSelectedMolecule] = useState<MoleculeData>(MOLECULES[0]);
  const [renderStyle, setRenderStyle] = useState<RenderStyle>('ball_and_stick');
  const [temperature, setTemperature] = useState<number>(298); // Room temp ~298K
  const [showDipole, setShowDipole] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [inspectedAtom, setInspectedAtom] = useState<AtomData | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const moleculeGroupRef = useRef<THREE.Group | null>(null);
  const atomMeshesRef = useRef<THREE.Mesh[]>([]);
  const baseAtomPositions = useRef<THREE.Vector3[]>([]);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const width = currentMount.clientWidth;
    const height = currentMount.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 3, 10);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    currentMount.appendChild(renderer.domElement);

    // OrbitControls: Click & Drag to Rotate in 360, Scroll to Zoom
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3;
    controls.maxDistance = 25;
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight1.position.set(10, 15, 10);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.6);
    dirLight2.position.set(-10, -10, -10);
    scene.add(dirLight2);

    const moleculeGroup = new THREE.Group();
    scene.add(moleculeGroup);
    moleculeGroupRef.current = moleculeGroup;

    // Raycaster for click inspection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(atomMeshesRef.current);
      if (intersects.length > 0) {
        const clickedAtomData = intersects[0].object.userData as AtomData;
        if (clickedAtomData && clickedAtomData.element) {
          setInspectedAtom(clickedAtomData);
        }
      }
    };

    renderer.domElement.addEventListener('click', handlePointerDown);

    // Render loop
    let clock = new THREE.Clock();
    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      controls.update();

      if (autoRotate && moleculeGroupRef.current) {
        moleculeGroupRef.current.rotation.y += 0.005;
      }

      // Thermal agitation vibration (temperature scaling)
      if (temperature > 0 && atomMeshesRef.current.length > 0) {
        const amplitude = (temperature / 500) * 0.06;
        atomMeshesRef.current.forEach((mesh, idx) => {
          const basePos = baseAtomPositions.current[idx];
          if (basePos) {
            const freq = 12 + idx * 3;
            mesh.position.x = basePos.x + Math.sin(elapsedTime * freq) * amplitude;
            mesh.position.y = basePos.y + Math.cos(elapsedTime * (freq + 2)) * amplitude;
            mesh.position.z = basePos.z + Math.sin(elapsedTime * (freq + 4)) * amplitude;
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
      renderer.domElement.removeEventListener('click', handlePointerDown);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      controls.dispose();
      renderer.dispose();
      if (currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
    };
  }, [autoRotate]);

  // Rebuild 3D Molecular Geometry whenever molecule or renderStyle changes
  useEffect(() => {
    if (!moleculeGroupRef.current) return;
    const group = moleculeGroupRef.current;

    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    atomMeshesRef.current = [];
    baseAtomPositions.current = [];

    // 1. Create Atoms
    selectedMolecule.atoms.forEach((atom) => {
      const radius =
        renderStyle === 'space_filling'
          ? atom.vanDerWaals * 0.75
          : renderStyle === 'wireframe'
          ? 0.25
          : atom.radius * 0.9 + 0.25;

      const sphereGeo = new THREE.SphereGeometry(radius, 32, 32);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: atom.color,
        roughness: 0.25,
        metalness: 0.1,
      });

      const mesh = new THREE.Mesh(sphereGeo, sphereMat);
      mesh.position.set(...atom.pos);
      mesh.userData = atom;
      group.add(mesh);

      atomMeshesRef.current.push(mesh);
      baseAtomPositions.current.push(new THREE.Vector3(...atom.pos));
    });

    // 2. Create Bonds (Ball-and-stick or wireframe)
    if (renderStyle !== 'space_filling') {
      selectedMolecule.bonds.forEach((bond) => {
        const atomA = selectedMolecule.atoms[bond.from];
        const atomB = selectedMolecule.atoms[bond.to];
        if (!atomA || !atomB) return;

        const posA = new THREE.Vector3(...atomA.pos);
        const posB = new THREE.Vector3(...atomB.pos);

        const distance = posA.distanceTo(posB);
        const midPoint = new THREE.Vector3().addVectors(posA, posB).multiplyScalar(0.5);

        // Cylinder bond
        const bondRadius = renderStyle === 'wireframe' ? 0.05 : 0.1;
        const bondGeo = new THREE.CylinderGeometry(bondRadius, bondRadius, distance, 16);
        const bondMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3 });

        if (bond.order === 1) {
          const cylinder = new THREE.Mesh(bondGeo, bondMat);
          cylinder.position.copy(midPoint);
          cylinder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), posB.clone().sub(posA).normalize());
          group.add(cylinder);
        } else if (bond.order === 2) {
          // Double bond: two parallel cylinders
          const offsetDir = new THREE.Vector3(0, 0, 1);
          [-0.14, 0.14].forEach((offset) => {
            const cylinder = new THREE.Mesh(bondGeo, bondMat);
            const shiftedMid = midPoint.clone().add(offsetDir.clone().multiplyScalar(offset));
            cylinder.position.copy(shiftedMid);
            cylinder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), posB.clone().sub(posA).normalize());
            group.add(cylinder);
          });
        }
      });
    }

    // 3. Dipole Moment Vector Arrow (if polar and enabled)
    if (showDipole && selectedMolecule.isPolar && selectedMolecule.dipoleVector) {
      const dir = new THREE.Vector3(...selectedMolecule.dipoleVector).normalize();
      const origin = new THREE.Vector3(0, -0.5, 0);
      const length = 2.4;
      const arrow = new THREE.ArrowHelper(dir, origin, length, 0x38bdf8, 0.5, 0.3);
      group.add(arrow);

      // Label text aura
      const auraGeo = new THREE.SphereGeometry(0.3, 16, 16);
      const auraMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true });
      const aura = new THREE.Mesh(auraGeo, auraMat);
      aura.position.copy(origin.clone().add(dir.clone().multiplyScalar(length)));
      group.add(aura);
    }

    setInspectedAtom(selectedMolecule.atoms[0]);
  }, [selectedMolecule, renderStyle, showDipole]);

  return (
    <div className="space-y-6">
      {/* Simulation Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="cyan">Physical & Organic Chemistry</Badge>
            <span className="text-xs text-slate-400">Class 9–12 Molecular Orbitals</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" /> 3D Interactive Molecular Geometry & Chemical Bonds
          </h2>
          <p className="text-xs text-slate-400">
            Click & drag to rotate 360°, scroll to zoom, inspect atoms, toggle CPK space-filling models, and adjust thermal kinetic vibrations.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRotate(!autoRotate)}
            className="flex items-center gap-1.5"
          >
            {autoRotate ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
            <span>{autoRotate ? 'Pause Orbit' : 'Auto Rotate'}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (controlsRef.current) controlsRef.current.reset();
              setTemperature(298);
              setAutoRotate(true);
            }}
            className="text-slate-400 hover:text-white"
            title="Reset Camera & Temp"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main 3D Viewport and Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 3D Canvas */}
        <div className="lg:col-span-3 relative h-[520px] rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
          <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Molecule HUD */}
          <div className="absolute top-4 left-4 bg-slate-900/85 backdrop-blur-md border border-slate-800/80 rounded-2xl p-3 text-xs space-y-1 pointer-events-none">
            <div className="flex items-center gap-2 text-white font-bold">
              <span className="px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-400 font-mono text-sm">
                {selectedMolecule.formula}
              </span>
              <span>{selectedMolecule.name}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Geometry: <span className="text-white font-semibold">{selectedMolecule.geometry}</span> • Angle: <span className="text-amber-400 font-mono">{selectedMolecule.bondAngle}</span>
            </div>
          </div>

          {/* 3D Orbit Controls Navigation Tip */}
          <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 px-3 py-1.5 rounded-xl text-[11px] text-slate-400 flex items-center gap-1.5 pointer-events-none">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>Drag mouse to rotate 360° • Scroll to zoom</span>
          </div>

          {/* Style Selector Toolbar (Floating Bottom Left) */}
          <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-800/90 p-1.5 rounded-2xl flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setRenderStyle('ball_and_stick')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                renderStyle === 'ball_and_stick'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ball & Stick
            </button>
            <button
              onClick={() => setRenderStyle('space_filling')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                renderStyle === 'space_filling'
                  ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Space-Filling (CPK)
            </button>
            <button
              onClick={() => setRenderStyle('wireframe')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                renderStyle === 'wireframe'
                  ? 'bg-slate-700 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Bonds Only
            </button>
          </div>

          {/* Thermal Vibration Slider (Floating Bottom Right) */}
          <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur-md border border-slate-800/90 px-4 py-2 rounded-2xl flex items-center gap-3 text-xs text-slate-300">
            <Thermometer className={`w-4 h-4 ${temperature > 350 ? 'text-rose-400' : 'text-cyan-400'}`} />
            <span>Temp (Vibration):</span>
            <input
              type="range"
              min="0"
              max="500"
              value={temperature}
              onChange={(e) => setTemperature(parseInt(e.target.value))}
              className="w-24 accent-cyan-400 cursor-pointer"
            />
            <span className="w-12 text-[11px] font-mono text-cyan-400">{temperature} K</span>
          </div>
        </div>

        {/* Molecule Directory & Atom Inspector Sidebar */}
        <div className="space-y-4">
          <Card className="p-4 bg-slate-900/90 border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Select Compound / Molecule</h3>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
              {MOLECULES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMolecule(m)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all text-left ${
                    selectedMolecule.id === m.id
                      ? 'bg-cyan-500/15 border-cyan-500/50 text-white font-bold shadow-md shadow-cyan-500/10'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <span className="font-semibold block">{m.name}</span>
                    <span className="text-[10px] text-slate-500">{m.geometry}</span>
                  </div>
                  <Badge variant={m.isPolar ? 'purple' : 'outline'} className="text-[10px] font-mono">
                    {m.formula}
                  </Badge>
                </button>
              ))}
            </div>
          </Card>

          {/* Interactive Atom Click Inspector */}
          {inspectedAtom && (
            <Card className="p-4 bg-slate-900/90 border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full border border-white/20 inline-block"
                    style={{ backgroundColor: `#${inspectedAtom.color.toString(16)}` }}
                  />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Element: {inspectedAtom.element} (Click Atom to Inspect)
                  </h3>
                </div>
                <Badge variant="cyan" className="text-[10px]">
                  Electronegativity: {inspectedAtom.electronegativity}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="p-2 bg-slate-950/70 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block">Covalent Radius:</span>
                  <span className="text-white font-mono font-semibold">{inspectedAtom.radius} Å</span>
                </div>
                <div className="p-2 bg-slate-950/70 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block">Van der Waals:</span>
                  <span className="text-white font-mono font-semibold">{inspectedAtom.vanDerWaals} Å</span>
                </div>
              </div>
            </Card>
          )}

          {/* Polarity & Real-World Relevance */}
          <Card className="p-4 bg-slate-900/90 border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Net Dipole Moment:</span>
              <span className="text-xs font-mono text-cyan-400 font-bold">{selectedMolecule.dipoleMoment}</span>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={showDipole}
                onChange={(e) => setShowDipole(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-0"
              />
              <span>Show 3D Dipole Vector Arrow</span>
            </label>

            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              <strong className="text-slate-200 block mb-1">Rural & Practical Context:</strong>
              {selectedMolecule.description}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
