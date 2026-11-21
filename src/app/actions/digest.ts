"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { evolutionSendText, isEvolutionConfigured } from "@/lib/whatsapp/evolution";

export async function sendDigestWhatsAppAction(formData: FormData) {
  await requireSession();
  const text = String(formData.get("text") ?? "").trim();
  const number =
    String(formData.get("number") ?? "").trim() ||
    process.env.EVOLUTION_DIGEST_JID ||
    "";

  if (!text) throw new Error("Texto vazio");
  if (!isEvolutionConfigured() || !number) {
    redirect("/digest?sent=0");
  }

  const result = await evolutionSendText({ number, text });
  revalidatePath("/digest");
  redirect(result.ok ? "/digest?sent=1" : "/digest?sent=0");
}
