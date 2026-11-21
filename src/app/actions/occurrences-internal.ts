"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { occurrences } from "@/db/schema";
import { requireSession } from "@/lib/auth";

export async function updateInternalFieldsAction(formData: FormData) {
  const session = await requireSession();
  if (session.role !== "construtora") {
    throw new Error("Apenas construtora");
  }
  const id = Number(formData.get("id"));
  db.update(occurrences)
    .set({
      internalRootCause: String(formData.get("internalRootCause") ?? "") || null,
      internalCost: Number(formData.get("internalCost") || 0) || null,
      internalNotes: String(formData.get("internalNotes") ?? "") || null,
    })
    .where(eq(occurrences.id, id))
    .run();
  revalidatePath(`/occurrences/${id}`);
  redirect(`/occurrences/${id}`);
}
