import { and, eq, inArray } from "drizzle-orm";
import { addDays, formatISO } from "date-fns";
import { db } from "@/db";
import {
  aiSuggestions,
  buildings,
  occurrenceEvents,
  occurrences,
  systems,
  whatsappEvents,
} from "@/db/schema";
import { runTriage, type TriageResult } from "@/lib/ai/triage";
import { dueDaysForPriority } from "@/lib/format";
import {
  buildTriageReply,
  evolutionSendText,
  getEvolutionConfig,
  parseConfirmCommand,
  parseInboundPayload,
  resolveBuildingSlug,
  shouldProcessText,
  type ParsedInbound,
} from "@/lib/whatsapp/evolution";

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

function findBuilding(slug: string) {
  return db.select().from(buildings).where(eq(buildings.slug, slug)).get();
}

function getTriageForEvent(buildingId: number, eventId: number): TriageResult | null {
  const sug = db
    .select()
    .from(aiSuggestions)
    .where(eq(aiSuggestions.buildingId, buildingId))
    .all()
    .reverse()
    .find((s) => {
      try {
        return JSON.parse(s.resultJson).whatsappEventId === eventId;
      } catch {
        return false;
      }
    });
  if (!sug) return null;
  try {
    return JSON.parse(sug.resultJson) as TriageResult;
  } catch {
    return null;
  }
}

export async function resolveWhatsAppEvent(opts: {
  eventId: number;
  action: "create" | "link" | "ignore";
  authorId?: number | null;
  replyToJid?: string | null;
  instanceName?: string | null;
}) {
  const event = db
    .select()
    .from(whatsappEvents)
    .where(eq(whatsappEvents.id, opts.eventId))
    .get();
  if (!event) return { ok: false as const, error: "Evento não encontrado" };
  if (event.status !== "pending" && event.status !== "ignored") {
    // allow re-confirm only from pending; ignored can stay
  }

  const replyJid = opts.replyToJid || event.remoteJid;
  const instance = opts.instanceName || event.instanceName || undefined;

  if (opts.action === "ignore") {
    db.update(whatsappEvents)
      .set({ status: "ignored" })
      .where(eq(whatsappEvents.id, opts.eventId))
      .run();
    if (replyJid) {
      await evolutionSendText({
        number: replyJid,
        text: `Predizza · #${opts.eventId} ignorado.`,
        instance,
      });
    }
    return { ok: true as const, status: "ignored" as const };
  }

  if (opts.action === "link") {
    if (!event.matchedOccurrenceId) {
      return { ok: false as const, error: "Sem ocorrência para vincular" };
    }
    db.insert(occurrenceEvents)
      .values({
        occurrenceId: event.matchedOccurrenceId,
        authorId: opts.authorId ?? null,
        type: "comentario",
        note: `WhatsApp (${event.authorName}): ${event.body}`,
      })
      .run();
    db.update(whatsappEvents)
      .set({ status: "linked" })
      .where(eq(whatsappEvents.id, opts.eventId))
      .run();
    const occ = db
      .select()
      .from(occurrences)
      .where(eq(occurrences.id, event.matchedOccurrenceId))
      .get();
    if (replyJid) {
      await evolutionSendText({
        number: replyJid,
        text: `Predizza · vinculado a ${occ?.code ?? event.matchedOccurrenceId}.`,
        instance,
      });
    }
    return {
      ok: true as const,
      status: "linked" as const,
      occurrenceId: event.matchedOccurrenceId,
    };
  }

  const triage = getTriageForEvent(event.buildingId, event.id);
  const dueAt = formatISO(
    addDays(
      new Date(),
      dueDaysForPriority(triage?.priority || "media"),
    ),
    { representation: "date" },
  );

  const occ = db
    .insert(occurrences)
    .values({
      buildingId: event.buildingId,
      systemId: triage?.suggestedSystemId ?? null,
      code: nextCode(event.buildingId),
      title: triage?.title || event.body.slice(0, 80),
      description: triage?.description || event.body,
      priority: triage?.priority || "media",
      status: "aberta",
      dueAt,
      authorId: opts.authorId ?? null,
      source: "whatsapp",
    })
    .returning()
    .get();

  db.insert(occurrenceEvents)
    .values({
      occurrenceId: occ.id,
      authorId: opts.authorId ?? null,
      type: "criacao",
      note: `Confirmada via WhatsApp (${event.authorName})`,
    })
    .run();

  db.update(whatsappEvents)
    .set({ status: "created", matchedOccurrenceId: occ.id })
    .where(eq(whatsappEvents.id, opts.eventId))
    .run();

  if (replyJid) {
    await evolutionSendText({
      number: replyJid,
      text: `Predizza · ocorrência *${occ.code}* aberta: ${occ.title}`,
      instance,
    });
  }

  return {
    ok: true as const,
    status: "created" as const,
    occurrenceId: occ.id,
    code: occ.code,
  };
}

async function processConfirm(
  inbound: ParsedInbound,
  buildingId: number,
) {
  const cmd = parseConfirmCommand(inbound.body);
  if (!cmd) return null;

  let event =
    cmd.eventId != null
      ? db
          .select()
          .from(whatsappEvents)
          .where(eq(whatsappEvents.id, cmd.eventId))
          .get()
      : null;

  // Sem id: última triagem pendente deste edifício (preferindo mesmo chat)
  if (!event) {
    const pending = db
      .select()
      .from(whatsappEvents)
      .where(eq(whatsappEvents.buildingId, buildingId))
      .all()
      .filter((e) => e.status === "pending")
      .reverse();
    event =
      (inbound.remoteJid
        ? pending.find((e) => e.remoteJid === inbound.remoteJid)
        : null) || pending[0] || null;
  }

  if (!event || event.buildingId !== buildingId) {
    return {
      ok: false as const,
      error: "Nenhuma triagem pendente para confirmar",
      replied: false,
    };
  }
  const result = await resolveWhatsAppEvent({
    eventId: event.id,
    action: cmd.action,
    replyToJid: inbound.remoteJid,
    instanceName: inbound.instance,
  });
  return { ...result, replied: true, confirm: true as const };
}

export async function processWhatsAppInbound(
  raw: unknown,
  opts?: { bypassMention?: boolean; skipReply?: boolean },
) {
  const cfg = getEvolutionConfig();
  const inbound = parseInboundPayload(raw);
  if (!inbound) {
    return { ok: false as const, error: "payload não reconhecido", status: 400 };
  }

  if (inbound.fromMe) {
    return { ok: true as const, skipped: "fromMe" as const };
  }

  if (!inbound.body) {
    return { ok: true as const, skipped: "empty" as const };
  }

  const slug =
    inbound.buildingSlug ||
    resolveBuildingSlug(inbound.instance) ||
    cfg.defaultBuildingSlug;

  if (!slug) {
    return {
      ok: false as const,
      error: "building slug não resolvido (EVOLUTION_BUILDING_SLUG / instance)",
      status: 400,
    };
  }

  const building = findBuilding(slug);
  if (!building) {
    return { ok: false as const, error: `edifício ${slug} não encontrado`, status: 404 };
  }

  // Comando de confirmação
  const confirmResult = await processConfirm(inbound, building.id);
  if (confirmResult) {
    return confirmResult;
  }

  const requireMention =
    opts?.bypassMention || inbound.kind === "simple"
      ? false
      : cfg.requireMention;
  if (!shouldProcessText(inbound.body, requireMention)) {
    return { ok: true as const, skipped: "no_mention" as const };
  }

  // Dedupe por messageId Evolution
  if (inbound.messageId) {
    const existing = db
      .select()
      .from(whatsappEvents)
      .where(eq(whatsappEvents.messageId, inbound.messageId))
      .get();
    if (existing) {
      return {
        ok: true as const,
        deduped: true,
        eventId: existing.id,
        status: existing.status,
      };
    }
  }

  // Dedupe por texto recente
  const recent = db
    .select()
    .from(whatsappEvents)
    .where(eq(whatsappEvents.buildingId, building.id))
    .all()
    .slice(-30);
  const dup = recent.find(
    (e) =>
      e.body.trim().toLowerCase() === inbound.body.toLowerCase() &&
      (e.status === "pending" || e.status === "created" || e.status === "linked"),
  );
  if (dup) {
    if (inbound.remoteJid && !opts?.skipReply) {
      await evolutionSendText({
        number: inbound.remoteJid,
        text: `Predizza · já existe triagem #${dup.id} (${dup.status}). Responda *Confirmar* ou *Ignorar*.`,
        instance: inbound.instance || undefined,
      });
    }
    return {
      ok: true as const,
      deduped: true,
      eventId: dup.id,
      status: dup.status,
    };
  }

  const sys = db
    .select()
    .from(systems)
    .where(eq(systems.buildingId, building.id))
    .all();
  const open = db
    .select()
    .from(occurrences)
    .where(
      and(
        eq(occurrences.buildingId, building.id),
        inArray(occurrences.status, ["aberta", "programada", "em_execucao"]),
      ),
    )
    .all();

  const triage = await runTriage({
    text: inbound.body,
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

  const status = triage.classification === "ignorar" ? "ignored" : "pending";

  const row = db
    .insert(whatsappEvents)
    .values({
      buildingId: building.id,
      groupName: inbound.groupName,
      authorName: inbound.authorName,
      body: inbound.body,
      classification: triage.classification,
      matchedOccurrenceId: triage.matchedOccurrenceId,
      status,
      remoteJid: inbound.remoteJid,
      messageId: inbound.messageId,
      instanceName: inbound.instance,
    })
    .returning()
    .get();

  db.insert(aiSuggestions)
    .values({
      buildingId: building.id,
      kind: "whatsapp_triage",
      inputText: inbound.body,
      resultJson: JSON.stringify({
        ...triage,
        whatsappEventId: row.id,
        remoteJid: inbound.remoteJid,
      }),
      status: status === "ignored" ? "ignored" : "pending",
    })
    .run();

  let replySent = false;
  if (inbound.remoteJid && !opts?.skipReply) {
    const text =
      status === "ignored"
        ? `Predizza · mensagem classificada como ruído (não gravada).\n_${triage.rationale}_`
        : buildTriageReply({
            eventId: row.id,
            classification: triage.classification,
            title: triage.title,
            priority: triage.priority,
            matchedCode: triage.matchedOccurrenceCode,
            rationale: triage.rationale,
          });
    const sent = await evolutionSendText({
      number: inbound.remoteJid,
      text,
      instance: inbound.instance || undefined,
    });
    replySent = sent.ok;
  }

  return {
    ok: true as const,
    eventId: row.id,
    classification: triage.classification,
    status,
    replySent,
  };
}
