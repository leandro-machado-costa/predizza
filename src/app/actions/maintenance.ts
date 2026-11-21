"use server";

import { eq } from "drizzle-orm";
import { addMonths, formatISO } from "date-fns";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { maintenancePlans, maintenanceRuns } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { rebuildForecast } from "@/lib/forecast";

export async function createPlanAction(formData: FormData) {
  const session = await requireSession();
  const systemId = Number(formData.get("systemId"));
  const title = String(formData.get("title") ?? "").trim();
  const periodicityMonths = Number(formData.get("periodicityMonths") || 6);
  const estimatedCost = Number(formData.get("estimatedCost") || 0);
  const nextDueAt = String(formData.get("nextDueAt") ?? "") || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!title || !systemId) throw new Error("Dados incompletos");

  db.insert(maintenancePlans)
    .values({
      buildingId: session.buildingId,
      systemId,
      title,
      periodicityMonths,
      nextDueAt,
      estimatedCost,
      notes,
    })
    .run();

  await rebuildForecast(session.buildingId);
  revalidatePath("/maintenance");
  revalidatePath("/forecast");
  revalidatePath("/dashboard");
  redirect("/maintenance");
}

export async function runPlanAction(formData: FormData) {
  const session = await requireSession();
  const planId = Number(formData.get("planId"));
  const cost = Number(formData.get("cost") || 0);
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const plan = db
    .select()
    .from(maintenancePlans)
    .where(eq(maintenancePlans.id, planId))
    .get();
  if (!plan) throw new Error("Plano não encontrado");

  db.insert(maintenanceRuns)
    .values({
      planId,
      cost,
      notes,
      executedBy: session.id,
    })
    .run();

  db.update(maintenancePlans)
    .set({
      nextDueAt: formatISO(addMonths(new Date(), plan.periodicityMonths), {
        representation: "date",
      }),
    })
    .where(eq(maintenancePlans.id, planId))
    .run();

  await rebuildForecast(session.buildingId);
  revalidatePath("/maintenance");
  revalidatePath("/forecast");
  revalidatePath("/dashboard");
  redirect("/maintenance");
}
