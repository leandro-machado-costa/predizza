"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { systems } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { rebuildForecast } from "@/lib/forecast";

export async function upsertSystemAction(formData: FormData) {
  const session = await requireSession();
  const id = Number(formData.get("id") || 0);
  const payload = {
    buildingId: session.buildingId,
    name: String(formData.get("name") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    locationLabel: String(formData.get("locationLabel") ?? "").trim() || null,
    specs: String(formData.get("specs") ?? "").trim() || null,
    warrantyUntil: String(formData.get("warrantyUntil") ?? "") || null,
    periodicityMonths: Number(formData.get("periodicityMonths") || 12),
    nextDueAt: String(formData.get("nextDueAt") ?? "") || null,
    estimatedCost: Number(formData.get("estimatedCost") || 0),
    mapX: Number(formData.get("mapX") || 0),
    mapY: Number(formData.get("mapY") || 0),
    mapZ: Number(formData.get("mapZ") || 0),
  };

  if (!payload.name || !payload.category) {
    throw new Error("Nome e categoria são obrigatórios");
  }

  if (id) {
    db.update(systems).set(payload).where(eq(systems.id, id)).run();
  } else {
    db.insert(systems).values(payload).run();
  }

  await rebuildForecast(session.buildingId);
  revalidatePath("/systems");
  revalidatePath("/dashboard");
  revalidatePath("/forecast");
  redirect("/systems");
}
