"use client";

// Low-poly landmarks for the globe, one per destination country, built from three.js primitives
// (no model files to download or license). Each is modelled standing on y = 0 and about 1 unit tall;
// the globe scales it down and stands it on the surface.
import type { Material } from "three";

type V3 = [number, number, number];
type P = { m: Material };

const Box = ({ m, s, p = [0, 0, 0], r }: P & { s: V3; p?: V3; r?: V3 }) => (
  <mesh position={p} rotation={r} material={m}>
    <boxGeometry args={s} />
  </mesh>
);
/** cylinder standing on its base at p; seg 4 gives a square, tapering obelisk-like block */
const Cyl = ({ m, top, bot, h, p = [0, 0, 0], seg = 12, r }: P & { top: number; bot: number; h: number; p?: V3; seg?: number; r?: V3 }) => (
  <mesh position={[p[0], p[1] + h / 2, p[2]]} rotation={r} material={m}>
    <cylinderGeometry args={[top, bot, h, seg]} />
  </mesh>
);
const Cone = ({ m, rad, h, p = [0, 0, 0], seg = 12 }: P & { rad: number; h: number; p?: V3; seg?: number }) => (
  <mesh position={[p[0], p[1] + h / 2, p[2]]} material={m}>
    <coneGeometry args={[rad, h, seg]} />
  </mesh>
);
/** dome: the top half of a sphere sitting on p */
const Dome = ({ m, rad, p = [0, 0, 0], squash = 1 }: P & { rad: number; p?: V3; squash?: number }) => (
  <mesh position={p} scale={[1, squash, 1]} material={m}>
    <sphereGeometry args={[rad, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
  </mesh>
);
const Ball = ({ m, rad, p = [0, 0, 0], s = [1, 1, 1] }: P & { rad: number; p?: V3; s?: V3 }) => (
  <mesh position={p} scale={s} material={m}>
    <sphereGeometry args={[rad, 14, 10]} />
  </mesh>
);
const corners = (d: number) => [[d, d], [-d, d], [d, -d], [-d, -d]] as const;

function TajMahal({ m }: P) {
  return (
    <>
      <Box m={m} s={[1, 0.08, 1]} p={[0, 0.04, 0]} />
      <Box m={m} s={[0.56, 0.36, 0.56]} p={[0, 0.26, 0]} />
      <Cyl m={m} top={0.17} bot={0.17} h={0.08} p={[0, 0.44, 0]} />
      <Ball m={m} rad={0.2} p={[0, 0.62, 0]} s={[1, 1.15, 1]} />
      <Cone m={m} rad={0.03} h={0.22} p={[0, 0.82, 0]} />
      {corners(0.42).map(([x, z], i) => (
        <group key={i}>
          <Cyl m={m} top={0.025} bot={0.035} h={0.62} p={[x, 0.08, z]} />
          <Dome m={m} rad={0.045} p={[x, 0.7, z]} />
        </group>
      ))}
      {corners(0.2).map(([x, z], i) => (
        <Dome key={i} m={m} rad={0.07} p={[x, 0.44, z]} />
      ))}
    </>
  );
}

function BurjKhalifa({ m }: P) {
  const tiers = [0.2, 0.16, 0.13, 0.1, 0.075, 0.05, 0.03];
  return (
    <>
      {tiers.map((r, i) => (
        <Cyl key={i} m={m} top={r * 0.85} bot={r} h={0.14} p={[0, i * 0.14, 0]} seg={6} />
      ))}
      <Cone m={m} rad={0.02} h={0.3} p={[0, 0.98, 0]} seg={6} />
    </>
  );
}

function EiffelTower({ m }: P) {
  return (
    <>
      {corners(0.22).map(([x, z], i) => (
        <Box key={i} m={m} s={[0.06, 0.36, 0.06]} p={[x * 0.7, 0.17, z * 0.7]} r={[z > 0 ? 0.42 : -0.42, 0, x > 0 ? -0.42 : 0.42]} />
      ))}
      <Box m={m} s={[0.4, 0.04, 0.4]} p={[0, 0.34, 0]} />
      <Cyl m={m} top={0.06} bot={0.16} h={0.3} p={[0, 0.36, 0]} seg={4} r={[0, Math.PI / 4, 0]} />
      <Box m={m} s={[0.15, 0.03, 0.15]} p={[0, 0.66, 0]} />
      <Cyl m={m} top={0.015} bot={0.06} h={0.3} p={[0, 0.67, 0]} seg={4} r={[0, Math.PI / 4, 0]} />
    </>
  );
}

function Pagoda({ m }: P) {
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => {
        const w = 0.34 - i * 0.05;
        const y = i * 0.15;
        return (
          <group key={i}>
            <Box m={m} s={[w, 0.1, w]} p={[0, y + 0.05, 0]} />
            <Cyl m={m} top={w * 0.45} bot={w * 1.05} h={0.05} p={[0, y + 0.1, 0]} seg={4} r={[0, Math.PI / 4, 0]} />
          </group>
        );
      })}
      <Cyl m={m} top={0.008} bot={0.02} h={0.26} p={[0, 0.8, 0]} seg={6} />
    </>
  );
}

function Parthenon({ m }: P) {
  const cols: [number, number][] = [];
  for (let i = 0; i < 6; i++) cols.push([-0.4 + i * 0.16, 0.24], [-0.4 + i * 0.16, -0.24]);
  for (const z of [-0.08, 0.08]) cols.push([-0.4, z], [0.4, z]);
  return (
    <>
      <Box m={m} s={[1, 0.06, 0.66]} p={[0, 0.03, 0]} />
      <Box m={m} s={[0.94, 0.04, 0.6]} p={[0, 0.08, 0]} />
      {cols.map(([x, z], i) => (
        <Cyl key={i} m={m} top={0.03} bot={0.034} h={0.34} p={[x, 0.1, z]} seg={8} />
      ))}
      <Box m={m} s={[0.94, 0.07, 0.6]} p={[0, 0.475, 0]} />
      {/* triangular pediment: a 3-sided cylinder lying along x */}
      <mesh position={[0, 0.555, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 3.4]} material={m}>
        <cylinderGeometry args={[0.09, 0.09, 0.94, 3]} />
      </mesh>
    </>
  );
}

function OverwaterVilla({ m }: P) {
  return (
    <>
      <Box m={m} s={[1, 0.02, 0.06]} p={[-0.1, 0.18, 0]} />
      {corners(0.16).map(([x, z], i) => (
        <Cyl key={i} m={m} top={0.012} bot={0.012} h={0.2} p={[x + 0.18, 0, z]} seg={6} />
      ))}
      <Box m={m} s={[0.4, 0.18, 0.36]} p={[0.18, 0.29, 0]} />
      <Cone m={m} rad={0.32} h={0.24} p={[0.18, 0.38, 0]} seg={4} />
      <Cyl m={m} top={0.012} bot={0.02} h={0.62} p={[-0.32, 0, 0.12]} seg={6} r={[0.15, 0, 0.15]} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Box key={i} m={m} s={[0.24, 0.012, 0.05]} p={[-0.36 + Math.cos((i / 5) * Math.PI * 2) * 0.11, 0.6, 0.18 + Math.sin((i / 5) * Math.PI * 2) * 0.11]} r={[0, (-i / 5) * Math.PI * 2, -0.35]} />
      ))}
    </>
  );
}

function Borobudur({ m }: P) {
  return (
    <>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Box key={i} m={m} s={[0.95 - i * 0.13, 0.08, 0.95 - i * 0.13]} p={[0, 0.04 + i * 0.08, 0]} />
      ))}
      {[0, 1, 2].map((i) => (
        <Cyl key={i} m={m} top={0.26 - i * 0.07} bot={0.28 - i * 0.07} h={0.05} p={[0, 0.48 + i * 0.05, 0]} seg={16} />
      ))}
      <Ball m={m} rad={0.1} p={[0, 0.66, 0]} s={[1, 1.2, 1]} />
      <Cone m={m} rad={0.025} h={0.2} p={[0, 0.74, 0]} seg={8} />
    </>
  );
}

function Hallgrimskirkja({ m }: P) {
  return (
    <>
      {[0.12, 0.2, 0.28, 0.36, 0.44].map((h, i) => (
        <group key={i}>
          <Box m={m} s={[0.07, h, 0.3]} p={[0.06 + i * 0.07, h / 2, 0]} />
          <Box m={m} s={[0.07, h, 0.3]} p={[-0.06 - i * 0.07, h / 2, 0]} />
        </group>
      ))}
      <Box m={m} s={[0.14, 0.62, 0.3]} p={[0, 0.31, 0]} />
      <Cyl m={m} top={0.01} bot={0.09} h={0.34} p={[0, 0.62, 0]} seg={4} r={[0, Math.PI / 4, 0]} />
      <Box m={m} s={[0.5, 0.2, 0.32]} p={[0, 0.1, -0.3]} />
    </>
  );
}

function Matterhorn({ m }: P) {
  return (
    <>
      <mesh position={[0.04, 0.42, 0]} rotation={[0, 0.3, -0.12]} scale={[1, 1, 0.8]} material={m}>
        <coneGeometry args={[0.42, 0.84, 4]} />
      </mesh>
      <Cone m={m} rad={0.36} h={0.3} p={[-0.32, 0, 0.15]} seg={5} />
      <Cone m={m} rad={0.28} h={0.22} p={[0.36, 0, -0.1]} seg={5} />
    </>
  );
}

function Acacia({ m }: P) {
  return (
    <>
      <Cyl m={m} top={0.03} bot={0.05} h={0.42} p={[0, 0, 0]} seg={6} r={[0, 0, 0.12]} />
      <Cyl m={m} top={0.015} bot={0.025} h={0.26} p={[-0.05, 0.36, 0]} seg={5} r={[0, 0, 0.7]} />
      <Cyl m={m} top={0.015} bot={0.025} h={0.26} p={[0.02, 0.36, 0]} seg={5} r={[0, 0, -0.6]} />
      <Ball m={m} rad={0.46} p={[0, 0.6, 0]} s={[1, 0.18, 0.75]} />
      {/* a giraffe for scale */}
      <Box m={m} s={[0.16, 0.08, 0.06]} p={[0.36, 0.2, 0.18]} />
      {[[-0.06, -0.02], [0.06, -0.02], [-0.06, 0.02], [0.06, 0.02]].map(([x, z], i) => (
        <Box key={i} m={m} s={[0.015, 0.16, 0.015]} p={[0.36 + x, 0.08, 0.18 + z]} />
      ))}
      <Box m={m} s={[0.03, 0.26, 0.03]} p={[0.46, 0.34, 0.18]} r={[0, 0, -0.3]} />
      <Box m={m} s={[0.07, 0.035, 0.035]} p={[0.53, 0.47, 0.18]} />
    </>
  );
}

function WatArun({ m }: P) {
  return (
    <>
      <Box m={m} s={[0.7, 0.06, 0.7]} p={[0, 0.03, 0]} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Cyl key={i} m={m} top={0.2 - i * 0.035} bot={0.24 - i * 0.035} h={0.1} p={[0, 0.06 + i * 0.1, 0]} seg={8} />
      ))}
      <Cone m={m} rad={0.06} h={0.36} p={[0, 0.56, 0]} seg={8} />
      {corners(0.27).map(([x, z], i) => (
        <group key={i}>
          <Cyl m={m} top={0.04} bot={0.06} h={0.22} p={[x, 0.06, z]} seg={8} />
          <Cone m={m} rad={0.025} h={0.14} p={[x, 0.28, z]} seg={8} />
        </group>
      ))}
    </>
  );
}

function Stupa({ m }: P) {
  return (
    <>
      <Box m={m} s={[0.9, 0.05, 0.9]} p={[0, 0.025, 0]} />
      {[0, 1, 2].map((i) => (
        <Cyl key={i} m={m} top={0.4 - i * 0.03} bot={0.42 - i * 0.03} h={0.04} p={[0, 0.05 + i * 0.04, 0]} seg={24} />
      ))}
      <Dome m={m} rad={0.36} p={[0, 0.17, 0]} squash={0.95} />
      <Box m={m} s={[0.12, 0.08, 0.12]} p={[0, 0.54, 0]} />
      <Cone m={m} rad={0.06} h={0.36} p={[0, 0.58, 0]} seg={12} />
    </>
  );
}

function MarinaBaySands({ m }: P) {
  return (
    <>
      {[-0.28, 0, 0.28].map((x, i) => (
        <group key={i}>
          <Box m={m} s={[0.12, 0.62, 0.2]} p={[x - 0.03, 0.31, 0]} r={[0, 0, 0.04]} />
          <Box m={m} s={[0.08, 0.62, 0.2]} p={[x + 0.05, 0.31, 0]} r={[0, 0, -0.04]} />
        </group>
      ))}
      {/* the SkyPark "ship" across the top */}
      <Box m={m} s={[0.96, 0.05, 0.16]} p={[0.06, 0.65, 0]} />
      <Box m={m} s={[0.14, 0.03, 0.14]} p={[0.52, 0.65, 0]} />
    </>
  );
}

function PetronasTowers({ m }: P) {
  return (
    <>
      {[-0.17, 0.17].map((x, i) => (
        <group key={i}>
          {[0, 1, 2, 3, 4, 5].map((t) => (
            <Cyl key={t} m={m} top={0.1 - t * 0.012} bot={0.11 - t * 0.012} h={0.13} p={[x, t * 0.13, 0]} seg={8} />
          ))}
          <Cone m={m} rad={0.02} h={0.22} p={[x, 0.78, 0]} seg={8} />
        </group>
      ))}
      <Box m={m} s={[0.26, 0.03, 0.05]} p={[0, 0.4, 0]} />
    </>
  );
}

function Himalaya({ m }: P) {
  return (
    <>
      <Cone m={m} rad={0.36} h={0.86} p={[0, 0, 0]} seg={5} />
      <Cone m={m} rad={0.3} h={0.56} p={[-0.34, 0, 0.12]} seg={5} />
      <Cone m={m} rad={0.26} h={0.46} p={[0.34, 0, -0.08]} seg={5} />
      {/* prayer flags strung between two poles */}
      <Cyl m={m} top={0.008} bot={0.008} h={0.3} p={[-0.48, 0, 0.36]} seg={4} />
      <Box m={m} s={[0.5, 0.012, 0.012]} p={[-0.24, 0.27, 0.36]} r={[0, 0, -0.3]} />
    </>
  );
}

function LeaningTower({ m }: P) {
  return (
    <group rotation={[0, 0, 0.09]}>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <group key={i}>
          <Cyl m={m} top={0.15} bot={0.15} h={0.1} p={[0, i * 0.11, 0]} seg={16} />
          <Cyl m={m} top={0.17} bot={0.17} h={0.012} p={[0, i * 0.11 + 0.1, 0]} seg={16} />
        </group>
      ))}
      <Cyl m={m} top={0.1} bot={0.1} h={0.1} p={[0, 0.78, 0]} seg={16} />
    </group>
  );
}

function SkyTower({ m }: P) {
  return (
    <>
      <Cyl m={m} top={0.05} bot={0.09} h={0.6} p={[0, 0, 0]} seg={8} />
      <Cyl m={m} top={0.16} bot={0.1} h={0.08} p={[0, 0.6, 0]} seg={16} />
      <Cyl m={m} top={0.12} bot={0.16} h={0.05} p={[0, 0.68, 0]} seg={16} />
      <Cyl m={m} top={0.01} bot={0.03} h={0.34} p={[0, 0.73, 0]} seg={8} />
      <Box m={m} s={[0.7, 0.12, 0.3]} p={[0.1, 0.06, 0.28]} />
      <Box m={m} s={[0.2, 0.28, 0.2]} p={[-0.3, 0.14, 0.22]} />
    </>
  );
}

function HaLongBay({ m }: P) {
  const rocks: [number, number, number, number][] = [
    [0, 0, 0.18, 0.8],
    [0.34, 0.12, 0.13, 0.55],
    [-0.32, 0.18, 0.12, 0.5],
    [0.18, -0.3, 0.1, 0.4],
    [-0.2, -0.28, 0.09, 0.34],
  ];
  return (
    <>
      {rocks.map(([x, z, r, h], i) => (
        <group key={i}>
          <Cyl m={m} top={r * 0.85} bot={r} h={h} p={[x, 0, z]} seg={7} />
          <Ball m={m} rad={r * 0.85} p={[x, h, z]} s={[1, 0.7, 1]} />
        </group>
      ))}
      {/* a junk boat with a sail */}
      <Box m={m} s={[0.22, 0.04, 0.07]} p={[0.36, 0.02, -0.34]} />
      <Box m={m} s={[0.012, 0.18, 0.12]} p={[0.36, 0.13, -0.34]} r={[0, Math.PI / 2, 0]} />
    </>
  );
}

function Obelisk({ m }: P) {
  return (
    <>
      <Box m={m} s={[0.3, 0.06, 0.3]} p={[0, 0.03, 0]} />
      <Cyl m={m} top={0.05} bot={0.09} h={0.7} p={[0, 0.06, 0]} seg={4} r={[0, Math.PI / 4, 0]} />
      <Cone m={m} rad={0.07} h={0.12} p={[0, 0.76, 0]} seg={4} />
    </>
  );
}

const BY_COUNTRY: Record<string, (p: P) => React.ReactNode> = {
  India: TajMahal,
  UAE: BurjKhalifa,
  France: EiffelTower,
  Japan: Pagoda,
  Greece: Parthenon,
  Maldives: OverwaterVilla,
  Indonesia: Borobudur,
  Iceland: Hallgrimskirkja,
  Switzerland: Matterhorn,
  Kenya: Acacia,
  Thailand: WatArun,
  "Sri Lanka": Stupa,
  Singapore: MarinaBaySands,
  Malaysia: PetronasTowers,
  Nepal: Himalaya,
  "Italy & France": LeaningTower,
  Italy: LeaningTower,
  "New Zealand": SkyTower,
  Vietnam: HaLongBay,
};

/** landmark names, shown next to the globe */
export const LANDMARK: Record<string, string> = {
  India: "Taj Mahal",
  UAE: "Burj Khalifa",
  France: "Eiffel Tower",
  Japan: "Five-storey pagoda",
  Greece: "Parthenon",
  Maldives: "Overwater villa",
  Indonesia: "Borobudur",
  Iceland: "Hallgrímskirkja",
  Switzerland: "Matterhorn",
  Kenya: "Acacia savanna",
  Thailand: "Wat Arun",
  "Sri Lanka": "Ruwanwelisaya stupa",
  Singapore: "Marina Bay Sands",
  Malaysia: "Petronas Towers",
  Nepal: "Himalaya",
  "Italy & France": "Leaning Tower of Pisa",
  Italy: "Leaning Tower of Pisa",
  "New Zealand": "Sky Tower",
  Vietnam: "Ha Long Bay",
};

export default function Monument({ country, m }: { country: string } & P) {
  const Model = BY_COUNTRY[country] ?? Obelisk;
  return <Model m={m} />;
}
