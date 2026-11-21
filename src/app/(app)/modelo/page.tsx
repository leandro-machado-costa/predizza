import { readFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { occurrences, systems } from "@/db/schema";
import { PageHeader } from "@/components/ui";
import { getSession } from "@/lib/auth";
import type { BuildingManifest } from "@/lib/building-manifest";
import { MapClient } from "./MapClient";

async function loadManifest(): Promise<BuildingManifest> {
  const file = path.join(
    process.cwd(),
    "public/buildings/residencial-palmeiras/manifesto.json",
  );
  const raw = await readFile(file, "utf8");
  return JSON.parse(raw) as BuildingManifest;
}

export default async function MapPage() {
  const session = await getSession();
  if (!session) return null;

  const manifest = await loadManifest();

  const systemRows = db
    .select()
    .from(systems)
    .where(eq(systems.buildingId, session.buildingId))
    .all();
  const occRows = db
    .select()
    .from(occurrences)
    .where(eq(occurrences.buildingId, session.buildingId))
    .all();

  const systemByCategory = new Map(manifest.systems.map((s) => [s.key, s]));

  const markers = [
    ...systemRows.map((s) => {
      const ref = systemByCategory.get(s.category);
      const floor = ref
        ? manifest.floors.find((f) => f.id === ref.floorId)
        : undefined;
      const space = floor?.spaces.find((sp) => sp.id === ref?.spaceId);
      return {
        id: s.id,
        label: s.name,
        kind: "system" as const,
        x: ref?.map.x ?? s.mapX ?? 0,
        y: ref?.map.y ?? s.mapY ?? 0,
        z: ref?.map.z ?? s.mapZ ?? 0,
        floorId: ref?.floorId,
        u: space?.u,
        v: space?.v,
      };
    }),
    ...occRows.map((o) => ({
      id: o.id + 10000,
      label: o.code,
      kind: "occurrence" as const,
      x: o.mapX ?? 0,
      y: o.mapY ?? 0,
      z: o.mapZ ?? 0,
      u: o.mapX != null ? o.mapX / manifest.dimensions.width + 0.5 : undefined,
      v: o.mapZ != null ? o.mapZ / manifest.dimensions.depth + 0.5 : undefined,
    })),
  ];

  return (
    <div>
      <PageHeader
        title="Mapa do prédio"
        subtitle={`${manifest.name} — planta primeiro; 3D e BIM só como detalhe.`}
      />
      <MapClient
        manifest={manifest}
        markers={markers}
        systems={systemRows.map((s) => ({
          id: s.id,
          name: s.name,
          category: s.category,
        }))}
      />
    </div>
  );
}
