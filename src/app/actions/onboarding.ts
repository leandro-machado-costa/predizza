"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { buildings, maintenancePlans, systems } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { rebuildForecast } from "@/lib/forecast";
import {
  CRITICAL_SYSTEM_TEMPLATES,
  templateDates,
} from "@/lib/system-templates";

export async function completeSindicoOnboardingAction(formData: FormData) {
  const session = await requireSession();
  const skip = formData.get("skip") === "1";

  if (!skip) {
    const existing = db
      .select()
      .from(systems)
      .where(eq(systems.buildingId, session.buildingId))
      .all();
    if (existing.length === 0) {
      for (const tpl of CRITICAL_SYSTEM_TEMPLATES) {
        const dates = templateDates(tpl.periodicityMonths, tpl.warrantyMonths);
        const row = db
          .insert(systems)
          .values({
            buildingId: session.buildingId,
            name: tpl.name,
            category: tpl.category,
            locationLabel: tpl.locationLabel,
            specs: "Onboarding rápido da síndica (15 min)",
            warrantyUntil: dates.warrantyUntil,
            periodicityMonths: tpl.periodicityMonths,
            nextDueAt: dates.nextDueAt,
            estimatedCost: tpl.estimatedCost,
          })
          .returning()
          .get();
        db.insert(maintenancePlans)
          .values({
            buildingId: session.buildingId,
            systemId: row.id,
            title: `Preventiva — ${tpl.name}`,
            periodicityMonths: tpl.periodicityMonths,
            nextDueAt: dates.nextDueAt,
            estimatedCost: tpl.estimatedCost,
          })
          .run();
      }
      await rebuildForecast(session.buildingId);
    }
  }

  db.update(buildings)
    .set({ onboardingDone: 1 })
    .where(eq(buildings.id, session.buildingId))
    .run();

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
