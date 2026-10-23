import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Heart,
  Activity,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Eye,
  Layers,
  Compass,
  Sparkles,
  Info,
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

interface AnatomyPart {
  id: string;
  name: string;
  type: 'Chamber' | 'Vessel' | 'Valve' | 'Muscle';
  bloodType: 'Oxygenated (O₂ Rich)' | 'Deoxygenated (CO₂ Rich)' | 'Structural';
  pressure: string;
  saturation: string;
  color: string;
  description: string;
}

const ANATOMY_PARTS: AnatomyPart[] = [
  {
    id: 'lv',
    name: 'Left Ventricle',
    type: 'Chamber',
    bloodType: 'Oxygenated (O₂ Rich)',
    pressure: '120 / 80 mmHg',
    saturation: '98–100% O₂',
    color: '#ef4444',
    description:
      'The most muscular chamber of the heart. Generating high systolic pressure, it contracts forcefully to propel oxygenated blood through the aortic valve into the systemic circulation.',
  },
  {
    id: 'aorta',
    name: 'Aortic Arch & Brachiocephalic Branches',
    type: 'Vessel',
    bloodType: 'Oxygenated (O₂ Rich)',
    pressure: '120 / 80 mmHg',
    saturation: '98% O₂',
    color: '#dc2626',
    description:
      'The primary elastic arterial conduit of the human body. Features 3 major cranial branches: the Brachiocephalic trunk, Left Common Carotid artery, and Left Subclavian artery supplying the brain and upper limbs.',
  },
  {
    id: 'rv',
    name: 'Right Ventricle',
    type: 'Chamber',
    bloodType: 'Deoxygenated (CO₂ Rich)',
    pressure: '25 / 10 mmHg',
    saturation: '75% O₂',
    color: '#3b82f6',
    description:
      'Crescent-shaped anterior chamber that pumps venous blood under low pressure across the pulmonary valve into the pulmonary trunk for alveolar oxygenation in the lungs.',
  },
  {
    id: 'pulmonary_trunk',
    name: 'Pulmonary Trunk & Arteries',
    type: 'Vessel',
    bloodType: 'Deoxygenated (CO₂ Rich)',
    pressure: '25 / 15 mmHg',
    saturation: '75% O₂',
    color: '#2563eb',
    description:
      'The only arteries in the postnatal human body that carry deoxygenated blood. Crosses anterior to the ascending aorta before bifurcating into left and right pulmonary arteries.',
  },
  {
    id: 'la',
    name: 'Left Atrium & Auricle',
    type: 'Chamber',
    bloodType: 'Oxygenated (O₂ Rich)',
    pressure: '8–10 mmHg',
    saturation: '98% O₂',
    color: '#f87171',
    description:
      'Smooth-walled posterior chamber receiving freshly oxygenated blood from the four pulmonary veins. Its muscular auricle assists during atrial systole.',
  },
  {
    id: 'ra',
    name: 'Right Atrium & Vena Cava',
    type: 'Chamber',
    bloodType: 'Deoxygenated (CO₂ Rich)',
    pressure: '2–6 mmHg (CVP)',
    saturation: '75% O₂',
    color: '#60a5fa',
    description:
      'Receives systemic venous return from the Superior Vena Cava (head, arms) and Inferior Vena Cava (abdomen, legs). Houses the primary Sinoatrial (SA) node cardiac pacemaker.',
  },
  {
    id: 'coronary',
    name: 'Coronary Arteries & Veins',
    type: 'Vessel',
    bloodType: 'Oxygenated (O₂ Rich)',
    pressure: '120 / 80 mmHg (Diastolic perfusion)',
    saturation: '98% O₂',
    color: '#f43f5e',
    description:
      'The specialized vascular network supplying oxygen and nutrients directly to the contracting myocardium. The Left Anterior Descending (LAD) and Right Coronary Artery run along the interventricular sulci.',
  },
  {
    id: 'valves',
    name: 'Atrioventricular & Semilunar Valves',
    type: 'Valve',
    bloodType: 'Structural',
    pressure: 'Unidirectional',
    saturation: 'Flow Control',
    color: '#e2e8f0',
    description:
      'Four fibrous heart valves (Mitral, Tricuspid, Aortic, Pulmonary) anchored by chordae tendineae and papillary muscles to enforce strict unidirectional laminar blood flow without regurgitation.',
  },
];

export const HeartModel: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedPart, setSelectedPart] = useState<AnatomyPart>(ANATOMY_PARTS[0]);
  const [bpm, setBpm] = useState<number>(72); // Normal resting heart rate
  const [viewMode, setViewMode] = useState<'external' | 'cutaway' | 'blood_flow'>('external');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);

  // References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const heartAssemblyRef = useRef<THREE.Group | null>(null);
  const bloodParticlesRef = useRef<THREE.Points | null>(null);
  const cutawayGroupRef = useRef<THREE.Group | null>(null);
  const externalGroupRef = useRef<THREE.Group | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Web Audio Synthesizer for Heart Sounds (Lub-Dub)
  const playHeartBeatSound = () => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // "LUB" sound (S1 - Closure of Mitral/Tricuspid valves, lower pitch, slightly longer)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(65, now);
      osc1.frequency.exponentialRampToValueAtTime(35, now + 0.12);

      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      // "DUB" sound (S2 - Closure of Aortic/Pulmonary valves, slightly higher pitch, shorter)
      const dubTime = now + 0.22;
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(90, dubTime);
      osc2.frequency.exponentialRampToValueAtTime(45, dubTime + 0.1);

      gain2.gain.setValueAtTime(0.25, dubTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, dubTime + 0.12);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(dubTime);
      osc2.stop(dubTime + 0.14);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  };

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const width = currentMount.clientWidth;
    const height = currentMount.clientHeight || 520;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.5, 14);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    currentMount.appendChild(renderer.domElement);

    // OrbitControls: 360 degree rotation and zoom
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 6;
    controls.maxDistance = 28;
    controlsRef.current = controls;

    // Advanced Studio Lighting for Photorealistic Organ Flesh
    const ambientLight = new THREE.AmbientLight(0xfff1f2, 0.7);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(8, 14, 12);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    rimLight.position.set(-10, -5, -8);
    scene.add(rimLight);

    const fillLight = new THREE.PointLight(0xf43f5e, 1.2, 20);
    fillLight.position.set(0, -6, 6);
    scene.add(fillLight);

    // Master Heart Assembly
    const heartAssembly = new THREE.Group();
    // Anatomical orientation: apex points down, anteriorly, and tilted ~30° to the left
    heartAssembly.rotation.z = -0.15;
    heartAssembly.rotation.y = 0.2;
    scene.add(heartAssembly);
    heartAssemblyRef.current = heartAssembly;

    // Groups for external and cutaway modes
    const externalGroup = new THREE.Group();
    const cutawayGroup = new THREE.Group();
    heartAssembly.add(externalGroup);
    heartAssembly.add(cutawayGroup);
    externalGroupRef.current = externalGroup;
    cutawayGroupRef.current = cutawayGroup;

    // ==========================================
    // 1. REALISTIC MYOCARDIUM BODY & CHAMBERS
    // ==========================================
    // Flesh Shader Material with muscular gloss and subsurface scatter simulation
    const myocardiumMat = new THREE.MeshPhysicalMaterial({
      color: 0x881337, // Deep anatomical muscle red
      emissive: 0x4c0519,
      emissiveIntensity: 0.15,
      roughness: 0.28,
      metalness: 0.08,
      clearcoat: 0.65,
      clearcoatRoughness: 0.18,
      reflectivity: 0.5,
    });

    const fattyTissueMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a, // Epicardial adipose fat tissue along sulci
      roughness: 0.6,
      metalness: 0.05,
    });

    // Ventricular Base & Apex (Bulbous muscular conical form)
    // Left Ventricle (apex forming dominant body)
    const lvGeo = new THREE.SphereGeometry(2.3, 48, 48);
    // Deform into heart shape: conical apex tapering at bottom
    const lvPos = lvGeo.attributes.position;
    for (let i = 0; i < lvPos.count; i++) {
      const y = lvPos.getY(i);
      const x = lvPos.getX(i);
      const z = lvPos.getZ(i);

      if (y < 0) {
        // Taper towards apex
        const factor = 1 + y * 0.22;
        lvPos.setX(i, x * Math.max(factor, 0.25));
        lvPos.setZ(i, z * Math.max(factor, 0.25));
      } else {
        // Widen ventricular base
        lvPos.setX(i, x * 1.05);
      }
    }
    lvGeo.computeVertexNormals();

    const lvMesh = new THREE.Mesh(lvGeo, myocardiumMat);
    lvMesh.scale.set(1.15, 1.45, 1.05);
    lvMesh.position.set(0.3, -0.4, 0);
    externalGroup.add(lvMesh);

    // Right Ventricle (Anterior crescent wrapping along lateral border)
    const rvGeo = new THREE.SphereGeometry(1.9, 32, 32);
    const rvMesh = new THREE.Mesh(rvGeo, myocardiumMat);
    rvMesh.scale.set(0.9, 1.25, 0.85);
    rvMesh.position.set(-1.3, -0.2, 0.4);
    externalGroup.add(rvMesh);

    // Left Atrium (Posterior-superior)
    const laGeo = new THREE.SphereGeometry(1.3, 32, 32);
    const laMesh = new THREE.Mesh(laGeo, myocardiumMat);
    laMesh.position.set(0.9, 1.8, -0.6);
    externalGroup.add(laMesh);

    // Left Auricle (Dog-ear appendage)
    const laAuricleGeo = new THREE.ConeGeometry(0.6, 1.1, 16);
    const laAuricle = new THREE.Mesh(laAuricleGeo, myocardiumMat);
    laAuricle.rotation.z = Math.PI / 4;
    laAuricle.position.set(1.5, 1.4, 0.5);
    externalGroup.add(laAuricle);

    // Right Atrium (Lateral-superior receiving Vena Cava)
    const raGeo = new THREE.SphereGeometry(1.4, 32, 32);
    const raMesh = new THREE.Mesh(raGeo, myocardiumMat);
    raMesh.position.set(-1.6, 1.6, 0.1);
    externalGroup.add(raMesh);

    // Anterior Interventricular Sulcus Adipose Fat Pad
    const fatPadCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.4, 1.2, 1.3),
      new THREE.Vector3(-0.3, 0.0, 1.4),
      new THREE.Vector3(0.0, -1.2, 1.1),
      new THREE.Vector3(0.2, -2.4, 0.5),
    ]);
    const fatPadGeo = new THREE.TubeGeometry(fatPadCurve, 32, 0.35, 12, false);
    const fatPadMesh = new THREE.Mesh(fatPadGeo, fattyTissueMat);
    externalGroup.add(fatPadMesh);

    // ==========================================
    // 2. GREAT VESSELS & CORONARY NETWORK
    // ==========================================
    // Aorta Material (Vibrant red elastic artery)
    const aortaMat = new THREE.MeshPhysicalMaterial({
      color: 0xef4444,
      emissive: 0x991b1b,
      emissiveIntensity: 0.1,
      roughness: 0.25,
      metalness: 0.1,
      clearcoat: 0.5,
    });

    // Vena Cava & Pulmonary Trunk Material (Deoxygenated Royal Blue)
    const venousMat = new THREE.MeshPhysicalMaterial({
      color: 0x2563eb,
      emissive: 0x1e3a8a,
      emissiveIntensity: 0.1,
      roughness: 0.25,
      metalness: 0.1,
      clearcoat: 0.5,
    });

    // 1. AORTIC ARCH (Ascending Aorta -> Arch -> Descending Aorta)
    const aortaArchCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.1, 1.6, 0.2), // Root from LV
      new THREE.Vector3(0.3, 3.2, 0.1), // Ascending
      new THREE.Vector3(-0.4, 4.3, -0.3), // Arch Peak
      new THREE.Vector3(-1.4, 3.8, -1.0), // Turning left & back
      new THREE.Vector3(-1.6, 1.2, -1.4), // Descending thoracic aorta
      new THREE.Vector3(-1.6, -2.0, -1.5),
    ]);
    const aortaGeo = new THREE.TubeGeometry(aortaArchCurve, 48, 0.65, 20, false);
    const aortaMesh = new THREE.Mesh(aortaGeo, aortaMat);
    heartAssembly.add(aortaMesh);

    // 3 Major Brachiocephalic Cranial Branches off the Aortic Arch:
    // a) Brachiocephalic artery
    const b1Curve = new THREE.LineCurve3(new THREE.Vector3(0.1, 4.0, -0.1), new THREE.Vector3(0.5, 5.2, 0.0));
    heartAssembly.add(new THREE.Mesh(new THREE.TubeGeometry(b1Curve, 8, 0.22, 12, false), aortaMat));

    // b) Left Common Carotid artery
    const b2Curve = new THREE.LineCurve3(new THREE.Vector3(-0.4, 4.25, -0.3), new THREE.Vector3(-0.3, 5.4, -0.2));
    heartAssembly.add(new THREE.Mesh(new THREE.TubeGeometry(b2Curve, 8, 0.18, 12, false), aortaMat));

    // c) Left Subclavian artery
    const b3Curve = new THREE.LineCurve3(new THREE.Vector3(-0.9, 4.15, -0.6), new THREE.Vector3(-1.1, 5.3, -0.6));
    heartAssembly.add(new THREE.Mesh(new THREE.TubeGeometry(b3Curve, 8, 0.18, 12, false), aortaMat));

    // 2. PULMONARY TRUNK & BIFURCATION (Exits RV, crosses anterior to ascending aorta)
    const pulmonaryCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.8, 1.5, 0.7), // Origin from RV infundibulum
      new THREE.Vector3(-0.3, 2.6, 0.6), // Crossing in front of aorta
      new THREE.Vector3(0.0, 3.1, -0.2), // Bifurcation point under arch
    ]);
    const pulmonaryGeo = new THREE.TubeGeometry(pulmonaryCurve, 32, 0.6, 20, false);
    const pulmonaryMesh = new THREE.Mesh(pulmonaryGeo, venousMat);
    heartAssembly.add(pulmonaryMesh);

    // Left & Right Pulmonary Arteries (bifurcation branches)
    const leftPA = new THREE.LineCurve3(new THREE.Vector3(0.0, 3.1, -0.2), new THREE.Vector3(2.2, 2.8, -0.8));
    const rightPA = new THREE.LineCurve3(new THREE.Vector3(0.0, 3.1, -0.2), new THREE.Vector3(-2.4, 2.7, -0.8));
    heartAssembly.add(new THREE.Mesh(new THREE.TubeGeometry(leftPA, 12, 0.35, 12, false), venousMat));
    heartAssembly.add(new THREE.Mesh(new THREE.TubeGeometry(rightPA, 12, 0.35, 12, false), venousMat));

    // 3. SUPERIOR & INFERIOR VENA CAVA (SVC & IVC entering RA)
    const svcCurve = new THREE.LineCurve3(new THREE.Vector3(-2.0, 1.8, -0.2), new THREE.Vector3(-2.0, 4.2, -0.2));
    const ivcCurve = new THREE.LineCurve3(new THREE.Vector3(-2.0, 0.4, -0.4), new THREE.Vector3(-2.0, -2.4, -0.4));
    heartAssembly.add(new THREE.Mesh(new THREE.TubeGeometry(svcCurve, 12, 0.5, 16, false), venousMat));
    heartAssembly.add(new THREE.Mesh(new THREE.TubeGeometry(ivcCurve, 12, 0.5, 16, false), venousMat));

    // 4. FOUR PULMONARY VEINS (Entering posterior Left Atrium)
    const pvMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
    const pvOffsets = [
      [1.8, 2.2, -1.2],
      [1.8, 1.4, -1.2],
      [-0.4, 2.4, -1.4],
      [-0.4, 1.6, -1.4],
    ];
    pvOffsets.forEach((pos) => {
      const pvGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.9, 12);
      const pvMesh = new THREE.Mesh(pvGeo, pvMat);
      pvMesh.rotation.z = Math.PI / 2;
      pvMesh.position.set(pos[0], pos[1], pos[2]);
      heartAssembly.add(pvMesh);
    });

    // 5. CORONARY VASCULAR ARTERIES & VEINS (Branching on surface)
    const coronaryRedMat = new THREE.MeshStandardMaterial({ color: 0xff0033, roughness: 0.2 });
    const coronaryBlueMat = new THREE.MeshStandardMaterial({ color: 0x0066ff, roughness: 0.2 });

    // Left Anterior Descending (LAD) Artery (the "widow-maker" running down anterior sulcus)
    const ladCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.2, 1.2, 1.35),
      new THREE.Vector3(-0.2, 0.4, 1.45),
      new THREE.Vector3(-0.1, -0.4, 1.35),
      new THREE.Vector3(0.1, -1.2, 1.15),
      new THREE.Vector3(0.2, -2.2, 0.55),
    ]);
    const ladMesh = new THREE.Mesh(new THREE.TubeGeometry(ladCurve, 32, 0.09, 8, false), coronaryRedMat);
    externalGroup.add(ladMesh);

    // Diagonal arterial branches
    const diag1 = new THREE.LineCurve3(new THREE.Vector3(-0.2, 0.4, 1.45), new THREE.Vector3(0.8, 0.2, 1.25));
    const diag2 = new THREE.LineCurve3(new THREE.Vector3(-0.1, -0.4, 1.35), new THREE.Vector3(0.7, -0.6, 1.1));
    externalGroup.add(new THREE.Mesh(new THREE.TubeGeometry(diag1, 8, 0.06, 6, false), coronaryRedMat));
    externalGroup.add(new THREE.Mesh(new THREE.TubeGeometry(diag2, 8, 0.05, 6, false), coronaryRedMat));

    // Great Cardiac Vein (Blue companion vein)
    const gcvCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.35, 1.1, 1.35),
      new THREE.Vector3(-0.35, 0.3, 1.45),
      new THREE.Vector3(-0.25, -0.5, 1.35),
      new THREE.Vector3(-0.05, -1.3, 1.1),
    ]);
    const gcvMesh = new THREE.Mesh(new THREE.TubeGeometry(gcvCurve, 24, 0.08, 8, false), coronaryBlueMat);
    externalGroup.add(gcvMesh);

    // ==========================================
    // 3. INTERNAL CORONAL CUTAWAY ANATOMY
    // ==========================================
    // Cutaway Myocardium Cross-Section
    const cutawayMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      roughness: 0.5,
      side: THREE.DoubleSide,
    });
    const chamberCavityMat = new THREE.MeshStandardMaterial({
      color: 0x450a0a,
      roughness: 0.7,
      side: THREE.BackSide,
    });

    // Cut half hemisphere for Left Ventricle with thick muscular septum
    const cutLvGeo = new THREE.SphereGeometry(2.3, 32, 16, 0, Math.PI);
    const cutLv = new THREE.Mesh(cutLvGeo, chamberCavityMat);
    cutLv.scale.set(1.15, 1.45, 1.05);
    cutLv.position.set(0.3, -0.4, 0);
    cutawayGroup.add(cutLv);

    // Cut half for Right Ventricle
    const cutRvGeo = new THREE.SphereGeometry(1.9, 32, 16, 0, Math.PI);
    const cutRv = new THREE.Mesh(cutRvGeo, chamberCavityMat);
    cutRv.scale.set(0.9, 1.25, 0.85);
    cutRv.position.set(-1.3, -0.2, 0.4);
    cutawayGroup.add(cutRv);

    // Interventricular Muscular Septum
    const septumGeo = new THREE.BoxGeometry(0.55, 3.4, 2.2);
    const septum = new THREE.Mesh(septumGeo, cutawayMat);
    septum.position.set(-0.25, -0.4, 0);
    cutawayGroup.add(septum);

    // Papillary Muscles & Chordae Tendineae
    const papillaryGeo = new THREE.ConeGeometry(0.35, 1.2, 12);
    const pap1 = new THREE.Mesh(papillaryGeo, cutawayMat);
    pap1.position.set(1.0, -1.2, -0.4);
    cutawayGroup.add(pap1);

    const pap2 = new THREE.Mesh(papillaryGeo, cutawayMat);
    pap2.position.set(-1.0, -1.0, -0.2);
    cutawayGroup.add(pap2);

    // Valve Leaflets (Mitral & Tricuspid)
    const valveMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
    const valveGeo = new THREE.RingGeometry(0.2, 0.8, 16);

    const mitralValve = new THREE.Mesh(valveGeo, valveMat);
    mitralValve.rotation.x = Math.PI / 2;
    mitralValve.position.set(0.9, 0.8, -0.3);
    cutawayGroup.add(mitralValve);

    const tricuspidValve = new THREE.Mesh(valveGeo, valveMat);
    tricuspidValve.rotation.x = Math.PI / 2;
    tricuspidValve.position.set(-1.3, 0.7, 0.1);
    cutawayGroup.add(tricuspidValve);

    // ==========================================
    // 4. HEMODYNAMIC BLOOD FLOW PARTICLES
    // ==========================================
    const totalParticles = 120;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(totalParticles * 3);
    const particleColors = new Float32Array(totalParticles * 3);

    for (let i = 0; i < totalParticles; i++) {
      const isOxygenated = i < totalParticles / 2;
      // Start randomly inside chambers or vessels
      particlePositions[i * 3] = (Math.random() - 0.5) * 3;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 4;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 2;

      // Red for oxygenated, Cyan/Blue for deoxygenated
      if (isOxygenated) {
        particleColors[i * 3] = 0.95;
        particleColors[i * 3 + 1] = 0.1;
        particleColors[i * 3 + 2] = 0.1;
      } else {
        particleColors[i * 3] = 0.15;
        particleColors[i * 3 + 1] = 0.45;
        particleColors[i * 3 + 2] = 0.95;
      }
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.16,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    const bloodParticles = new THREE.Points(particleGeo, particleMat);
    bloodParticles.visible = false;
    heartAssembly.add(bloodParticles);
    bloodParticlesRef.current = bloodParticles;

    // Set initial view visibility
    externalGroup.visible = true;
    cutawayGroup.visible = false;

    // ==========================================
    // 5. ANIMATION LOOP: BIPHASIC CARDIAC CYCLE
    // ==========================================
    let clock = new THREE.Clock();
    let lastSoundTime = 0;

    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      controls.update();

      if (isPlaying) {
        // Frequency in Radians: (BPM / 60) * 2 * PI
        const heartRateFreq = (bpm / 60) * Math.PI * 2;
        const cycleProgress = (elapsedTime * (bpm / 60)) % 1.0;

        // Biphasic contraction formula (Atrial kick followed by vigorous ventricular twist)
        // 0.0 - 0.2: Atrial systole
        // 0.2 - 0.45: Ventricular systole (rapid contraction + twisting torsion)
        // 0.45 - 1.0: Diastolic relaxation & passive filling
        let scaleX = 1.0;
        let scaleY = 1.0;
        let scaleZ = 1.0;
        let torsionZ = 0;

        if (cycleProgress < 0.2) {
          // Atrial systole: slight pulse in atria
          const p = Math.sin((cycleProgress / 0.2) * Math.PI);
          scaleY = 1.0 - p * 0.03;
        } else if (cycleProgress >= 0.2 && cycleProgress < 0.45) {
          // Ventricular systole: rapid contraction + inward twist
          const p = Math.sin(((cycleProgress - 0.2) / 0.25) * Math.PI);
          scaleX = 1.0 - p * 0.08;
          scaleY = 1.0 - p * 0.07;
          scaleZ = 1.0 - p * 0.09;
          torsionZ = -p * 0.04; // Torsion twist of the apex

          // Sound trigger on peak contraction
          if (elapsedTime - lastSoundTime > 60 / bpm) {
            playHeartBeatSound();
            lastSoundTime = elapsedTime;
          }
        } else {
          // Diastolic elastic recoil bounce
          const p = Math.sin(((cycleProgress - 0.45) / 0.55) * Math.PI);
          scaleX = 1.0 + p * 0.02;
          scaleZ = 1.0 + p * 0.02;
        }

        if (heartAssemblyRef.current) {
          heartAssemblyRef.current.scale.set(scaleX, scaleY, scaleZ);
          heartAssemblyRef.current.rotation.z = -0.15 + torsionZ;
        }

        // Animate Blood Flow Particles
        if (bloodParticlesRef.current && bloodParticlesRef.current.visible) {
          const positions = bloodParticlesRef.current.geometry.attributes.position.array as Float32Array;
          for (let i = 0; i < totalParticles; i++) {
            positions[i * 3 + 1] += (bpm / 60) * 0.06;
            if (positions[i * 3 + 1] > 4.5) {
              positions[i * 3 + 1] = -2.5;
            }
          }
          bloodParticlesRef.current.geometry.attributes.position.needsUpdate = true;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!currentMount) return;
      const newWidth = currentMount.clientWidth;
      const newHeight = currentMount.clientHeight || 520;
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
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [bpm, isPlaying, soundEnabled]);

  // Update View Mode (External vs Cutaway vs Blood Flow)
  useEffect(() => {
    if (!externalGroupRef.current || !cutawayGroupRef.current || !bloodParticlesRef.current) return;

    if (viewMode === 'external') {
      externalGroupRef.current.visible = true;
      cutawayGroupRef.current.visible = false;
      bloodParticlesRef.current.visible = false;
    } else if (viewMode === 'cutaway') {
      externalGroupRef.current.visible = false;
      cutawayGroupRef.current.visible = true;
      bloodParticlesRef.current.visible = false;
    } else if (viewMode === 'blood_flow') {
      externalGroupRef.current.visible = true;
      cutawayGroupRef.current.visible = false;
      bloodParticlesRef.current.visible = true;
    }
  }, [viewMode]);

  return (
    <div className="space-y-6">
      {/* Simulation Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="rose">Cardiovascular Anatomy & Physiology</Badge>
            <span className="text-xs text-slate-400">Class 10–12 NCERT Biology</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500 animate-pulse" /> Photorealistic 3D Human Heart &
            Cardiac Cycle
          </h2>
          <p className="text-xs text-slate-400">
            Anatomically precise 4-chamber morphology, coronary artery network, aortic arch branches, and biphasic
            systole/diastole.
          </p>
        </div>

        {/* Playback & Sound Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-1.5"
            title="Heartbeat Acoustic Sound"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Audio On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-slate-500" />
                <span>Audio Muted</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5"
          >
            {isPlaying ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
            <span>{isPlaying ? 'Pause' : 'Beat'}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (controlsRef.current) controlsRef.current.reset();
              setBpm(72);
              setViewMode('external');
              setIsPlaying(true);
            }}
            className="text-slate-400 hover:text-white"
            title="Reset Simulation View"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main 3D Viewport and Interactive Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 3D Canvas */}
        <div className="lg:col-span-3 relative h-[530px] rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
          <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Cardiac Telemetry HUD Overlay (Top Left) */}
          <div className="absolute top-4 left-4 bg-slate-900/85 backdrop-blur-md border border-slate-800/80 rounded-2xl p-3.5 text-xs space-y-1.5 pointer-events-none">
            <div className="flex items-center gap-2 text-white font-bold">
              <Activity className="w-4 h-4 text-rose-500 animate-pulse" />
              <span>Cardiac Telemetry:</span>
              <span className="text-rose-400 font-mono font-black text-sm">{bpm} BPM</span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>Rhythm:</span>
              <span className="text-emerald-400 font-bold font-mono">
                {bpm < 60 ? 'Sinus Bradycardia' : bpm > 100 ? 'Sinus Tachycardia' : 'Normal Sinus Rhythm'}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Cycle: {((60 / bpm) * 1000).toFixed(0)} ms / beat • S1 (Lub) / S2 (Dub)
            </div>
          </div>

          {/* 360 Orbit Navigation Tip (Top Right) */}
          <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 px-3 py-1.5 rounded-xl text-[11px] text-slate-400 flex items-center gap-1.5 pointer-events-none">
            <Compass className="w-3.5 h-3.5 text-rose-400" />
            <span>Drag to rotate 360° • Scroll to zoom</span>
          </div>

          {/* View Mode Selector Toolbar (Floating Bottom Left) */}
          <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-800/90 p-1.5 rounded-2xl flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setViewMode('external')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                viewMode === 'external'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              External Morphology
            </button>
            <button
              onClick={() => setViewMode('cutaway')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                viewMode === 'cutaway'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Chamber Cross-Section
            </button>
            <button
              onClick={() => setViewMode('blood_flow')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                viewMode === 'blood_flow'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Hemodynamic Flow
            </button>
          </div>

          {/* Heart Rate BPM Slider (Floating Bottom Right) */}
          <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur-md border border-slate-800/90 px-4 py-2 rounded-2xl flex items-center gap-3 text-xs text-slate-300">
            <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
            <span>Heart Rate:</span>
            <input
              type="range"
              min="40"
              max="160"
              step="2"
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value))}
              className="w-24 accent-rose-500 cursor-pointer"
            />
            <span className="w-12 text-[11px] font-mono text-rose-400 font-bold">{bpm} BPM</span>
          </div>
        </div>

        {/* Anatomical Directory & Clinical Telemetry Sidebar */}
        <div className="space-y-4">
          <Card className="p-4 bg-slate-900/90 border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Anatomical Structures</h3>
            <div className="grid grid-cols-1 gap-1.5 max-h-56 overflow-y-auto pr-1">
              {ANATOMY_PARTS.map((part) => (
                <button
                  key={part.id}
                  onClick={() => setSelectedPart(part)}
                  className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-all text-left ${
                    selectedPart.id === part.id
                      ? 'bg-rose-500/15 border-rose-500/50 text-white font-bold shadow-md shadow-rose-500/10'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: part.color }} />
                    <span className="truncate">{part.name}</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] font-mono shrink-0">
                    {part.type}
                  </Badge>
                </button>
              ))}
            </div>
          </Card>

          {/* Selected Part Clinical Card */}
          <Card className="p-4 bg-slate-900/90 border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: selectedPart.color }} />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">{selectedPart.name}</h3>
              </div>
              <Badge variant={selectedPart.bloodType.includes('Oxygenated') ? 'rose' : 'outline'} className="text-[9px]">
                {selectedPart.type}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div className="p-2 bg-slate-950/70 rounded-lg border border-slate-800">
                <span className="text-slate-500 block">Hemodynamic Pressure:</span>
                <span className="text-white font-mono font-semibold">{selectedPart.pressure}</span>
              </div>
              <div className="p-2 bg-slate-950/70 rounded-lg border border-slate-800">
                <span className="text-slate-500 block">Oxygen Saturation:</span>
                <span className="text-cyan-400 font-mono font-semibold">{selectedPart.saturation}</span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              <strong className="text-slate-200 block mb-1">Physiological Function:</strong>
              {selectedPart.description}
            </div>
          </Card>

          {/* Quick Educational Fact */}
          <Card className="p-3.5 bg-rose-950/20 border border-rose-900/40 rounded-2xl text-[11px] text-rose-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-rose-200">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>Did You Know?</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[10px]">
              The human heart beats approximately 100,000 times per day, pumping over 7,500 liters (2,000 gallons) of
              blood through 60,000 miles of blood vessels!
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
