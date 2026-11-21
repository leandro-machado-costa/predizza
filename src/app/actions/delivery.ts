"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addMonths, formatISO } from "date-fns";
import { db } from "@/db";
import { documents, systems } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { rebuildForecast } from "@/lib/forecast";

const CATEGORY_DEFAULTS: Record<
  string,
  { periodicityMonths: number; estimatedCost: number }
> = {
  elevadores: { periodicityMonths: 1, estimatedCost: 2500 },
  bombas: { periodicityMonths: 3, estimatedCost: 1500 },
  fachada: { periodicityMonths: 36, estimatedCost: 120000 },
  cobertura: { periodicityMonths: 24, estimatedCost: 40000 },
  eletrica: { periodicityMonths: 12, estimatedCost: 4000 },
  hidraulica: { periodicityMonths: 6, estimatedCost: 3000 },
  spda: { periodicityMonths: 12, estimatedCost: 4200 },
  reservatorio: { periodicityMonths: 6, estimatedCost: 3500 },
  outro: { periodicityMonths: 12, estimatedCost: 2000 },
};

export async function deliveryAction(formData: FormData) {
  const session = await requireSession();
  if (session.role !== "construtora" && session.role !== "sindico") {
    throw new Error("Sem permissão");
  }

  const title = String(formData.get("title") ?? "").trim();
  const kind = String(formData.get("kind") ?? "manual").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const createSystem = formData.get("createSystem") === "on";
  const systemName = String(formData.get("systemName") ?? "").trim();
  const category = String(formData.get("category") ?? "outro").trim();

  if (!title) throw new Error("Título obrigatório");

  let systemId: number | null = null;
  if (createSystem && systemName) {
    const defaults = CATEGORY_DEFAULTS[category] ?? CATEGORY_DEFAULTS.outro;
    const nextDueAt = formatISO(addMonths(new Date(), defaults.periodicityMonths), {
      representation: "date",
    });
    const warrantyUntil = formatISO(addMonths(new Date(), 24), {
      representation: "date",
    });
    const inserted = db
      .insert(systems)
      .values({
        buildingId: session.buildingId,
        name: systemName,
        category,
        locationLabel: String(formData.get("locationLabel") ?? "") || null,
        specs: notes,
        warrantyUntil,
        periodicityMonths: defaults.periodicityMonths,
        nextDueAt,
        estimatedCost: defaults.estimatedCost,
        mapX: (Math.random() - 0.5) * 4,
        mapY: Math.random() * 16,
        mapZ: (Math.random() - 0.5) * 4,
      })
      .returning()
      .get();
    systemId = inserted.id;
  }

  db.insert(documents)
    .values({
      buildingId: session.buildingId,
      systemId,
      title,
      kind,
      notes,
      uploadedBy: session.id,
    })
    .run();

  await rebuildForecast(session.buildingId);
  revalidatePath("/delivery");
  revalidatePath("/systems");
  revalidatePath("/dashboard");
  redirect("/delivery");
}
