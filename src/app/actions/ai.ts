"use server";

import { and, eq, inArray } from "drizzle-orm";
import { addDays, formatISO } from "date-fns";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  aiSuggestions,
  maintenancePlans,
  occurrenceEvents,
  occurrences,
  systems,
  type Priority,
} from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { buildAssemblyText, runTriage } from "@/lib/ai/triage";
import { dueDaysForPriority } from "@/lib/format";
import { rebuildForecast } from "@/lib/forecast";
import { CRITICAL_SYSTEM_TEMPLATES, templateDates } from "@/lib/system-templates";

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

export async function triageTextAction(formData: FormData) {
  const session = await requireSession();
  let text = String(formData.get("text") ?? "").trim();
  const photo = formData.get("photo");
  let imagePath: string | null = null;

  if (photo instanceof File && photo.size > 0) {
    const { saveUploadFile } = await import("@/lib/uploads");
    imagePath = await saveUploadFile(photo);
    const caption = String(formData.get("caption") ?? "").trim();
    if (!text && caption) text = caption;
    if (!text) text = `Foto de manutenção: ${photo.name || "imagem"}`;
    if (caption && text !== caption) text = `${caption}\n\n${text}`;
  }

  if (!text) throw new Error("Informe texto ou foto");

  const sys = db
    .select()
    .from(systems)
    .where(eq(systems.buildingId, session.buildingId))
    .all();
  const open = db
    .select()
    .from(occurrences)
    .where(
      and(
        eq(occurrences.buildingId, session.buildingId),
        inArray(occurrences.status, ["aberta", "programada", "em_execucao"]),
      ),
    )
    .all();

  const result = await runTriage({
    text,
    systems: sys.map((s) => ({ id: s.id, name: s.name, category: s.category })),
    openOccurrences: open.map((o) => ({
      id: o.id,
      code: o.code,
      title: o.title,
      description: o.description,
      systemId: o.systemId,
      status: o.status,
    })),
  });

  const row = db
    .insert(aiSuggestions)
    .values({
      buildingId: session.buildingId,
      kind: "triage",
      inputText: text,
      resultJson: JSON.stringify({ ...result, hasPhoto: Boolean(imagePath) }),
      status: "pending",
      imagePath,
      createdBy: session.id,
    })
    .returning()
    .get();

  redirect(`/ai/triage?sid=${row.id}`);
}

export async function confirmTriageAction(formData: FormData) {
  const session = await requireSession();
  const suggestionId = Number(formData.get("suggestionId"));
  const action = String(formData.get("action"));
  const sug = db
    .select()
    .from(aiSuggestions)
    .where(eq(aiSuggestions.id, suggestionId))
    .get();
  if (!sug) throw new Error("Sugestão não encontrada");
  const result = JSON.parse(sug.resultJson) as Awaited<ReturnType<typeof runTriage>>;

  if (action === "ignore") {
    db.update(aiSuggestions)
      .set({ status: "ignored" })
      .where(eq(aiSuggestions.id, suggestionId))
      .run();
    redirect("/ai/triage");
  }

  if (action === "link" && result.matchedOccurrenceId) {
    db.insert(occurrenceEvents)
      .values({
        occurrenceId: result.matchedOccurrenceId,
        authorId: session.id,
        type: "comentario",
        note: `Relato adicional (IA/WhatsApp): ${sug.inputText}`,
      })
      .run();
    db.update(aiSuggestions)
      .set({ status: "linked" })
      .where(eq(aiSuggestions.id, suggestionId))
      .run();
    redirect(`/occurrences/${result.matchedOccurrenceId}`);
  }

  // create new
  const priority = (String(formData.get("priority") || result.priority) as Priority);
  const title = String(formData.get("title") || result.title);
  const description = String(formData.get("description") || result.description);
  const systemId = Number(formData.get("systemId") || result.suggestedSystemId || 0) || null;
  const dueAt = formatISO(addDays(new Date(), dueDaysForPriority(priority)), {
    representation: "date",
  });

  const occ = db
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
      source: "ai",
    })
    .returning()
    .get();

  db.insert(occurrenceEvents)
    .values({
      occurrenceId: occ.id,
      authorId: session.id,
      type: "criacao",
      note: `Criada via triagem IA (${result.engine})`,
    })
    .run();

  db.update(aiSuggestions)
    .set({ status: "accepted" })
    .where(eq(aiSuggestions.id, suggestionId))
    .run();

  revalidatePath("/occurrences");
  revalidatePath("/dashboard");
  redirect(`/occurrences/${occ.id}`);
}

export async function suggestPlansAction() {
  const session = await requireSession();
  const sys = db
    .select()
    .from(systems)
    .where(eq(systems.buildingId, session.buildingId))
    .all();
  const plans = db
    .select()
    .from(maintenancePlans)
    .where(eq(maintenancePlans.buildingId, session.buildingId))
    .all();
  const planned = new Set(plans.map((p) => p.systemId));

  let created = 0;
  for (const s of sys) {
    if (planned.has(s.id)) continue;
    const tpl =
      CRITICAL_SYSTEM_TEMPLATES.find((t) => t.category === s.category) ||
      CRITICAL_SYSTEM_TEMPLATES[0];
    const dates = templateDates(
      s.periodicityMonths ?? tpl.periodicityMonths,
      12,
    );
    db.insert(maintenancePlans)
      .values({
        buildingId: session.buildingId,
        systemId: s.id,
        title: `Plano assistido IA — ${s.name}`,
        periodicityMonths: s.periodicityMonths ?? tpl.periodicityMonths,
        nextDueAt: s.nextDueAt ?? dates.nextDueAt,
        estimatedCost: s.estimatedCost ?? tpl.estimatedCost,
        notes: "Sugerido automaticamente a partir da ficha do sistema",
      })
      .run();
    created += 1;
  }
  await rebuildForecast(session.buildingId);
  revalidatePath("/maintenance");
  revalidatePath("/ai/plans");
  redirect(`/ai/plans?created=${created}`);
}

export async function generateAssemblyAction() {
  const session = await requireSession();
  // generation happens on the page via shared helper; store snapshot
  const { forecastItems } = await import("@/db/schema");
  const items = db
    .select()
    .from(forecastItems)
    .where(eq(forecastItems.buildingId, session.buildingId))
    .all();
  const open = db
    .select()
    .from(occurrences)
    .where(
      and(
        eq(occurrences.buildingId, session.buildingId),
        inArray(occurrences.status, ["aberta", "programada", "em_execucao"]),
      ),
    )
    .all();

  const actNow = items.filter((i) => i.urgency === "agir_agora");
  const next12 = items.filter(
    (i) => i.urgency === "12_meses" || i.urgency === "agir_agora",
  );
  const years3 = items.filter((i) => i.urgency === "3_anos");
  const sum = (rows: typeof items) =>
    rows.reduce((a, r) => a + (r.estimatedCost ?? 0), 0);

  const text = buildAssemblyText({
    buildingName: session.buildingName,
    actNow: actNow.map((i) => ({
      title: i.title,
      dueAt: i.dueAt,
      estimatedCost: i.estimatedCost ?? 0,
    })),
    next12: next12.map((i) => ({
      title: i.title,
      dueAt: i.dueAt,
      estimatedCost: i.estimatedCost ?? 0,
    })),
    years3: years3.map((i) => ({
      title: i.title,
      dueAt: i.dueAt,
      estimatedCost: i.estimatedCost ?? 0,
    })),
    openOcc: open.map((o) => ({
      code: o.code,
      title: o.title,
      priority: o.priority,
    })),
    totals: {
      actNow: sum(actNow),
      next12: sum(next12),
      years3: sum(years3),
    },
  });

  const row = db
    .insert(aiSuggestions)
    .values({
      buildingId: session.buildingId,
      kind: "assembly",
      inputText: null,
      resultJson: JSON.stringify({ text }),
      status: "ready",
      createdBy: session.id,
    })
    .returning()
    .get();

  redirect(`/forecast?export=${row.id}`);
}
