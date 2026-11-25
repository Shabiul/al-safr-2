"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, QuadraticBezierLine } from "@react-three/drei";
import * as THREE from "three";
import type { Package } from "@/data/packages";
import { useTheme } from "@/lib/theme";
import Monument from "./Monuments";

// globe palette per site theme
const PALETTE = {
  light: { sphere: "#e6eef7", dots: "#4d7a9b", line: "#0e8fb3", active: "#c97a2b", monument: "#2f6f93" },
  dark: { sphere: "#081221", dots: "#7fa6c8", line: "#5fd4f5", active: "#f2b66d", monument: "#cfe6f5" },
};
const usePalette = () => PALETTE[useTheme()];

const R = 2;
const HOME: [number, number] = [12.97, 77.59]; // Bangalore HQ

function toVec(lat: number, lon: number, r = R) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

function Dots({ count = 5000 }) {
  const pal = usePalette();
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
      <pointsMaterial size={0.02} color={pal.dots} transparent opacity={0.7} sizeAttenuation />
    </points>
  );
}

function Arc({ to, i }: { to: THREE.Vector3; i: number }) {
  const pal = usePalette();
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
      color={pal.line}
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

/** shared materials: the selected landmark glows in the accent colour, the rest step back */
function useMonumentMaterials() {
  const pal = usePalette();
  return useMemo(
    () => ({
      rest: new THREE.MeshStandardMaterial({ color: pal.monument, roughness: 0.6, metalness: 0.1, emissive: pal.monument, emissiveIntensity: 0.08, transparent: true, opacity: 0.55 }),
      active: new THREE.MeshStandardMaterial({ color: pal.active, roughness: 0.35, metalness: 0.25, emissive: pal.active, emissiveIntensity: 0.55 }),
    }),
    [pal],
  );
}

function Marker({ p, active, onSelect, mats }: { p: Package; active: boolean; onSelect: (slug: string) => void; mats: ReturnType<typeof useMonumentMaterials> }) {
  const pal = usePalette();
  const landmark = useRef<THREE.Group>(null);
  const lean = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Group>(null);
  const pos = useMemo(() => toVec(...p.coords, R + 0.01), [p.coords]);
  useFrame((s) => {
    // the selected landmark grows and turns slowly on its spot
    const g = landmark.current!;
    g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, active ? 0.4 : 0.17, 0.12));
    g.rotation.y += active ? 0.008 : 0;
    // and stands up more (closer to the surface tangent) so it faces you rather than showing its roof
    lean.current!.rotation.x = THREE.MathUtils.lerp(lean.current!.rotation.x, active ? -0.28 : -0.61, 0.12);
    // two rings ripple out from under the selected one
    halo.current!.children.forEach((ring, i) => {
      const t = (s.clock.elapsedTime * 0.6 + i * 0.5) % 1;
      ring.scale.setScalar(1 + t * 3);
      ((ring as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.8;
    });
  });
  const select = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onSelect(p.slug);
  };
  return (
    <group position={pos} onUpdate={(g) => g.lookAt(0, 0, 0)}>
      <mesh onClick={select}>
        <circleGeometry args={[active ? 0.07 : 0.03, 32]} />
        <meshBasicMaterial color={active ? pal.active : pal.line} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <group ref={halo} visible={active}>
        {[0, 1].map((i) => (
          <mesh key={i}>
            <ringGeometry args={[0.075, 0.09, 48]} />
            <meshBasicMaterial color={pal.active} transparent side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
          </mesh>
        ))}
      </group>
      {/* the marker group faces the globe centre (+z in, +y towards north). Standing models straight
          out (-z) would show the one facing the camera from above, so they lean north, at 35° above the
          surface: front-facing landmarks read upright, like a postcard */}
      <group ref={lean} position={[0, 0, -0.02]} rotation={[-0.61, 0, 0]}>
        <group ref={landmark} scale={0.17} onClick={select} onPointerOver={() => (document.body.style.cursor = "pointer")} onPointerOut={() => (document.body.style.cursor = "")}>
          <Monument country={p.country} m={active ? mats.active : mats.rest} />
        </group>
      </group>
    </group>
  );
}

const TILT = 0.22; // the selected spot sits a little below centre, so its landmark (leaning up) is centred on screen

function Globe({ items, active, onSelect }: { items: Package[]; active: string; onSelect: (s: string) => void }) {
  const pal = usePalette();
  const mats = useMonumentMaterials();
  const ref = useRef<THREE.Group>(null);
  const targets = useMemo(() => items.map((p) => toVec(...p.coords)), [items]);

  // exact yaw + pitch that bring the active point to the front (rotation order XYZ: yaw is applied first)
  const target = useMemo(() => {
    const p = items.find((i) => i.slug === active) ?? items[0];
    const v = toVec(...p.coords, 1);
    return { y: Math.atan2(-v.x, v.z), x: Math.atan2(v.y, Math.hypot(v.x, v.z)) + TILT };
  }, [active, items]);

  useFrame(() => {
    const g = ref.current!;
    // shortest path around the y axis
    const dy = Math.atan2(Math.sin(target.y - g.rotation.y), Math.cos(target.y - g.rotation.y));
    g.rotation.y += dy * 0.06;
    g.rotation.x += (target.x - g.rotation.x) * 0.06;
  });

  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[R * 0.985, 64, 64]} />
        <meshBasicMaterial color={pal.sphere} />
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
        <Marker key={p.slug} p={p} active={p.slug === active} onSelect={onSelect} mats={mats} />
      ))}
    </group>
  );
}

const HOME_CAM = new THREE.Vector3(0, 0, 7.4);

/** you can drag to look around; let go and the view eases back so the selected landmark faces you again */
function Controls({ active }: { active: string }) {
  const dragging = useRef(false);
  const { camera } = useThree();
  useFrame(() => {
    if (dragging.current || camera.position.distanceToSquared(HOME_CAM) < 1e-6) return;
    camera.position.lerp(HOME_CAM, 0.06);
    camera.lookAt(0, 0, 0);
  });
  return (
    <OrbitControls
      key={active} // a new selection also drops any half-finished drag
      enableZoom={false}
      enablePan={false}
      rotateSpeed={0.5}
      onStart={() => (dragging.current = true)}
      onEnd={() => (dragging.current = false)}
    />
  );
}

export default function GlobeScene(props: { items: Package[]; active: string; onSelect: (s: string) => void; live: boolean }) {
  return (
    <Canvas resize={{ offsetSize: true }} frameloop={props.live ? "always" : "never"} dpr={[1, 1.75]} camera={{ position: [0, 0, 7.4], fov: 40 }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 5, 6]} intensity={1.6} />
      <Globe {...props} />
      <Controls active={props.active} />
    </Canvas>
  );
}
