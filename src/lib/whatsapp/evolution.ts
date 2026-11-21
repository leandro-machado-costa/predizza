/**
 * Cliente mínimo da Evolution API (WhatsApp).
 * Docs: POST /message/sendText/{instance} + webhook messages.upsert
 */

export type EvolutionConfig = {
  baseUrl: string;
  apiKey: string;
  instance: string;
  webhookSecret: string | null;
  /** Se true, só processa mensagens com @predizza / predizza / #ocorrencia */
  requireMention: boolean;
  defaultBuildingSlug: string | null;
  /** JSON opcional: { "minha-instancia": "palmeiras" } */
  instanceSlugMap: Record<string, string>;
};

export type ParsedInbound = {
  kind: "evolution" | "simple";
  event: string | null;
  instance: string | null;
  fromMe: boolean;
  remoteJid: string | null;
  messageId: string | null;
  authorName: string;
  groupName: string | null;
  body: string;
  buildingSlug: string | null;
  isGroup: boolean;
};

export function getEvolutionConfig(): EvolutionConfig {
  let instanceSlugMap: Record<string, string> = {};
  try {
    const raw = process.env.EVOLUTION_INSTANCE_MAP;
    if (raw) instanceSlugMap = JSON.parse(raw) as Record<string, string>;
  } catch {
    instanceSlugMap = {};
  }

  return {
    baseUrl: (process.env.EVOLUTION_API_URL ?? "").replace(/\/$/, ""),
    apiKey: process.env.EVOLUTION_API_KEY ?? "",
    instance: process.env.EVOLUTION_INSTANCE ?? "",
    webhookSecret:
      process.env.EVOLUTION_WEBHOOK_SECRET ??
      process.env.WHATSAPP_WEBHOOK_SECRET ??
      null,
    requireMention: process.env.EVOLUTION_REQUIRE_MENTION === "1",
    defaultBuildingSlug: process.env.EVOLUTION_BUILDING_SLUG ?? null,
    instanceSlugMap,
  };
}

export function isEvolutionConfigured() {
  const c = getEvolutionConfig();
  return Boolean(c.baseUrl && c.apiKey && c.instance);
}

export function resolveBuildingSlug(instance: string | null): string | null {
  const c = getEvolutionConfig();
  if (instance && c.instanceSlugMap[instance]) return c.instanceSlugMap[instance];
  if (instance) return instance;
  return c.defaultBuildingSlug;
}

function extractText(message: Record<string, unknown> | undefined): string {
  if (!message) return "";
  if (typeof message.conversation === "string") return message.conversation;
  const ext = message.extendedTextMessage as { text?: string } | undefined;
  if (ext?.text) return ext.text;
  const img = message.imageMessage as { caption?: string } | undefined;
  if (img?.caption) return img.caption;
  const doc = message.documentMessage as { caption?: string } | undefined;
  if (doc?.caption) return doc.caption;
  const buttons = message.buttonsResponseMessage as
    | { selectedDisplayText?: string; selectedButtonId?: string }
    | undefined;
  if (buttons?.selectedDisplayText || buttons?.selectedButtonId) {
    return buttons.selectedDisplayText || buttons.selectedButtonId || "";
  }
  const list = message.listResponseMessage as
    | { title?: string; singleSelectReply?: { selectedRowId?: string } }
    | undefined;
  if (list?.singleSelectReply?.selectedRowId) {
    return list.singleSelectReply.selectedRowId;
  }
  return "";
}

/** Detecta payload Evolution (messages.upsert) ou JSON simples da Predizza */
export function parseInboundPayload(raw: unknown): ParsedInbound | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;

  // Formato simples Predizza
  if (typeof p.body === "string" && (p.buildingSlug || p.instance)) {
    return {
      kind: "simple",
      event: null,
      instance: typeof p.instance === "string" ? p.instance : null,
      fromMe: false,
      remoteJid: typeof p.remoteJid === "string" ? p.remoteJid : null,
      messageId: typeof p.externalId === "string" ? p.externalId : null,
      authorName:
        typeof p.authorName === "string" ? p.authorName : "WhatsApp",
      groupName: typeof p.groupName === "string" ? p.groupName : null,
      body: p.body.trim(),
      buildingSlug:
        typeof p.buildingSlug === "string" ? p.buildingSlug : null,
      isGroup: Boolean(
        typeof p.remoteJid === "string" && p.remoteJid.endsWith("@g.us"),
      ),
    };
  }

  const event = String(p.event ?? p.Event ?? "").toLowerCase();
  const data = (p.data ?? p) as Record<string, unknown>;
  const key = (data.key ?? {}) as Record<string, unknown>;
  const message = data.message as Record<string, unknown> | undefined;

  // Evolution messages.upsert (também aceita path sem event se tiver key+message)
  const looksEvolution =
    event.includes("messages.upsert") ||
    event.includes("messages_upsert") ||
    (key.remoteJid && message);

  if (!looksEvolution) return null;

  const remoteJid = String(key.remoteJid ?? "");
  const body = extractText(message).trim();
  const instance =
    typeof p.instance === "string"
      ? p.instance
      : typeof p.instanceName === "string"
        ? p.instanceName
        : null;

  return {
    kind: "evolution",
    event: event || "messages.upsert",
    instance,
    fromMe: Boolean(key.fromMe),
    remoteJid: remoteJid || null,
    messageId: typeof key.id === "string" ? key.id : null,
    authorName:
      typeof data.pushName === "string" && data.pushName
        ? data.pushName
        : "WhatsApp",
    groupName: remoteJid.endsWith("@g.us") ? remoteJid : null,
    body,
    buildingSlug: null,
    isGroup: remoteJid.endsWith("@g.us"),
  };
}

export function shouldProcessText(body: string, requireMention: boolean) {
  if (!body.trim()) return false;
  if (!requireMention) return true;
  const n = body.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  return (
    n.includes("@predizza") ||
    n.includes("predizza") ||
    n.includes("@prediza") ||
    n.includes("prediza") ||
    n.includes("#ocorrencia") ||
    /^(confirmar|vincular|ignorar|criar|ok)(\s+\d+)?$/i.test(body.trim())
  );
}

/**
 * Comandos no chat — basta "Confirmar" / "Vincular" / "Ignorar"
 * (opcionalmente com id: "Confirmar 12"). Sem id → usa a última triagem pendente.
 */
export function parseConfirmCommand(
  body: string,
): { action: "create" | "link" | "ignore"; eventId: number | null } | null {
  const t = body.trim();
  const withId =
    /^(?:predizz?a\s+)?(confirmar|criar|ok|1|vincular|2|ignorar|x|3)\s*[#:]?\s*(\d+)\s*$/i.exec(
      t,
    );
  const bare =
    /^(?:predizz?a\s+)?(confirmar|criar|ok|vincular|ignorar|sim|nao|não)\s*!?\s*$/i.exec(
      t,
    );
  const m = withId || bare;
  if (!m) return null;
  const verb = m[1].toLowerCase();
  const eventId = withId && m[2] ? Number(m[2]) : null;
  if (["confirmar", "criar", "ok", "1", "sim"].includes(verb)) {
    return { action: "create", eventId };
  }
  if (["vincular", "2"].includes(verb)) {
    return { action: "link", eventId };
  }
  if (["ignorar", "x", "3", "nao", "não"].includes(verb)) {
    return { action: "ignore", eventId };
  }
  return null;
}

export async function evolutionSendText(opts: {
  number: string;
  text: string;
  instance?: string;
}) {
  const c = getEvolutionConfig();
  if (!c.baseUrl || !c.apiKey) {
    return { ok: false as const, error: "Evolution não configurada" };
  }
  const instance = opts.instance || c.instance;
  if (!instance) {
    return { ok: false as const, error: "Instância Evolution ausente" };
  }

  const url = `${c.baseUrl}/message/sendText/${encodeURIComponent(instance)}`;
  const headers = {
    "Content-Type": "application/json",
    apikey: c.apiKey,
  };

  // Evolution v2 usa `text`; v1 usa `textMessage.text`
  const payloads = [
    { number: opts.number, text: opts.text },
    { number: opts.number, textMessage: { text: opts.text } },
  ];

  let lastErr = "send failed";
  for (const payload of payloads) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) return { ok: true as const, data };
      lastErr = JSON.stringify(data) || res.statusText;
      // se 404/400 no formato, tenta o outro
      if (res.status >= 500) break;
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
    }
  }
  return { ok: false as const, error: lastErr };
}

export function buildTriageReply(opts: {
  eventId: number;
  classification: string;
  title: string;
  priority: string;
  matchedCode: string | null;
  rationale: string;
}) {
  const lines = [
    `*Predizza* · triagem #${opts.eventId}`,
    "",
    `Classificação: *${opts.classification}*`,
    `Sugestão: ${opts.title}`,
    `Prioridade: ${opts.priority}`,
  ];
  if (opts.matchedCode) {
    lines.push(`Possível duplicata: ${opts.matchedCode}`);
  }
  lines.push("", opts.rationale, "", "Responda apenas:");
  lines.push("• *Confirmar* — abrir ocorrência");
  if (opts.matchedCode) {
    lines.push(`• *Vincular* — ligar à ${opts.matchedCode}`);
  }
  lines.push("• *Ignorar* — descartar");
  return lines.join("\n");
}
