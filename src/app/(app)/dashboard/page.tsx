import { and, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { isBefore, parseISO } from "date-fns";
import { db } from "@/db";
import {
  buildings,
  forecastItems,
  occurrences,
  systems,
  whatsappEvents,
} from "@/db/schema";
import { OnboardingBanner } from "@/components/OnboardingBanner";
import {
  PageHeader,
  StatCard,
  Card,
  TextLink,
  PrimaryButton,
} from "@/components/ui";
import { getSession } from "@/lib/auth";
import { formatBRL, formatDate } from "@/lib/format";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const building = db
    .select()
    .from(buildings)
    .where(eq(buildings.id, session.buildingId))
    .get();

  const systemCount = db
    .select()
    .from(systems)
    .where(eq(systems.buildingId, session.buildingId))
    .all().length;

  const items = db
    .select()
    .from(forecastItems)
    .where(eq(forecastItems.buildingId, session.buildingId))
    .all();

  const now12 = items.filter(
    (i) => i.urgency === "12_meses" || i.urgency === "agir_agora",
  );
  const years3 = items.filter((i) => i.urgency === "3_anos");
  const actNow = items.filter((i) => i.urgency === "agir_agora");

  const sum = (rows: typeof items) =>
    rows.reduce((acc, r) => acc + (r.estimatedCost ?? 0), 0);

  const reserve12 = sum(now12);
  const riskNow = sum(actNow);

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

  const now = new Date();
  const overdue = openOcc.filter(
    (o) => o.dueAt && isBefore(parseISO(o.dueAt), now),
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

  const councilBlurb = [
    `Prediza · ${session.buildingName}`,
    `Reserva sugerida (12 meses): ${formatBRL(reserve12)}`,
    `Prioridade imediata: ${formatBRL(riskNow)} (${actNow.length} itens)`,
    `Ocorrências abertas: ${openOcc.length}`,
    "",
    "Detalhes e PDF: abra Assembleia na Prediza.",
  ].join("\n");

  return (
    <div>
      <PageHeader
        title="Kit da assembleia"
        subtitle="Quanto reservar, o que não pode esperar e o que confirmar esta semana — sem planilha."
      />

      {building && !building.onboardingDone ? (
        <OnboardingBanner
          buildingName={session.buildingName}
          hasSystems={systemCount > 0}
        />
      ) : null}

      <Card className="mb-5 border-accent/20 bg-gradient-to-br from-accent-container/50 to-card sm:mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          Linguagem de assembleia
        </p>
        <p className="display mt-2 text-3xl sm:text-4xl">{formatBRL(reserve12)}</p>
        <p className="mt-1 text-sm text-muted">
          para reservar nos próximos 12 meses
          {riskNow > 0 ? (
            <>
              {" "}
              · <span className="font-semibold text-accent-2">{formatBRL(riskNow)}</span>{" "}
              em risco se adiar (~3 meses)
            </>
          ) : null}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/forecast">
            <PrimaryButton type="button">Montar pauta</PrimaryButton>
          </Link>
          <Link
            href="/forecast/print"
            className="inline-flex min-h-12 items-center rounded-[var(--radius-md)] border border-line bg-card/80 px-5 text-sm font-semibold text-accent"
          >
            PDF / conselho
          </Link>
          <Link
            href="/digest"
            className="inline-flex min-h-12 items-center rounded-[var(--radius-md)] border border-line bg-card/80 px-5 text-sm font-semibold text-accent"
          >
            Enviar resumo
          </Link>
        </div>
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer font-medium text-accent">
            Texto pronto para o conselho
          </summary>
          <pre className="mt-2 whitespace-pre-wrap rounded-[var(--radius-md)] bg-surface-2/80 p-3 text-xs leading-relaxed text-muted">
            {councilBlurb}
          </pre>
        </details>
      </Card>

      <div className="stagger -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0">
        <div className="min-w-[78%] shrink-0 sm:min-w-0">
          <StatCard
            label="Reservar (12 meses)"
            value={formatBRL(reserve12)}
            hint={`${now12.length} itens no orçamento`}
            tone="ok"
          />
        </div>
        <div className="min-w-[78%] shrink-0 sm:min-w-0">
          <StatCard
            label="Risco se adiar"
            value={formatBRL(riskNow)}
            hint={`${actNow.length} prioridades · ${overdue.length} atrasadas`}
            tone="warn"
          />
        </div>
        <div className="min-w-[78%] shrink-0 sm:min-w-0">
          <StatCard
            label="Horizonte 3 anos"
            value={formatBRL(sum(years3))}
            hint={`${years3.length} reformas / reservas`}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Link href="/whatsapp" className="block">
          <Card
            className={`h-full transition hover:border-accent/30 ${
              waPending.length ? "border-accent-2/30 bg-accent-2-container/30" : ""
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Esta semana · WhatsApp
            </p>
            <p className="display mt-1 text-2xl">{waPending.length}</p>
            <p className="mt-1 text-sm text-muted">
              {waPending.length
                ? "à confirmar — só grava se você autorizar"
                : "fila limpa"}
            </p>
          </Card>
        </Link>
        <Link href="/occurrences" className="block">
          <Card className="h-full transition hover:border-accent/30">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Ocorrências abertas
            </p>
            <p className="display mt-1 text-2xl">{openOcc.length}</p>
            <p className="mt-1 text-sm text-muted">
              {overdue.length ? `${overdue.length} em atraso` : "dentro do prazo"}
            </p>
          </Card>
        </Link>
        <Link href="/ai/triage" className="block">
          <Card className="h-full transition hover:border-accent/30">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Relato do morador
            </p>
            <p className="mt-2 text-sm font-semibold text-accent">Abrir triagem →</p>
            <p className="mt-1 text-sm text-muted">Foto ou texto vira tarefa com prazo</p>
          </Card>
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:mt-8 lg:grid-cols-2 lg:gap-6">
        <Card>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold sm:text-lg">
              Não pode esperar
            </h2>
            <TextLink href="/forecast">Ver pauta</TextLink>
          </div>
          <ul className="divide-y divide-line/50">
            {actNow.slice(0, 5).map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.title}</p>
                  <p className="text-sm text-muted">até {formatDate(item.dueAt)}</p>
                </div>
                <p className="shrink-0 text-sm font-semibold">
                  {formatBRL(item.estimatedCost)}
                </p>
              </li>
            ))}
            {!actNow.length ? (
              <li className="py-2 text-sm text-muted">
                Nada urgente no horizonte de 3 meses.
              </li>
            ) : null}
          </ul>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold sm:text-lg">Em andamento</h2>
            <TextLink href="/occurrences">Ver todas</TextLink>
          </div>
          <ul className="divide-y divide-line/50">
            {openOcc.slice(0, 5).map((o) => (
              <li key={o.id}>
                <Link
                  href={`/occurrences/${o.id}`}
                  className="-mx-1 flex items-start justify-between gap-3 rounded-[var(--radius-sm)] px-1 py-3 transition hover:bg-surface-2"
                >
                  <div className="min-w-0">
                    <p className="font-medium leading-snug">{o.title}</p>
                    <p className="text-sm text-muted">
                      {o.code} · prazo {formatDate(o.dueAt)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-[var(--radius-sm)] bg-accent-2-container px-2.5 py-1 text-[11px] font-semibold uppercase text-accent-2">
                    {o.priority}
                  </span>
                </Link>
              </li>
            ))}
            {!openOcc.length ? (
              <li className="py-2 text-sm text-muted">Nenhuma ocorrência aberta.</li>
            ) : null}
          </ul>
        </Card>
      </div>
    </div>
  );
}
