import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Globe, Info, Sparkles } from 'lucide-react';

interface PlanetData {
  name: string;
  size: number;
  distance: number;
  color: number;
  speed: number;
  facts: string;
}

export const SolarSystem: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetData | null>(null);

  const planets: PlanetData[] = [
    { name: 'Mercury', size: 0.5, distance: 4.5, color: 0x94a3b8, speed: 0.04, facts: 'Smallest planet, closest to the Sun. Extreme temperatures from -180°C to 430°C.' },
    { name: 'Venus', size: 0.9, distance: 7.0, color: 0xf59e0b, speed: 0.025, facts: 'Hottest planet in our solar system with a thick toxic atmosphere of carbon dioxide.' },
    { name: 'Earth', size: 1.0, distance: 10.0, color: 0x38bdf8, speed: 0.018, facts: 'Our home world. Only known planet with liquid water, oxygen atmosphere, and life.' },
    { name: 'Mars', size: 0.7, distance: 13.0, color: 0xef4444, speed: 0.014, facts: 'The Red Planet, rich in iron oxide. Home to Olympus Mons, the largest volcano in the solar system.' },
    { name: 'Jupiter', size: 2.2, distance: 18.0, color: 0xd97706, speed: 0.008, facts: 'Massive gas giant with a Great Red Spot storm larger than Earth. 95 known moons.' },
    { name: 'Saturn', size: 1.8, distance: 23.0, color: 0xfde047, speed: 0.006, facts: 'Distinguished by extensive rings made of chunks of ice and rock particles.' },
  ];

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const width = currentMount.clientWidth;
    const height = currentMount.clientHeight || 500;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 25, 35);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    currentMount.appendChild(renderer.domElement);

    // Stars background particles
    const starGeo = new THREE.BufferGeometry();
    const starCount = 1000;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) {
      starPositions[i] = (Math.random() - 0.5) * 200;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // Sun (Glowing Sphere)
    const sunGeo = new THREE.SphereGeometry(2.5, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    scene.add(sun);

    const sunLight = new THREE.PointLight(0xffffff, 2.5, 100);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x334155);
    scene.add(ambientLight);

    // Create Planets and Orbit lines
    const planetMeshes: Array<{ mesh: THREE.Mesh; data: PlanetData; angle: number }> = [];

    planets.forEach((p) => {
      // Orbit Ring
      const orbitGeo = new THREE.RingGeometry(p.distance - 0.05, p.distance + 0.05, 64);
      const orbitMat = new THREE.MeshBasicMaterial({ color: 0x1e293b, side: THREE.DoubleSide });
      const orbitRing = new THREE.Mesh(orbitGeo, orbitMat);
      orbitRing.rotation.x = Math.PI / 2;
      scene.add(orbitRing);

      // Planet Sphere
      const pGeo = new THREE.SphereGeometry(p.size, 24, 24);
      const pMat = new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.6 });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      scene.add(pMesh);

      planetMeshes.push({ mesh: pMesh, data: p, angle: Math.random() * Math.PI * 2 });
    });

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Rotate planets in orbit
      planetMeshes.forEach((item) => {
        item.angle += item.data.speed;
        item.mesh.position.x = Math.cos(item.angle) * item.data.distance;
        item.mesh.position.z = Math.sin(item.angle) * item.data.distance;
        item.mesh.rotation.y += 0.02;
      });

      sun.rotation.y += 0.005;
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
            <h2 className="text-xl font-black text-white">Interactive 3D Solar System</h2>
            <Badge variant="cyan">Astronomy Lab</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Explore planet orbits and physical properties. <span className="text-amber-400 font-semibold">*Distances and scales simplified for educational display.</span>
          </p>
        </div>

        {/* Planet Quick Selector */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {planets.map((p) => (
            <button
              key={p.name}
              onClick={() => setSelectedPlanet(p)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedPlanet?.name === p.name ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 relative h-[500px] w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
          <div ref={mountRef} className="w-full h-full" />
        </div>

        <Card className="lg:col-span-1 p-5 bg-slate-900/90 space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" /> Planet Telemetry
          </h3>

          {selectedPlanet ? (
            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                <div className="text-base font-bold text-white flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `#${selectedPlanet.color.toString(16)}` }} />
                  {selectedPlanet.name}
                </div>
                <div className="text-slate-400 leading-relaxed text-xs">
                  {selectedPlanet.facts}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-slate-950 rounded-lg border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px]">Orbit Radius</span>
                  <span className="font-mono text-cyan-400 font-bold">{selectedPlanet.distance} AU (rel.)</span>
                </div>
                <div className="p-2 bg-slate-950 rounded-lg border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px]">Orbital Speed</span>
                  <span className="font-mono text-purple-400 font-bold">{selectedPlanet.speed * 1000} km/s</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 text-center py-12">
              Select any planet from the top buttons to inspect its gravitational, physical, and atmospheric properties.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
