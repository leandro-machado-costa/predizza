"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { BuildingMap, type MapMarker } from "@/components/BuildingMap";
import { FloorPlanView } from "@/components/FloorPlanView";
import { createOccurrenceAction } from "@/app/actions/occurrences";
import { Field, PrimaryButton, inputClass, Card } from "@/components/ui";
import type { BuildingManifest } from "@/lib/building-manifest";

const IfcViewer = dynamic(
  () => import("@/components/IfcViewer").then((m) => m.IfcViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[460px] items-center justify-center rounded-2xl border border-line bg-[#1c2430] text-sm text-white/80">
        Carregando viewer BIM…
      </div>
    ),
  },
);

type SystemOption = { id: number; name: string; category?: string };

const BIM_OPTIONS = [
  {
    id: "escola",
    label: "Exemplo BIM (escola estrutural)",
    url: "/buildings/residencial-palmeiras/bim/school_str.ifc",
  },
  {
    id: "parede",
    label: "IFC mínimo (parede)",
    url: "/buildings/residencial-palmeiras/bim/just_wall.ifc",
  },
] as const;

export function MapClient({
  manifest,
  markers,
  systems,
}: {
  manifest: BuildingManifest;
  markers: MapMarker[];
  systems: SystemOption[];
}) {
  // Planta primeiro — BIM é secundário (IA e decisão vêm antes do IFC)
  const [view, setView] = useState<"planta" | "3d" | "bim">("planta");
  const [bimId, setBimId] = useState<(typeof BIM_OPTIONS)[number]["id"]>("parede");
  const [floorId, setFloorId] = useState(
    manifest.floors[1]?.id ?? manifest.floors[0].id,
  );
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [point, setPoint] = useState({ x: 0, y: 4, z: 0 });
  const [spaceLabel, setSpaceLabel] = useState("Ponto no mapa");

  const floor = useMemo(
    () => manifest.floors.find((f) => f.id === floorId) ?? manifest.floors[0],
    [manifest, floorId],
  );

  const bimUrl = BIM_OPTIONS.find((b) => b.id === bimId)?.url ?? BIM_OPTIONS[0].url;

  const plantMarkers = useMemo(() => {
    return markers
      .map((m) => {
        if (m.floorId && m.floorId !== floorId) return null;
        if (m.u != null && m.v != null) return m;
        const u = m.x / manifest.dimensions.width + 0.5;
        const v = m.z / manifest.dimensions.depth + 0.5;
        if (u < 0 || u > 1 || v < 0 || v > 1) return null;
        return { ...m, u, v };
      })
      .filter(Boolean) as MapMarker[];
  }, [markers, floorId, manifest.dimensions]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full border border-line bg-card p-1">
            {(
              [
                ["planta", "Planta"],
                ["3d", "3D"],
                ["bim", "BIM"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`rounded-full px-3 py-1.5 text-sm ${
                  view === id ? "bg-accent text-white" : "text-muted"
                }`}
                onClick={() => setView(id)}
              >
                {label}
              </button>
            ))}
          </div>
          {view === "planta" ? (
            <select
              className={inputClass + " max-w-xs"}
              value={floorId}
              onChange={(e) => {
                setFloorId(e.target.value);
                setSelectedSpaceId(null);
              }}
            >
              {manifest.floors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          ) : null}
          {view === "bim" ? (
            <select
              className={inputClass + " max-w-xs"}
              value={bimId}
              onChange={(e) =>
                setBimId(e.target.value as (typeof BIM_OPTIONS)[number]["id"])
              }
            >
              {BIM_OPTIONS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
          ) : null}
        </div>

        {view === "bim" ? (
          <IfcViewer ifcUrl={bimUrl} />
        ) : view === "planta" ? (
          <FloorPlanView
            manifest={manifest}
            floor={floor}
            markers={plantMarkers}
            selectedSpaceId={selectedSpaceId}
            onSelectSpace={(spaceId, p) => {
              setSelectedSpaceId(spaceId);
              setPoint(p);
              const space = floor.spaces.find((s) => s.id === spaceId);
              setSpaceLabel(space?.name ?? spaceId);
            }}
            onPickUv={(u, v) => {
              setSelectedSpaceId(null);
              setSpaceLabel("Ponto livre na planta");
              setPoint({
                x: Number(((u - 0.5) * manifest.dimensions.width).toFixed(2)),
                y: Number(
                  (
                    floor.level * manifest.dimensions.floorHeight +
                    manifest.dimensions.floorHeight / 2
                  ).toFixed(2),
                ),
                z: Number(((v - 0.5) * manifest.dimensions.depth).toFixed(2)),
              });
            }}
          />
        ) : (
          <BuildingMap
            manifest={manifest}
            markers={markers}
            onPick={(p) => {
              setPoint(p);
              setSpaceLabel("Ponto no volume 3D");
              setSelectedSpaceId(null);
            }}
          />
        )}

        <p className="text-sm text-muted">
          {view === "bim" ? (
            <>
              Viewer <strong>That Open</strong> (web-ifc → Fragments). Troque pelo
              IFC do seu edifício em{" "}
              <code className="text-xs">public/buildings/.../bim/</code>.
            </>
          ) : view === "planta" ? (
            <>
              Projeto exemplo: <strong>{manifest.name}</strong>. Clique num
              ambiente ou em qualquer ponto da planta.
            </>
          ) : (
            <>Torre 3D demonstrativa (sem BIM). Use a aba BIM para IFC real.</>
          )}
        </p>
      </div>

      <Card>
        <h2 className="display mb-1 text-xl">Registrar problema aqui</h2>
        <p className="mb-4 text-sm text-muted">
          {view === "bim"
            ? "Enquanto o vínculo elemento IFC ↔ ocorrência não está pronto, registre pelo sistema/local aproximado."
            : spaceLabel}
        </p>
        <form action={createOccurrenceAction} className="space-y-3">
          <input type="hidden" name="mapX" value={point.x} />
          <input type="hidden" name="mapY" value={point.y} />
          <input type="hidden" name="mapZ" value={point.z} />
          <p className="text-xs text-muted">
            Coordenadas: {point.x}, {point.y}, {point.z}
          </p>
          <Field label="Título">
            <input className={inputClass} name="title" required />
          </Field>
          <Field label="Sistema">
            <select className={inputClass} name="systemId" defaultValue="">
              <option value="">Sem vínculo</option>
              {systems.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Prioridade">
            <select className={inputClass} name="priority" defaultValue="media">
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </Field>
          <Field label="Descrição">
            <textarea className={inputClass} name="description" rows={4} />
          </Field>
          <PrimaryButton type="submit">Salvar ocorrência</PrimaryButton>
        </form>
      </Card>
    </div>
  );
}
