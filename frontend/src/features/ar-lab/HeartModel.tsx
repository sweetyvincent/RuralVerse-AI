import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Heart, Activity, CheckCircle2 } from 'lucide-react';

export const HeartModel: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeChamber, setActiveChamber] = useState<string>('Left Ventricle');

  const chambers: Record<string, string> = {
    'Left Ventricle': 'Pumps oxygen-rich blood into the aorta to circulate throughout the entire body. Features the thickest muscular wall.',
    'Right Ventricle': 'Pumps oxygen-depleted blood through the pulmonary valve into the lungs for re-oxygenation.',
    'Left Atrium': 'Receives oxygenated blood returning from the lungs via the pulmonary veins.',
    'Right Atrium': 'Receives deoxygenated blood returning from bodily tissues via the superior and inferior vena cava.',
  };

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const width = currentMount.clientWidth;
    const height = currentMount.clientHeight || 500;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    currentMount.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // Anatomical Heart Shape using composite meshes
    const heartGroup = new THREE.Group();

    // Muscle body (Cardiomyocyte Mass)
    const bodyGeo = new THREE.SphereGeometry(3, 32, 32);
    bodyGeo.scale(1, 1.3, 0.9);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      roughness: 0.4,
      metalness: 0.1,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    heartGroup.add(body);

    // Aorta Arch (Oxygenated - Red Tube)
    const aortaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 2.5, 0),
      new THREE.Vector3(0.5, 4.5, -0.2),
      new THREE.Vector3(2.5, 4.2, -0.5),
      new THREE.Vector3(3.2, 2.5, -1),
    ]);
    const aortaGeo = new THREE.TubeGeometry(aortaCurve, 32, 0.6, 16, false);
    const aortaMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
    const aorta = new THREE.Mesh(aortaGeo, aortaMat);
    heartGroup.add(aorta);

    // Vena Cava (Deoxygenated - Blue Tube)
    const venaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.8, 3.8, 0.5),
      new THREE.Vector3(-1.8, 1.5, 0.2),
      new THREE.Vector3(-1.8, -2.5, 0.2),
    ]);
    const venaGeo = new THREE.TubeGeometry(venaCurve, 32, 0.5, 16, false);
    const venaMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3 });
    const vena = new THREE.Mesh(venaGeo, venaMat);
    heartGroup.add(vena);

    scene.add(heartGroup);

    let animationId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Realistic cardiac systole & diastole contraction pulse (72 BPM)
      const beat = Math.sin(elapsedTime * 6) * 0.05 + 1;
      heartGroup.scale.set(beat, beat, beat);
      heartGroup.rotation.y = Math.sin(elapsedTime * 0.5) * 0.3;

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white">Interactive 3D Human Heart</h2>
            <Badge variant="rose">Biology & Anatomy</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visualizing cardiac pulsation, blood flow chambers, and vascular pressure dynamics.
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {Object.keys(chambers).map((ch) => (
            <button
              key={ch}
              onClick={() => setActiveChamber(ch)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeChamber === ch ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 relative h-[500px] w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
          <div ref={mountRef} className="w-full h-full" />
          <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3 py-2 rounded-xl text-xs text-slate-300 flex items-center gap-2">
            <Activity className="w-4 h-4 text-rose-400 animate-pulse" />
            <span>Simulated Pulse: <strong>72 BPM (Resting Rhythm)</strong></span>
          </div>
        </div>

        <Card className="lg:col-span-1 p-5 bg-slate-900/90 space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-400" /> Chamber Details
          </h3>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <h4 className="text-sm font-bold text-white">{activeChamber}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {chambers[activeChamber]}
            </p>
          </div>
          <div className="text-[11px] text-slate-500 space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>Aorta & Systemic Circulation (Oxygenated)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>Vena Cava & Pulmonary Artery (Deoxygenated)</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
