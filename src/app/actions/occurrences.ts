"use server";

import { eq } from "drizzle-orm";
import { addDays, formatISO } from "date-fns";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  occurrenceEvents,
  occurrences,
  type OccurrenceStatus,
  type Priority,
} from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { dueDaysForPriority } from "@/lib/format";

function nextCode(buildingId: number) {
  const last = db
    .select({ code: occurrences.code })
    .from(occurrences)
    .where(eq(occurrences.buildingId, buildingId))
    .all();
  const max = last.reduce((acc, row) => {
    const n = Number(row.code.replace(/\D/g, ""));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `OC-${String(max + 1).padStart(4, "0")}`;
}

export async function createOccurrenceAction(formData: FormData) {
  const session = await requireSession();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const priority = String(formData.get("priority") ?? "media") as Priority;
  const systemId = Number(formData.get("systemId") || 0) || null;
  const mapX = Number(formData.get("mapX") || 0);
  const mapY = Number(formData.get("mapY") || 0);
  const mapZ = Number(formData.get("mapZ") || 0);

  if (!title) throw new Error("Título obrigatório");

  const dueAt = formatISO(addDays(new Date(), dueDaysForPriority(priority)), {
    representation: "date",
  });

  const row = db
    .insert(occurrences)
    .values({
      buildingId: session.buildingId,
      systemId,
      code: nextCode(session.buildingId),
      title,
      description,
      priority,
      status: "aberta",
      dueAt,
      authorId: session.id,
      mapX,
      mapY,
      mapZ,
    })
    .returning()
    .get();

  db.insert(occurrenceEvents)
    .values({
      occurrenceId: row.id,
      authorId: session.id,
      type: "criacao",
      note: "Ocorrência registrada no mapa",
    })
    .run();

  revalidatePath("/occurrences");
  revalidatePath("/map");
  revalidatePath("/dashboard");
  redirect(`/occurrences/${row.id}`);
}

export async function transitionOccurrenceAction(formData: FormData) {
  const session = await requireSession();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status")) as OccurrenceStatus;
  const note = String(formData.get("note") ?? "").trim() || null;

  const patch: { status: OccurrenceStatus; assigneeId?: number } = { status };
  if (status === "em_execucao" || status === "programada") {
    patch.assigneeId = session.id;
  }
  db.update(occurrences).set(patch).where(eq(occurrences.id, id)).run();

  db.insert(occurrenceEvents)
    .values({
      occurrenceId: id,
      authorId: session.id,
      type: "status",
      note: note ?? `Status: ${status}`,
    })
    .run();

  revalidatePath(`/occurrences/${id}`);
  revalidatePath("/occurrences");
  revalidatePath("/dashboard");
  redirect(`/occurrences/${id}`);
}

/**
 * Conclui a ocorrência com foto + texto e (opcionalmente) avisa o grupo no WhatsApp.
 * Princípio: o grupo recebe só o fechamento confirmado — não o histórico interno.
 */
export async function resolveAndNotifyAction(formData: FormData) {
  const session = await requireSession();
  const id = Number(formData.get("id"));
  const resolutionNote = String(formData.get("resolutionNote") ?? "").trim();
  const notifyGroup = formData.get("notifyGroup") === "on";
  const remoteJid =
    String(formData.get("remoteJid") ?? "").trim() ||
    process.env.EVOLUTION_DIGEST_JID ||
    "";

  const occ = db.select().from(occurrences).where(eq(occurrences.id, id)).get();
  if (!occ || occ.buildingId !== session.buildingId) {
    throw new Error("Ocorrência não encontrada");
  }
  if (!resolutionNote) throw new Error("Escreva o texto da resolução");

  let photoPath: string | null = occ.resolutionPhotoPath;
  const photo = formData.get("resolutionPhoto");
  if (photo instanceof File && photo.size > 0) {
    const { saveUploadFile } = await import("@/lib/uploads");
    photoPath = await saveUploadFile(photo);
  }

  const notifiedAt = notifyGroup
    ? formatISO(new Date(), { representation: "complete" })
    : occ.resolutionNotifiedAt;

  db.update(occurrences)
    .set({
      status: "concluida",
      resolutionNote,
      resolutionPhotoPath: photoPath,
      resolutionNotifiedAt: notifiedAt,
      assigneeId: session.id,
    })
    .where(eq(occurrences.id, id))
    .run();

  db.insert(occurrenceEvents)
    .values({
      occurrenceId: id,
      authorId: session.id,
      type: "resolucao",
      note: notifyGroup
        ? `Concluída e aviso ao grupo: ${resolutionNote}`
        : `Concluída: ${resolutionNote}`,
    })
    .run();

  let sent = false;
  if (notifyGroup && remoteJid) {
    const { evolutionSendText, isEvolutionConfigured } = await import(
      "@/lib/whatsapp/evolution"
    );
    if (isEvolutionConfigured()) {
      const text = [
        `*Prediza* · ${occ.code} *concluída*`,
        occ.title,
        "",
        resolutionNote,
        photoPath ? `(Foto do serviço no app Prediza)` : null,
        "",
        "_Atualização oficial — só o fechamento vai ao grupo._",
      ]
        .filter(Boolean)
        .join("\n");
      const res = await evolutionSendText({ number: remoteJid, text });
      sent = res.ok;
    }
  }

  revalidatePath(`/occurrences/${id}`);
  revalidatePath("/occurrences");
  revalidatePath("/dashboard");
  redirect(
    `/occurrences/${id}?resolved=1${notifyGroup ? (sent ? "&wa=1" : "&wa=0") : ""}`,
  );
}
