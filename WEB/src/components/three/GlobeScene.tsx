"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, QuadraticBezierLine } from "@react-three/drei";
import * as THREE from "three";
import type { Package } from "@/data/packages";

const R = 2;
const HOME: [number, number] = [25.2, 55.27]; // Dubai HQ

function toVec(lat: number, lon: number, r = R) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

function Dots({ count = 5000 }) {
  // fibonacci sphere: evenly spaced dots
  const geo = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const rad = Math.sqrt(1 - y * y);
      const t = golden * i;
      pos.set([Math.cos(t) * rad * R, y * R, Math.sin(t) * rad * R], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [count]);
  return (
    <points geometry={geo}>
      <pointsMaterial size={0.02} color="#4d7a9b" transparent opacity={0.7} sizeAttenuation />
    </points>
  );
}

function Arc({ to, i }: { to: THREE.Vector3; i: number }) {
  const ref = useRef<{ material: THREE.LineDashedMaterial & { dashOffset: number } }>(null);
  const from = useMemo(() => toVec(...HOME), []);
  const mid = useMemo(() => {
    const m = from.clone().add(to).multiplyScalar(0.5);
    return m.normalize().multiplyScalar(R + from.distanceTo(to) * 0.45);
  }, [from, to]);
  useFrame((_, dt) => {
    if (ref.current) ref.current.material.dashOffset -= dt * (0.6 + (i % 3) * 0.2);
  });
  return (
    <QuadraticBezierLine
      // @ts-expect-error drei's line ref type is narrower than what it exposes
      ref={ref}
      start={from}
      end={to}
      mid={mid}
      color="#0e8fb3"
      lineWidth={1.4}
      dashed
      dashScale={6}
      dashSize={0.6}
      gapSize={0.4}
      transparent
      opacity={0.8}
    />
  );
}

function Marker({ p, active, onSelect }: { p: Package; active: boolean; onSelect: (slug: string) => void }) {
  const pos = useMemo(() => toVec(...p.coords, R + 0.01), [p.coords]);
  const ring = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    const t = (s.clock.elapsedTime * 0.8 + pos.x) % 1;
    ring.current!.scale.setScalar(1 + t * 2.5);
    (ring.current!.material as THREE.MeshBasicMaterial).opacity = 1 - t;
  });
  return (
    <group position={pos} onUpdate={(g) => g.lookAt(0, 0, 0)}>
      <mesh onClick={() => onSelect(p.slug)} onPointerOver={() => onSelect(p.slug)}>
        <sphereGeometry args={[active ? 0.06 : 0.04, 16, 16]} />
        <meshBasicMaterial color={active ? "#c97a2b" : "#0e8fb3"} toneMapped={false} />
      </mesh>
      <mesh ref={ring}>
        <ringGeometry args={[0.05, 0.06, 32]} />
        <meshBasicMaterial color="#0e8fb3" transparent side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Globe({ items, active, onSelect }: { items: Package[]; active: string; onSelect: (s: string) => void }) {
  const ref = useRef<THREE.Group>(null);
  const targets = useMemo(() => items.map((p) => toVec(...p.coords)), [items]);

  // rotate so the active destination faces the camera
  const target = useMemo(() => {
    const p = items.find((i) => i.slug === active) ?? items[0];
    const [lat, lon] = p.coords;
    return { y: Math.PI / 2 - ((lon + 180) * Math.PI) / 180, x: (lat * Math.PI) / 180 };
  }, [active, items]);

  useFrame(() => {
    const g = ref.current!;
    // shortest path around the y axis
    const dy = Math.atan2(Math.sin(target.y - g.rotation.y), Math.cos(target.y - g.rotation.y));
    g.rotation.y += dy * 0.04;
    g.rotation.x += (target.x * 0.6 - g.rotation.x) * 0.04;
  });

  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[R * 0.985, 64, 64]} />
        <meshBasicMaterial color="#e6eef7" />
      </mesh>
      <mesh scale={1.15}>
        <sphereGeometry args={[R, 64, 64]} />
        <shaderMaterial
          transparent
          side={THREE.BackSide}
          depthWrite={false}
          vertexShader={`varying vec3 vN; void main(){ vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`}
          fragmentShader={`varying vec3 vN; void main(){ float i = pow(0.65 - dot(vN, vec3(0,0,1.)), 3.); gl_FragColor = vec4(0.40,0.72,0.88,1.)*i*0.55; }`}
        />
      </mesh>
      <Dots />
      {targets.map((t, i) => (
        <Arc key={items[i].slug} to={t} i={i} />
      ))}
      {items.map((p) => (
        <Marker key={p.slug} p={p} active={p.slug === active} onSelect={onSelect} />
      ))}
    </group>
  );
}

export default function GlobeScene(props: { items: Package[]; active: string; onSelect: (s: string) => void; live: boolean }) {
  return (
    <Canvas resize={{ offsetSize: true }} frameloop={props.live ? "always" : "never"} dpr={[1, 1.75]} camera={{ position: [0, 0, 7.4], fov: 40 }}>
      <Globe {...props} />
      <OrbitControls enableZoom={false} enablePan={false} rotateSpeed={0.5} />
    </Canvas>
  );
}
