"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export type Anchor = [x: number, y: number, z: number];
export type Projected = { x: number; y: number }[];

// module-level so the React purity lint doesn't flag scene setup; values are memoised per mount anyway
const rand = () => Math.random();

const M = (pos: Anchor, rot: Anchor = [0, 0, 0], scale: Anchor = [1, 1, 1]) =>
  new THREE.Matrix4().compose(new THREE.Vector3(...pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new THREE.Vector3(...scale));

/** onion-dome profile (radius, height), spun on a lathe */
const ONION = [
  [0.0, 0],
  [0.95, 0],
  [1.12, 0.35],
  [1.2, 0.75],
  [1.1, 1.15],
  [0.82, 1.5],
  [0.45, 1.82],
  [0.16, 2.08],
  [0.04, 2.3],
].map(([x, y]) => new THREE.Vector2(x, y));

const dome = (pos: Anchor, s: number) => new THREE.LatheGeometry(ONION, 40).applyMatrix4(M(pos, [0, 0, 0], [s, s * 1.2, s]));

/** a small domed pavilion: open octagonal drum on top of the roof or a minaret */
const chhatri = (x: number, y: number, z: number, s: number) => [
  new THREE.CylinderGeometry(0.34 * s, 0.34 * s, 0.5 * s, 8, 2, true).applyMatrix4(M([x, y + 0.25 * s, z])),
  dome([x, y + 0.5 * s, z], 0.32 * s),
];

/** the Taj Mahal from primitives, centred on its plinth; front faces +Z */
function buildTaj() {
  const parts: THREE.BufferGeometry[] = [
    // plinth: only its four sides, so points outline the terrace instead of carpeting it
    new THREE.CylinderGeometry(4.95, 4.95, 0.45, 4, 2, true).applyMatrix4(M([0, 0.22, 0], [0, Math.PI / 4, 0])),
    // chamfered main hall
    new THREE.CylinderGeometry(2.25, 2.25, 2.2, 8, 6, true).applyMatrix4(M([0, 1.55, 0], [0, Math.PI / 8, 0])),
    new THREE.CylinderGeometry(2.25, 2.25, 0.02, 8, 1).applyMatrix4(M([0, 2.65, 0], [0, Math.PI / 8, 0])),
    // drum + great dome + finial
    new THREE.CylinderGeometry(0.92, 0.98, 0.65, 40, 3, true).applyMatrix4(M([0, 2.97, 0])),
    dome([0, 3.28, 0], 1),
    new THREE.CylinderGeometry(0.035, 0.035, 0.7, 8).applyMatrix4(M([0, 6.35, 0])),
    // four rooftop chhatris
    ...[-1, 1].flatMap((sx) => [-1, 1].flatMap((sz) => chhatri(sx * 1.3, 2.66, sz * 1.3, 1.25))),
  ];

  // a tall pointed arch (iwan) framed on each of the four main faces
  for (let k = 0; k < 4; k++) {
    const rot = (k * Math.PI) / 2;
    const r = 2.08;
    parts.push(
      new THREE.TorusGeometry(0.62, 0.035, 6, 30, Math.PI).applyMatrix4(M([Math.sin(rot) * r, 1.85, Math.cos(rot) * r], [0, rot, 0], [1, 1.35, 1])),
      new THREE.BoxGeometry(1.5, 1.9, 0.05, 6, 8, 1).applyMatrix4(M([Math.sin(rot) * (r + 0.01), 1.6, Math.cos(rot) * (r + 0.01)], [0, rot, 0])),
    );
  }

  // four minarets with three balconies and a crowning chhatri
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const [x, z] = [sx * 3.25, sz * 3.25];
      parts.push(new THREE.CylinderGeometry(0.19, 0.26, 4.2, 18, 12, true).applyMatrix4(M([x, 2.55, z])));
      for (const y of [1.75, 3.0, 4.25]) parts.push(new THREE.CylinderGeometry(0.36, 0.3, 0.08, 18).applyMatrix4(M([x, y, z])));
      parts.push(...chhatri(x, 4.65, z, 0.85));
    }

  return mergeGeometries(parts.map((g) => (g.index ? g.toNonIndexed() : g)).map((g) => {
    // lathe/torus/box/cylinder carry different attributes; positions are all the sampler needs
    const clean = new THREE.BufferGeometry();
    clean.setAttribute("position", g.attributes.position);
    return clean;
  }))!;
}

const vert = /* glsl */ `
  uniform float uProgress;
  uniform float uScatter;
  uniform float uTime;
  attribute vec3 aStart;
  attribute float aRand;
  varying float vAlpha;
  void main() {
    float t = clamp((uProgress - aRand * 0.45) / 0.55, 0.0, 1.0);
    t = t * t * (3.0 - 2.0 * t);
    vec3 p = mix(aStart, position, t);
    vec3 dir = normalize(position - vec3(0.0, 1.5, 0.0) + vec3(0.001));
    p += dir * uScatter * (1.5 + aRand * 7.0) + vec3(uScatter * (aRand - 0.5) * 4.0, uScatter * aRand * 3.0, 0.0);
    p.y += sin(uTime * 1.6 + aRand * 40.0) * 0.012;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = (1.6 + aRand * 2.0) * (10.0 / -mv.z);
    vAlpha = (0.55 + 0.45 * sin(uTime * 2.5 + aRand * 90.0)) * (1.0 - uScatter * 0.85) * (0.35 + 0.65 * t);
    gl_Position = projectionMatrix * mv;
  }
`;

const frag = /* glsl */ `
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    if (max(abs(c.x), abs(c.y)) > 0.42) discard;
    gl_FragColor = vec4(0.95, 0.96, 0.98, vAlpha);
  }
`;

function Taj({ started, anchors, onProject }: { started: boolean; anchors: Anchor[]; onProject: (pts: Projected) => void }) {
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uProgress: { value: 0 }, uScatter: { value: 0 }, uTime: { value: 0 } }), []);

  const geo = useMemo(() => {
    const sampler = new MeshSurfaceSampler(new THREE.Mesh(buildTaj())).build();
    const count = 16000;
    const pos = new Float32Array(count * 3);
    const start = new Float32Array(count * 3);
    const r = new Float32Array(count);
    const v = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      sampler.sample(v);
      pos.set([v.x, v.y, v.z], i * 3);
      // points rise in from a wide cloud around the monument
      const a = rand() * Math.PI * 2;
      const rad = 6 + rand() * 8;
      start.set([Math.cos(a) * rad, (rand() - 0.2) * 10, Math.sin(a) * rad - 4], i * 3);
      r[i] = rand();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aStart", new THREE.BufferAttribute(start, 3));
    g.setAttribute("aRand", new THREE.BufferAttribute(r, 1));
    return g;
  }, []);

  const tmp = useMemo(() => new THREE.Vector3(), []);
  const out = useMemo<Projected>(() => anchors.map(() => ({ x: 0, y: 0 })), [anchors]);

  useFrame((s, dt) => {
    const u = mat.current!.uniforms;
    u.uTime.value = s.clock.elapsedTime;
    if (started) u.uProgress.value = Math.min(1, u.uProgress.value + dt / 3.2);
    u.uScatter.value = THREE.MathUtils.clamp(window.scrollY / window.innerHeight, 0, 1);

    const g = group.current!;
    const t = s.clock.elapsedTime;
    // slow turn so the four-sided symmetry reads as 3D, nudged by the pointer
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, -0.5 + Math.sin(t * 0.18) * 0.25 + s.pointer.x * 0.2, 0.04);
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, 0.08 - s.pointer.y * 0.06, 0.04);
    g.position.y = -1.95 + Math.sin(t * 0.8) * 0.06;
    g.updateMatrixWorld();

    anchors.forEach((a, i) => {
      tmp.set(...a).applyMatrix4(g.matrixWorld).project(s.camera);
      out[i].x = (tmp.x * 0.5 + 0.5) * s.size.width;
      out[i].y = (-tmp.y * 0.5 + 0.5) * s.size.height;
    });
    onProject(out);
  });

  return (
    <group ref={group} position={[2.05, -1.95, 0]} scale={0.5}>
      <points geometry={geo}>
        <shaderMaterial ref={mat} uniforms={uniforms} vertexShader={vert} fragmentShader={frag} transparent depthWrite={false} />
      </points>
    </group>
  );
}

export default function TajCloud(props: { started: boolean; active: boolean; anchors: Anchor[]; onProject: (pts: Projected) => void }) {
  return (
    <Canvas
      resize={{ offsetSize: true }}
      frameloop={props.active ? "always" : "never"}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.6, 10], fov: 38 }}
      gl={{ alpha: true, antialias: false }}
    >
      <Taj started={props.started} anchors={props.anchors} onProject={props.onProject} />
    </Canvas>
  );
}
