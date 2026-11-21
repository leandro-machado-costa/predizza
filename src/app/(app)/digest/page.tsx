import { and, eq, inArray } from "drizzle-orm";
import { format, startOfWeek, addDays, parseISO, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { sendDigestWhatsAppAction } from "@/app/actions/digest";
import { CopyButton } from "@/components/CopyButton";
import {
  PageHeader,
  Card,
  StatCard,
  Field,
  PrimaryButton,
  inputClass,
} from "@/components/ui";
import { db } from "@/db";
import { forecastItems, occurrences, systems, whatsappEvents } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { formatBRL, formatDate } from "@/lib/format";
import { findRepeatedPatterns } from "@/lib/patterns";
import { isEvolutionConfigured } from "@/lib/whatsapp/evolution";

export default async function DigestPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const sp = await searchParams;
  const isConstrutora = session.role === "construtora";

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekLabel = `${format(weekStart, "d MMM", { locale: ptBR })} – ${format(
    addDays(weekStart, 6),
    "d MMM",
    { locale: ptBR },
  )}`;

  const items = db
    .select()
    .from(forecastItems)
    .where(eq(forecastItems.buildingId, session.buildingId))
    .all();
  const actNow = items.filter((i) => i.urgency === "agir_agora");
  const sum = actNow.reduce((a, r) => a + (r.estimatedCost ?? 0), 0);

  const openOcc = db
    .select()
    .from(occurrences)
    .where(
      and(
        eq(occurrences.buildingId, session.buildingId),
        inArray(occurrences.status, ["aberta", "programada", "em_execucao"]),
      ),
    )
    .all();

  const allOcc = db
    .select()
    .from(occurrences)
    .where(eq(occurrences.buildingId, session.buildingId))
    .all();

  const sys = db
    .select()
    .from(systems)
    .where(eq(systems.buildingId, session.buildingId))
    .all();
  const sysNames = Object.fromEntries(sys.map((s) => [s.id, s.name]));
  const patterns = findRepeatedPatterns(
    allOcc.map((o) => ({
      id: o.id,
      code: o.code,
      title: o.title,
      systemId: o.systemId,
      status: o.status,
    })),
    sysNames,
  );

  const waPending = db
    .select()
    .from(whatsappEvents)
    .where(
      and(
        eq(whatsappEvents.buildingId, session.buildingId),
        eq(whatsappEvents.status, "pending"),
      ),
    )
    .all();

  const now = new Date();
  const warrantySoon = sys.filter((s) => {
    if (!s.warrantyUntil) return false;
    const w = parseISO(s.warrantyUntil);
    return isBefore(now, w) && isBefore(w, addDays(now, 90));
  });
  const overdueOpen = openOcc.filter(
    (o) => o.dueAt && isBefore(parseISO(o.dueAt), now),
  );
  const internalCost = allOcc.reduce((a, o) => a + (o.internalCost ?? 0), 0);

  const digestText = `Predizza · ${session.buildingName}
Semana ${weekLabel}

• Reservar agora: ${formatBRL(sum)} (${actNow.length} itens)
• Ocorrências abertas: ${openOcc.length}
${openOcc
  .slice(0, 5)
  .map((o) => `  – ${o.code} ${o.title} (até ${formatDate(o.dueAt)})`)
  .join("\n") || "  – nenhuma"}
• WhatsApp aguardando triagem: ${waPending.length}
${patterns.length ? `• Padrões repetidos: ${patterns.length}` : ""}

Abra o app para confirmar e montar a pauta de assembleia.`;

  const slaText = isConstrutora
    ? `\n\nSLA / garantia (construtora)
• Garantias a vencer em 90 dias: ${warrantySoon.length}
${warrantySoon.map((s) => `  – ${s.name} até ${formatDate(s.warrantyUntil)}`).join("\n") || "  – nenhuma"}
• OCs em atraso: ${overdueOpen.length}
• Custo interno acumulado: ${formatBRL(internalCost)}`
    : "";

  const fullText = digestText + slaText;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resumo semanal"
        subtitle={`Alertas e prioridades · semana ${weekLabel}`}
      />

      {sp.sent === "1" ? (
        <Card className="bg-accent-container/40">
          <p className="text-sm">Digest enviado via Evolution.</p>
        </Card>
      ) : null}
      {sp.sent === "0" ? (
        <Card>
          <p className="text-sm text-muted">
            Não foi possível enviar. Configure Evolution e o número (ou
            EVOLUTION_DIGEST_JID).
          </p>
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Agir agora"
          value={formatBRL(sum)}
          hint={`${actNow.length} itens`}
          tone="warn"
        />
        <StatCard
          label="Ocorrências abertas"
          value={String(openOcc.length)}
          hint="programadas e em execução"
        />
        <StatCard
          label="WhatsApp pendente"
          value={String(waPending.length)}
          hint="aguardando confirmação"
          tone={waPending.length ? "warn" : "ok"}
        />
      </div>

      {patterns.length ? (
        <Card>
          <h2 className="mb-2 text-base font-semibold">Alertas de padrão</h2>
          <ul className="space-y-2 text-sm">
            {patterns.slice(0, 6).map((p) => (
              <li key={p.key} className="border-b border-line pb-2">
                <p className="font-medium">{p.label}</p>
                <p className="text-muted">{p.codes.join(", ")}</p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {isConstrutora ? (
        <Card>
          <h2 className="mb-2 text-base font-semibold">SLA / garantia</h2>
          <ul className="space-y-1 text-sm text-muted">
            <li>Garantias a vencer (90 dias): {warrantySoon.length}</li>
            <li>Ocorrências em atraso: {overdueOpen.length}</li>
            <li>Custo interno acumulado: {formatBRL(internalCost)}</li>
          </ul>
        </Card>
      ) : null}

      <Card>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold">Texto para envio</h2>
          <CopyButton text={fullText} label="Copiar" />
        </div>
        <pre className="whitespace-pre-wrap rounded-[var(--radius-md)] bg-surface-2 p-4 text-sm leading-relaxed">
          {fullText}
        </pre>
        {isEvolutionConfigured() ? (
          <form action={sendDigestWhatsAppAction} className="mt-4 space-y-3">
            <input type="hidden" name="text" value={fullText} />
            <Field label="Número / JID WhatsApp (DDI+DDD)">
              <input
                className={inputClass}
                name="number"
                placeholder={process.env.EVOLUTION_DIGEST_JID || "5511999999999"}
                defaultValue={process.env.EVOLUTION_DIGEST_JID || ""}
              />
            </Field>
            <PrimaryButton type="submit">Enviar via Evolution</PrimaryButton>
          </form>
        ) : (
          <p className="mt-3 text-sm text-muted">
            Evolution não configurada — use copiar ou suba o docker compose.
          </p>
        )}
      </Card>
    </div>
  );
}
