"use server";

import { eq } from "drizzle-orm";
import { addMonths, formatISO, parseISO } from "date-fns";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { forecastItems, maintenancePlans, systems, works } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { rebuildForecast } from "@/lib/forecast";

function pushDate(iso: string | null | undefined, months: number) {
  if (!iso) return formatISO(addMonths(new Date(), months), { representation: "date" });
  return formatISO(addMonths(parseISO(iso), months), { representation: "date" });
}

/** Adia intervenção de sistema / obra / item de forecast e recalcula previsão */
export async function deferWorkAction(formData: FormData) {
  const session = await requireSession();
  const months = Math.max(1, Number(formData.get("months") || 6));
  const kind = String(formData.get("kind") ?? "forecast");
  const id = Number(formData.get("id"));

  if (kind === "system") {
    const row = db.select().from(systems).where(eq(systems.id, id)).get();
    if (row && row.buildingId === session.buildingId) {
      db.update(systems)
        .set({ nextDueAt: pushDate(row.nextDueAt, months) })
        .where(eq(systems.id, id))
        .run();
      const plans = db
        .select()
        .from(maintenancePlans)
        .where(eq(maintenancePlans.systemId, id))
        .all();
      for (const p of plans) {
        db.update(maintenancePlans)
          .set({ nextDueAt: pushDate(p.nextDueAt, months) })
          .where(eq(maintenancePlans.id, p.id))
          .run();
      }
    }
  } else if (kind === "work") {
    const row = db.select().from(works).where(eq(works.id, id)).get();
    if (row && row.buildingId === session.buildingId) {
      db.update(works)
        .set({
          startAt: pushDate(row.startAt, months),
          endAt: pushDate(row.endAt, months),
          notes: `${row.notes ?? ""}\n[Adiado ${months} mês(es) via Prediza]`.trim(),
        })
        .where(eq(works.id, id))
        .run();
    }
  } else {
    const row = db.select().from(forecastItems).where(eq(forecastItems.id, id)).get();
    if (row && row.buildingId === session.buildingId && row.systemId) {
      const sys = db.select().from(systems).where(eq(systems.id, row.systemId)).get();
      if (sys) {
        db.update(systems)
          .set({ nextDueAt: pushDate(sys.nextDueAt ?? row.dueAt, months) })
          .where(eq(systems.id, sys.id))
          .run();
      }
    }
  }

  await rebuildForecast(session.buildingId);
  revalidatePath("/forecast");
  revalidatePath("/dashboard");
  revalidatePath("/systems");
  revalidatePath("/works");
  redirect("/forecast?deferred=1");
}
