"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { works } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { rebuildForecast } from "@/lib/forecast";

export async function createWorkAction(formData: FormData) {
  const session = await requireSession();
  const title = String(formData.get("title") ?? "").trim();
  const kind = String(formData.get("kind") ?? "reforma");
  const systemId = Number(formData.get("systemId") || 0) || null;
  const startAt = String(formData.get("startAt") ?? "") || null;
  const endAt = String(formData.get("endAt") ?? "") || null;
  const estimatedCost = Number(formData.get("estimatedCost") || 0);
  const responsible = String(formData.get("responsible") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!title) throw new Error("Título obrigatório");

  db.insert(works)
    .values({
      buildingId: session.buildingId,
      systemId,
      title,
      kind,
      status: "planejada",
      startAt,
      endAt,
      estimatedCost,
      responsible,
      notes,
    })
    .run();

  await rebuildForecast(session.buildingId);
  revalidatePath("/works");
  revalidatePath("/forecast");
  revalidatePath("/dashboard");
  redirect("/works");
}
