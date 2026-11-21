"use client";

import { useEffect, useRef, useState } from "react";
import * as OBC from "@thatopen/components";
import * as THREE from "three";

type Props = {
  ifcUrl: string;
  className?: string;
};

export function IfcViewer({ ifcUrl, className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"init" | "loading" | "ready" | "error">(
    "init",
  );
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let components: OBC.Components | null = null;

    const stillActive = () => !cancelled && components !== null;

    const boot = async () => {
      setStatus("init");
      setError(null);
      setProgress(0);
      container.innerHTML = "";

      try {
        const comps = new OBC.Components();
        components = comps;

        const worlds = comps.get(OBC.Worlds);
        const world = worlds.create<
          OBC.SimpleScene,
          OBC.SimpleCamera,
          OBC.SimpleRenderer
        >();

        const scene = new OBC.SimpleScene(comps);
        const renderer = new OBC.SimpleRenderer(comps, container);
        const camera = new OBC.SimpleCamera(comps);

        world.scene = scene;
        world.renderer = renderer;
        world.camera = camera;

        comps.init();
        scene.setup();
        scene.three.background = new THREE.Color("#1c2430");

        if (!stillActive()) return;

        const workerUrl = await OBC.FragmentsManager.getWorker();
        if (!stillActive()) return;

        const fragments = comps.get(OBC.FragmentsManager);
        fragments.init(workerUrl);

        camera.controls.addEventListener("update", () => {
          if (stillActive()) fragments.core.update();
        });

        fragments.list.onItemSet.add(({ value: model }) => {
          if (!stillActive()) return;
          model.useCamera(camera.three);
          scene.three.add(model.object);
          fragments.core.update(true);
        });

        fragments.core.models.materials.list.onItemSet.add(
          ({ value: material }) => {
            if (!("isLodMaterial" in material && material.isLodMaterial)) {
              material.polygonOffset = true;
              material.polygonOffsetUnits = 1;
              material.polygonOffsetFactor = Math.random();
            }
          },
        );

        const ifcLoader = comps.get(OBC.IfcLoader);
        await ifcLoader.setup({
          autoSetWasm: false,
          wasm: { path: "/wasm/", absolute: true },
        });
        if (!stillActive()) return;

        setStatus("loading");
        const file = await fetch(ifcUrl);
        if (!file.ok) throw new Error(`Falha ao baixar IFC (${file.status})`);
        const buffer = new Uint8Array(await file.arrayBuffer());
        if (!stillActive()) return;

        await ifcLoader.load(buffer, false, `predizza-${Date.now()}`, {
          processData: {
            progressCallback: (p: number) => {
              if (stillActive()) setProgress(Math.round((p || 0) * 100));
            },
          },
        });
        if (!stillActive()) return;

        try {
          const box = new THREE.Box3().setFromObject(scene.three);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const radius = Math.max(size.x, size.y, size.z, 8);
          await camera.controls.setLookAt(
            center.x + radius,
            center.y + radius * 0.5,
            center.z + radius,
            center.x,
            center.y,
            center.z,
          );
          await fragments.core.update(true);
        } catch {
          await camera.controls.setLookAt(12, 8, 12, 0, 1, 0);
        }

        if (stillActive()) {
          setStatus("ready");
          setProgress(100);
        }
      } catch (err) {
        console.error(err);
        if (stillActive()) {
          setStatus("error");
          setError(err instanceof Error ? err.message : "Erro ao carregar BIM");
        }
      }
    };

    void boot();

    return () => {
      cancelled = true;
      const comps = components;
      components = null;
      try {
        comps?.dispose();
      } catch {
        // ignore dispose races
      }
    };
  }, [ifcUrl]);

  return (
    <div
      className={`relative h-[460px] overflow-hidden rounded-2xl border border-line bg-[#1c2430] ${className}`}
    >
      <div ref={containerRef} className="absolute inset-0" />
      {status !== "ready" ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#1c2430]/85 px-4 text-center text-sm text-white">
          {status === "error" ? (
            <>
              <p className="font-medium text-red-300">
                Não foi possível abrir o IFC
              </p>
              <p className="text-white/70">{error}</p>
            </>
          ) : (
            <>
              <p className="font-medium">
                {status === "loading"
                  ? `Convertendo IFC → Fragments… ${progress}%`
                  : "Iniciando That Open (web-ifc)…"}
              </p>
              <p className="text-white/60">
                Motor open source para BIM na web
              </p>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
