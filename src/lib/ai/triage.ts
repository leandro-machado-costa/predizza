import type { Priority } from "@/db/schema";

export type TriageInput = {
  text: string;
  systems: { id: number; name: string; category: string }[];
  openOccurrences: {
    id: number;
    code: string;
    title: string;
    description: string | null;
    systemId: number | null;
    status: string;
  }[];
};

export type TriageResult = {
  isMaintenance: boolean;
  title: string;
  description: string;
  priority: Priority;
  suggestedSystemId: number | null;
  suggestedSystemName: string | null;
  classification: "nova" | "duplicata" | "ignorar";
  matchedOccurrenceId: number | null;
  matchedOccurrenceCode: string | null;
  confidence: number;
  rationale: string;
  engine: "heuristic" | "openai";
};

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

const KEYWORDS: { keys: string[]; category?: string; priority: Priority }[] = [
  { keys: ["infiltra", "vazando", "pingando", "umidade", "goteira"], category: "fachada", priority: "alta" },
  { keys: ["bomba", "agua", "reservatorio", "pressao"], category: "bombas", priority: "alta" },
  { keys: ["elevador", "elev.", "cabine"], category: "elevadores", priority: "alta" },
  { keys: ["raio", "spda", "para-raio"], category: "spda", priority: "media" },
  { keys: ["eletrica", "curto", "disjuntor", "luz"], category: "eletrica", priority: "media" },
  { keys: ["incendio", "extintor", "alarme"], priority: "urgente" },
  { keys: ["porta", "fechadura", "interfone"], priority: "baixa" },
];

const NOISE = ["festa", "churrasco", "boleto", "reuniao", "feliz", "parabens", "vendedor"];

export function heuristicTriage(input: TriageInput): TriageResult {
  const text = normalize(input.text || "");
  if (!text.trim()) {
    return {
      isMaintenance: false,
      title: "",
      description: "",
      priority: "media",
      suggestedSystemId: null,
      suggestedSystemName: null,
      classification: "ignorar",
      matchedOccurrenceId: null,
      matchedOccurrenceCode: null,
      confidence: 0.2,
      rationale: "Texto vazio",
      engine: "heuristic",
    };
  }

  if (NOISE.some((n) => text.includes(n)) && !KEYWORDS.some((k) => k.keys.some((x) => text.includes(x)))) {
    return {
      isMaintenance: false,
      title: input.text.slice(0, 80),
      description: input.text,
      priority: "baixa",
      suggestedSystemId: null,
      suggestedSystemName: null,
      classification: "ignorar",
      matchedOccurrenceId: null,
      matchedOccurrenceCode: null,
      confidence: 0.7,
      rationale: "Parece mensagem social/administrativa, não manutenção",
      engine: "heuristic",
    };
  }

  let priority: Priority = "media";
  let category: string | undefined;
  for (const rule of KEYWORDS) {
    if (rule.keys.some((k) => text.includes(k))) {
      priority = rule.priority;
      category = rule.category;
      break;
    }
  }

  const system =
    input.systems.find((s) => category && s.category === category) ||
    input.systems.find((s) => text.includes(normalize(s.name))) ||
    null;

  // dedupe: open occurrence with overlapping tokens
  const tokens = text.split(/\W+/).filter((t) => t.length > 3);
  let best: TriageInput["openOccurrences"][0] | null = null;
  let bestScore = 0;
  for (const oc of input.openOccurrences) {
    if (!["aberta", "programada", "em_execucao"].includes(oc.status)) continue;
    const hay = normalize(`${oc.title} ${oc.description ?? ""}`);
    const score = tokens.filter((t) => hay.includes(t)).length;
    const sameSystem = system && oc.systemId === system.id ? 2 : 0;
    const total = score + sameSystem;
    if (total > bestScore) {
      bestScore = total;
      best = oc;
    }
  }

  const isDup = bestScore >= 3 && best;
  const title =
    input.text.trim().slice(0, 90) ||
    (system ? `Problema em ${system.name}` : "Ocorrência relatada");

  return {
    isMaintenance: true,
    title,
    description: `Relato: ${input.text.trim()}\n\n(Descrição técnica sugerida pela Predizza — revisar antes de salvar.)`,
    priority,
    suggestedSystemId: system?.id ?? null,
    suggestedSystemName: system?.name ?? null,
    classification: isDup ? "duplicata" : "nova",
    matchedOccurrenceId: isDup ? best!.id : null,
    matchedOccurrenceCode: isDup ? best!.code : null,
    confidence: isDup ? 0.75 : 0.65,
    rationale: isDup
      ? `Parece a mesma ocorrência ${best!.code} (sobreposição de termos/sistema)`
      : system
        ? `Sugestão pelo sistema ${system.name} e palavras-chave`
        : "Manutenção genérica; sistema não identificado com certeza",
    engine: "heuristic",
  };
}

/** Se OPENAI_API_KEY existir, tenta LLM; senão heuristic. */
export async function runTriage(input: TriageInput): Promise<TriageResult> {
  const base = heuristicTriage(input);
  const key = process.env.OPENAI_API_KEY;
  if (!key) return base;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Você tria relatos de manutenção predial. Responda JSON com: isMaintenance(bool), title, description, priority(baixa|media|alta|urgente), suggestedSystemId(number|null), classification(nova|duplicata|ignorar), matchedOccurrenceId(number|null), rationale, confidence(0-1).",
          },
          {
            role: "user",
            content: JSON.stringify({
              text: input.text,
              systems: input.systems,
              openOccurrences: input.openOccurrences,
              heuristicHint: base,
            }),
          },
        ],
      }),
    });
    if (!res.ok) return base;
    const data = await res.json();
    const raw = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
    const system =
      input.systems.find((s) => s.id === raw.suggestedSystemId) ||
      input.systems.find((s) => s.id === base.suggestedSystemId);
    return {
      isMaintenance: Boolean(raw.isMaintenance ?? base.isMaintenance),
      title: String(raw.title || base.title),
      description: String(raw.description || base.description),
      priority: (raw.priority as Priority) || base.priority,
      suggestedSystemId: system?.id ?? null,
      suggestedSystemName: system?.name ?? null,
      classification: raw.classification || base.classification,
      matchedOccurrenceId: raw.matchedOccurrenceId ?? base.matchedOccurrenceId,
      matchedOccurrenceCode:
        input.openOccurrences.find((o) => o.id === raw.matchedOccurrenceId)?.code ??
        base.matchedOccurrenceCode,
      confidence: Number(raw.confidence ?? base.confidence),
      rationale: String(raw.rationale || base.rationale),
      engine: "openai",
    };
  } catch {
    return base;
  }
}

export function buildAssemblyText(input: {
  buildingName: string;
  actNow: { title: string; dueAt: string; estimatedCost: number }[];
  next12: { title: string; dueAt: string; estimatedCost: number }[];
  years3: { title: string; dueAt: string; estimatedCost: number }[];
  openOcc: { code: string; title: string; priority: string }[];
  totals: { actNow: number; next12: number; years3: number };
}) {
  const brl = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

  const lines = [
    `*Pauta Predizza — ${input.buildingName}*`,
    "",
    `*Agir agora:* ${brl(input.totals.actNow)} (${input.actNow.length} itens)`,
    ...input.actNow.slice(0, 8).map((i) => `• ${i.title} — até ${i.dueAt} — ${brl(i.estimatedCost)}`),
    "",
    `*Próximos 12 meses:* ${brl(input.totals.next12)} (${input.next12.length} itens)`,
    ...input.next12.slice(0, 8).map((i) => `• ${i.title} — ${i.dueAt} — ${brl(i.estimatedCost)}`),
    "",
    `*Horizonte 3 anos:* ${brl(input.totals.years3)}`,
    "",
    `*Ocorrências abertas:* ${input.openOcc.length}`,
    ...input.openOcc.slice(0, 6).map((o) => `• ${o.code} — ${o.title} (${o.priority})`),
    "",
    "_Gerado pela Predizza — revisar antes da assembleia._",
  ];
  return lines.join("\n");
}
