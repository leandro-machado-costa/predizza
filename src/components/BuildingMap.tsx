"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html, ContactShadows } from "@react-three/drei";
import { useMemo, useState } from "react";
import type { BuildingManifest } from "@/lib/building-manifest";

export type MapMarker = {
  id: number;
  label: string;
  kind: "system" | "occurrence";
  x: number;
  y: number;
  z: number;
  href?: string;
  u?: number;
  v?: number;
  floorId?: string;
};

function WindowGrid({
  width,
  height,
  depth,
  floors,
  floorHeight,
}: {
  width: number;
  height: number;
  depth: number;
  floors: number;
  floorHeight: number;
}) {
  const windows = [];
  for (let f = 1; f <= floors; f++) {
    const y = f * floorHeight - floorHeight * 0.45;
    for (let i = -2; i <= 2; i++) {
      windows.push(
        <mesh key={`f${f}-w${i}`} position={[i * 2.8, y, depth / 2 + 0.06]}>
          <boxGeometry args={[1.4, 1.3, 0.08]} />
          <meshStandardMaterial color="#9ec5d8" metalness={0.2} roughness={0.25} />
        </mesh>,
      );
      windows.push(
        <mesh key={`b${f}-w${i}`} position={[i * 2.8, y, -depth / 2 - 0.06]}>
          <boxGeometry args={[1.4, 1.3, 0.08]} />
          <meshStandardMaterial color="#9ec5d8" metalness={0.2} roughness={0.25} />
        </mesh>,
      );
    }
  }
  return <group>{windows}</group>;
}

function ResidentialTower({ manifest }: { manifest: BuildingManifest }) {
  const { width, depth, floorHeight, floors } = manifest.dimensions;
  const towerHeight = floors * floorHeight;
  const groundY = 0;

  return (
    <group>
      {/* terreno */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, groundY, 0]} receiveShadow>
        <planeGeometry args={[48, 48]} />
        <meshStandardMaterial color="#c8d0c4" />
      </mesh>
      {/* jardim */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[14, 0.02, 0]}>
        <circleGeometry args={[5, 24]} />
        <meshStandardMaterial color="#7fa37a" />
      </mesh>

      {/* subsolo (parcial) */}
      <mesh position={[0, -floorHeight / 2, 0]} castShadow>
        <boxGeometry args={[width * 0.85, floorHeight, depth * 0.85]} />
        <meshStandardMaterial color="#8b9098" />
      </mesh>

      {/* térreo (pilotis / base) */}
      <mesh position={[0, floorHeight / 2, 0]} castShadow>
        <boxGeometry args={[width, floorHeight, depth]} />
        <meshStandardMaterial color="#dfe5df" />
      </mesh>
      {/* entrada */}
      <mesh position={[0, 1.2, depth / 2 + 0.4]}>
        <boxGeometry args={[4, 2.4, 0.8]} />
        <meshStandardMaterial color="#b9c4bc" />
      </mesh>

      {/* torre residencial */}
      <mesh position={[0, floorHeight + towerHeight / 2, 0]} castShadow>
        <boxGeometry args={[width, towerHeight, depth]} />
        <meshStandardMaterial color="#e8eee9" roughness={0.85} />
      </mesh>

      <WindowGrid
        width={width}
        height={towerHeight}
        depth={depth}
        floors={floors}
        floorHeight={floorHeight}
      />

      {/* lajes / cornijas */}
      {Array.from({ length: floors }).map((_, i) => (
        <mesh
          key={`ledge-${i}`}
          position={[0, (i + 1) * floorHeight, 0]}
        >
          <boxGeometry args={[width + 0.25, 0.12, depth + 0.25]} />
          <meshStandardMaterial color="#cfd6d0" />
        </mesh>
      ))}

      {/* cobertura técnica */}
      <mesh position={[0, floorHeight + towerHeight + 1.2, 0]} castShadow>
        <boxGeometry args={[width * 0.55, 2.4, depth * 0.55]} />
        <meshStandardMaterial color="#aeb6b0" />
      </mesh>
      {/* reservatório */}
      <mesh position={[-4, floorHeight + towerHeight + 2.2, 2]}>
        <cylinderGeometry args={[1.2, 1.2, 1.6, 16]} />
        <meshStandardMaterial color="#7a9e95" />
      </mesh>
      {/* SPDA */}
      <mesh position={[4, floorHeight + towerHeight + 3.2, 2]}>
        <cylinderGeometry args={[0.08, 0.08, 3.2, 8]} />
        <meshStandardMaterial color="#c45c26" metalness={0.6} />
      </mesh>

      <ContactShadows opacity={0.35} scale={40} blur={2.5} far={20} />
    </group>
  );
}

function Marker({
  marker,
  selected,
  onSelect,
}: {
  marker: MapMarker;
  selected: boolean;
  onSelect: () => void;
}) {
  const color = marker.kind === "occurrence" ? "#c45c26" : "#0f6e56";
  return (
    <mesh
      position={[marker.x, marker.y, marker.z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <sphereGeometry args={[selected ? 0.4 : 0.28, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} />
      {selected ? (
        <Html distanceFactor={12}>
          <div className="rounded-lg bg-white px-2 py-1 text-xs shadow">
            {marker.label}
          </div>
        </Html>
      ) : null}
    </mesh>
  );
}

export function BuildingMap({
  manifest,
  markers,
  onPick,
}: {
  manifest: BuildingManifest;
  markers: MapMarker[];
  onPick?: (point: { x: number; y: number; z: number }) => void;
}) {
  const [selected, setSelected] = useState<number | null>(markers[0]?.id ?? null);
  const list = useMemo(() => markers, [markers]);
  const { width, depth, floorHeight, floors } = manifest.dimensions;
  const pickHeight = floorHeight + floors * floorHeight;

  return (
    <div className="h-[460px] overflow-hidden rounded-2xl border border-line bg-[#dfe8e2]">
      <Canvas shadows camera={{ position: [28, 22, 28], fov: 40 }}>
        <color attach="background" args={["#dfe8e2"]} />
        <ambientLight intensity={0.65} />
        <directionalLight
          castShadow
          position={[18, 28, 12]}
          intensity={1.25}
          shadow-mapSize={[1024, 1024]}
        />
        <ResidentialTower manifest={manifest} />
        <mesh
          position={[0, pickHeight / 2, 0]}
          onClick={(e) => {
            if (!onPick) return;
            e.stopPropagation();
            onPick({
              x: Number(e.point.x.toFixed(2)),
              y: Number(Math.max(0, e.point.y).toFixed(2)),
              z: Number(e.point.z.toFixed(2)),
            });
          }}
        >
          <boxGeometry args={[width + 0.4, pickHeight + 4, depth + 0.4]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
        {list.map((m) => (
          <Marker
            key={`${m.kind}-${m.id}`}
            marker={m}
            selected={selected === m.id}
            onSelect={() => setSelected(m.id)}
          />
        ))}
        <OrbitControls
          makeDefault
          maxPolarAngle={Math.PI * 0.49}
          minDistance={12}
          maxDistance={60}
        />
      </Canvas>
    </div>
  );
}
