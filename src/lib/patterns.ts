/** Detecta ocorrências repetidas (mesmo sistema ou título parecido). */

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s: string) {
  return new Set(normalize(s).split(" ").filter((t) => t.length > 2));
}

function jaccard(a: Set<string>, b: Set<string>) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  return inter / (a.size + b.size - inter);
}

export type PatternOcc = {
  id: number;
  code: string;
  title: string;
  systemId: number | null;
  status: string;
};

export type PatternAlert = {
  key: string;
  label: string;
  count: number;
  codes: string[];
  systemId: number | null;
};

export function findRepeatedPatterns(
  occs: PatternOcc[],
  systemNames: Record<number, string> = {},
): PatternAlert[] {
  const bySystem = new Map<number, PatternOcc[]>();
  for (const o of occs) {
    if (!o.systemId) continue;
    const list = bySystem.get(o.systemId) ?? [];
    list.push(o);
    bySystem.set(o.systemId, list);
  }

  const alerts: PatternAlert[] = [];

  for (const [systemId, list] of bySystem) {
    if (list.length < 2) continue;
    alerts.push({
      key: `sys-${systemId}`,
      label: `Sistema ${systemNames[systemId] ?? `#${systemId}`} com ${list.length} ocorrências`,
      count: list.length,
      codes: list.map((o) => o.code),
      systemId,
    });
  }

  // pares de título similar (mesmo sem sistema)
  const used = new Set<number>();
  for (let i = 0; i < occs.length; i++) {
    if (used.has(occs[i].id)) continue;
    const group = [occs[i]];
    const ti = tokens(occs[i].title);
    for (let j = i + 1; j < occs.length; j++) {
      if (used.has(occs[j].id)) continue;
      if (jaccard(ti, tokens(occs[j].title)) >= 0.45) {
        group.push(occs[j]);
        used.add(occs[j].id);
      }
    }
    if (group.length >= 2) {
      used.add(occs[i].id);
      alerts.push({
        key: `title-${occs[i].id}`,
        label: `Títulos parecidos: “${occs[i].title.slice(0, 40)}…”`,
        count: group.length,
        codes: group.map((o) => o.code),
        systemId: occs[i].systemId,
      });
    }
  }

  // dedupe por codes set
  const seen = new Set<string>();
  return alerts.filter((a) => {
    const k = a.codes.slice().sort().join(",");
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
