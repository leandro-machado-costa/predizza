"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { quoteRequests } from "@/db/schema";
import { requireSession } from "@/lib/auth";

export async function createQuoteRequestAction(formData: FormData) {
  const session = await requireSession();
  const systemId = Number(formData.get("systemId")) || null;
  const title = String(formData.get("title") ?? "").trim();
  const scope = String(formData.get("scope") ?? "").trim();
  const supplierName = String(formData.get("supplierName") ?? "").trim() || null;
  const amountRaw = formData.get("amount");
  const amount =
    amountRaw === "" || amountRaw == null ? null : Number(amountRaw);
  const validUntil = String(formData.get("validUntil") ?? "").trim() || null;
  if (!title) throw new Error("Título obrigatório");

  const row = db
    .insert(quoteRequests)
    .values({
      buildingId: session.buildingId,
      systemId,
      title,
      scope: scope || null,
      status: amount != null ? "recebido" : "enviado",
      supplierName,
      amount: Number.isFinite(amount as number) ? amount : null,
      validUntil,
      createdBy: session.id,
    })
    .returning()
    .get();

  revalidatePath(systemId ? `/systems/${systemId}` : "/systems");
  redirect(`/systems/${systemId}?quote=${row.id}`);
}

export async function updateQuoteOfferAction(formData: FormData) {
  const session = await requireSession();
  const id = Number(formData.get("id"));
  const systemId = Number(formData.get("systemId"));
  const row = db.select().from(quoteRequests).where(eq(quoteRequests.id, id)).get();
  if (!row || row.buildingId !== session.buildingId) {
    throw new Error("Pedido não encontrado");
  }

  const supplierName = String(formData.get("supplierName") ?? "").trim() || null;
  const amount = Number(formData.get("amount"));
  const validUntil = String(formData.get("validUntil") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "recebido");

  db.update(quoteRequests)
    .set({
      supplierName,
      amount: Number.isFinite(amount) ? amount : null,
      validUntil,
      status,
    })
    .where(eq(quoteRequests.id, id))
    .run();

  revalidatePath(`/systems/${systemId}`);
  redirect(`/systems/${systemId}?quote=${id}`);
}
