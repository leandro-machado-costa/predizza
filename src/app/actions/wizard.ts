"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { buildings, documents, maintenancePlans, systems } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { rebuildForecast } from "@/lib/forecast";
import {
  CRITICAL_SYSTEM_TEMPLATES,
  templateDates,
} from "@/lib/system-templates";

export async function runDeliveryWizardAction(formData: FormData) {
  const session = await requireSession();
  if (session.role !== "construtora" && session.role !== "sindico") {
    throw new Error("Sem permissão");
  }

  const createSystems = formData.get("createSystems") === "on";
  const createPlans = formData.get("createPlans") === "on";
  const docTitle = String(formData.get("docTitle") ?? "").trim();
  const docKind = String(formData.get("docKind") ?? "garantia");
  const docNotes = String(formData.get("docNotes") ?? "").trim() || null;

  if (docTitle) {
    db.insert(documents)
      .values({
        buildingId: session.buildingId,
        title: docTitle,
        kind: docKind,
        notes: docNotes,
        uploadedBy: session.id,
      })
      .run();
  }

  // documentos extras do checklist
  for (const kind of ["manual", "planta", "memorial"] as const) {
    const t = String(formData.get(`doc_${kind}`) ?? "").trim();
    if (!t) continue;
    db.insert(documents)
      .values({
        buildingId: session.buildingId,
        title: t,
        kind,
        notes: "Wizard de entrega",
        uploadedBy: session.id,
      })
      .run();
  }

  if (createSystems) {
    const existing = db
      .select()
      .from(systems)
      .where(eq(systems.buildingId, session.buildingId))
      .all();
    const cats = new Set(existing.map((s) => s.category));

    for (const tpl of CRITICAL_SYSTEM_TEMPLATES) {
      if (cats.has(tpl.category)) continue;
      const checked = formData.get(`sys_${tpl.category}`) === "on";
      if (!checked) continue;
      const dates = templateDates(tpl.periodicityMonths, tpl.warrantyMonths);
      const row = db
        .insert(systems)
        .values({
          buildingId: session.buildingId,
          name: tpl.name,
          category: tpl.category,
          locationLabel: tpl.locationLabel,
          specs: "Criado pelo wizard de entrega Prediza",
          warrantyUntil: dates.warrantyUntil,
          periodicityMonths: tpl.periodicityMonths,
          nextDueAt: dates.nextDueAt,
          estimatedCost: tpl.estimatedCost,
          mapX: (Math.random() - 0.5) * 8,
          mapY: 4 + Math.random() * 16,
          mapZ: (Math.random() - 0.5) * 4,
        })
        .returning()
        .get();

      if (createPlans) {
        db.insert(maintenancePlans)
          .values({
            buildingId: session.buildingId,
            systemId: row.id,
            title: `Plano preventivo — ${tpl.name}`,
            periodicityMonths: tpl.periodicityMonths,
            nextDueAt: dates.nextDueAt,
            estimatedCost: tpl.estimatedCost,
            notes: "Sugerido no wizard (alinhar à NBR 5674)",
          })
          .run();
      }
    }
  }

  db.update(buildings)
    .set({ onboardingDone: 1 })
    .where(eq(buildings.id, session.buildingId))
    .run();

  await rebuildForecast(session.buildingId);
  revalidatePath("/delivery");
  revalidatePath("/dashboard");
  revalidatePath("/systems");
  revalidatePath("/forecast");
  redirect("/delivery?wizard=ok");
}
