export type ManifestSpace = {
  id: string;
  name: string;
  u: number;
  v: number;
};

export type ManifestFloor = {
  id: string;
  name: string;
  level: number;
  plantSvg: string;
  spaces: ManifestSpace[];
};

export type ManifestSystem = {
  key: string;
  name: string;
  floorId: string;
  spaceId: string;
  map: { x: number; y: number; z: number };
};

export type BuildingManifest = {
  id: string;
  name: string;
  version: number;
  description: string;
  source: string;
  dimensions: {
    width: number;
    depth: number;
    floorHeight: number;
    floors: number;
  };
  floors: ManifestFloor[];
  systems: ManifestSystem[];
};

export const BUILDING_MANIFEST_PATH =
  "/buildings/residencial-palmeiras/manifesto.json";

export function plantToWorld(
  floor: ManifestFloor,
  space: ManifestSpace,
  dims: BuildingManifest["dimensions"],
) {
  const x = (space.u - 0.5) * dims.width;
  const z = (space.v - 0.5) * dims.depth;
  const y =
    floor.level < 0
      ? floor.level * dims.floorHeight + dims.floorHeight / 2
      : floor.level * dims.floorHeight + dims.floorHeight / 2;
  return {
    x: Number(x.toFixed(2)),
    y: Number(y.toFixed(2)),
    z: Number(z.toFixed(2)),
  };
}
