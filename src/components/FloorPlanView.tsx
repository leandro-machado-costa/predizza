"use client";

import type { BuildingManifest, ManifestFloor } from "@/lib/building-manifest";
import type { MapMarker } from "@/components/BuildingMap";

type PlantMarker = MapMarker & { u?: number; v?: number };

export function FloorPlanView({
  manifest,
  floor,
  markers,
  selectedSpaceId,
  onSelectSpace,
  onPickUv,
}: {
  manifest: BuildingManifest;
  floor: ManifestFloor;
  markers: PlantMarker[];
  selectedSpaceId?: string | null;
  onSelectSpace?: (spaceId: string, point: { x: number; y: number; z: number }) => void;
  onPickUv?: (u: number, v: number) => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-[#f4f1ea]">
      <img
        src={floor.plantSvg}
        alt={`Planta — ${floor.name}`}
        className="block h-auto w-full"
      />
      <button
        type="button"
        className="absolute inset-0 z-0 cursor-crosshair bg-transparent"
        aria-label="Marcar ponto na planta"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const u = (e.clientX - rect.left) / rect.width;
          const v = (e.clientY - rect.top) / rect.height;
          onPickUv?.(u, v);
        }}
      />
      {floor.spaces.map((space) => {
        const active = selectedSpaceId === space.id;
        return (
          <button
            key={space.id}
            type="button"
            title={space.name}
            className={`absolute z-20 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ${
              active ? "scale-125 bg-accent-2" : "bg-accent"
            }`}
            style={{ left: `${space.u * 100}%`, top: `${space.v * 100}%` }}
            onClick={(e) => {
              e.stopPropagation();
              const x = (space.u - 0.5) * manifest.dimensions.width;
              const z = (space.v - 0.5) * manifest.dimensions.depth;
              const y =
                floor.level * manifest.dimensions.floorHeight +
                manifest.dimensions.floorHeight / 2;
              onSelectSpace?.(space.id, {
                x: Number(x.toFixed(2)),
                y: Number(y.toFixed(2)),
                z: Number(z.toFixed(2)),
              });
            }}
          />
        );
      })}
      {markers
        .filter((m) => m.u != null && m.v != null)
        .map((m) => (
          <div
            key={`${m.kind}-${m.id}`}
            title={m.label}
            className={`pointer-events-none absolute z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white ${
              m.kind === "occurrence" ? "bg-accent-2" : "bg-accent"
            }`}
            style={{ left: `${(m.u ?? 0) * 100}%`, top: `${(m.v ?? 0) * 100}%` }}
          />
        ))}
    </div>
  );
}
