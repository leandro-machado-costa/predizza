"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { processWhatsAppInbound, resolveWhatsAppEvent } from "@/lib/whatsapp/inbound";

export async function simulateWhatsAppMessageAction(formData: FormData) {
  const session = await requireSession();
  const body = String(formData.get("body") ?? "").trim();
  const authorName = String(formData.get("authorName") ?? "Morador").trim();
  const groupName = String(formData.get("groupName") ?? "Grupo do condomínio");

  const result = await processWhatsAppInbound(
    {
      buildingSlug: session.buildingSlug,
      body,
      authorName,
      groupName,
    },
    { bypassMention: true, skipReply: true },
  );

  revalidatePath("/whatsapp");
  if (result.ok && "eventId" in result && result.eventId) {
    redirect(`/whatsapp?event=${result.eventId}`);
  }
  redirect("/whatsapp");
}

export async function resolveWhatsAppEventAction(formData: FormData) {
  await requireSession();
  const eventId = Number(formData.get("eventId"));
  const action = String(formData.get("action")) as "create" | "link" | "ignore";

  const result = await resolveWhatsAppEvent({
    eventId,
    action,
  });

  revalidatePath("/whatsapp");
  revalidatePath("/occurrences");
  revalidatePath("/dashboard");

  if (result.ok && result.status === "created" && "occurrenceId" in result) {
    redirect(`/occurrences/${result.occurrenceId}`);
  }
  if (result.ok && result.status === "linked" && "occurrenceId" in result) {
    redirect(`/occurrences/${result.occurrenceId}`);
  }
  redirect("/whatsapp");
}
