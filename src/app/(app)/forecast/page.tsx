import Link from "next/link";
import { eq } from "drizzle-orm";
import { generateAssemblyAction } from "@/app/actions/ai";
import { deferWorkAction } from "@/app/actions/defer";
import { CopyButton } from "@/components/CopyButton";
import { db } from "@/db";
import { aiSuggestions, forecastItems } from "@/db/schema";
import {
  PageHeader,
  Card,
  StatCard,
  PrimaryButton,
  SecondaryButton,
  inputClass,
} from "@/components/ui";
import { getSession } from "@/lib/auth";
import { formatBRL, formatDate } from "@/lib/format";

export default async function ForecastPage({
  searchParams,
}: {
  searchParams: Promise<{ export?: string; deferred?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const sp = await searchParams;

  const items = db
    .select()
    .from(forecastItems)
    .where(eq(forecastItems.buildingId, session.buildingId))
    .all()
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));

  const buckets = {
    agir_agora: items.filter((i) => i.urgency === "agir_agora"),
    "12_meses": items.filter((i) => i.urgency === "12_meses"),
    "3_anos": items.filter((i) => i.urgency === "3_anos"),
  };

  const sum = (rows: typeof items) =>
    rows.reduce((acc, r) => acc + (r.estimatedCost ?? 0), 0);

  const exportRow = sp.export
    ? db
        .select()
        .from(aiSuggestions)
        .where(eq(aiSuggestions.id, Number(sp.export)))
        .get()
    : null;
  const exportText = exportRow
    ? (JSON.parse(exportRow.resultJson) as { text: string }).text
    : null;

  const summaryWhatsApp = [
    `*Prediza · ${session.buildingName}*`,
    `Reservar agora: ${formatBRL(sum(buckets.agir_agora))}`,
    `12 meses: ${formatBRL(sum([...buckets.agir_agora, ...buckets["12_meses"]]))}`,
    `3 anos: ${formatBRL(sum(buckets["3_anos"]))}`,
  ].join("\n");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Pauta de assembleia"
        subtitle="Em R$: o que reservar, o que não pode esperar e o risco se adiar — pronto para o conselho."
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/forecast/print"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-outline/40 px-5 text-sm font-semibold text-accent"
            >
              PDF / imprimir
            </Link>
            <form action={generateAssemblyAction}>
              <PrimaryButton type="submit">Gerar texto IA</PrimaryButton>
            </form>
          </div>
        }
      />

      {sp.deferred === "1" ? (
        <Card className="bg-accent-container/40">
          <p className="text-sm">Obra/intervenção adiada e previsão recalculada.</p>
        </Card>
      ) : null}

      {exportText ? (
        <Card>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="display text-xl">Export assembleia</h2>
            <CopyButton text={exportText} label="Copiar WhatsApp" />
          </div>
          <pre className="whitespace-pre-wrap rounded-[var(--radius-md)] bg-surface-2 p-4 text-sm leading-relaxed">
            {exportText}
          </pre>
        </Card>
      ) : (
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            Resumo rápido para colar no grupo do conselho.
          </p>
          <CopyButton text={summaryWhatsApp} label="Copiar resumo WhatsApp" />
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Agir agora (≈3 meses)"
          value={formatBRL(sum(buckets.agir_agora))}
          hint={`${buckets.agir_agora.length} itens`}
          tone="warn"
        />
        <StatCard
          label="Próximos 12 meses"
          value={formatBRL(sum(buckets["12_meses"]))}
          hint={`${buckets["12_meses"].length} itens`}
          tone="ok"
        />
        <StatCard
          label="Horizonte 3 anos"
          value={formatBRL(sum(buckets["3_anos"]))}
          hint={`${buckets["3_anos"].length} itens`}
        />
      </div>

      <Card>
        <h2 className="display mb-2 text-xl">Resumo em linguagem simples</h2>
        <p className="text-muted">
          Nos próximos 12 meses, o condomínio precisa reservar cerca de{" "}
          <strong>
            {formatBRL(sum([...buckets.agir_agora, ...buckets["12_meses"]]))}
          </strong>
          . Há{" "}
          <strong>{buckets.agir_agora.length}</strong> itens para agir agora e{" "}
          <strong>{buckets["3_anos"].length}</strong> reformas/manutenções no
          horizonte de três anos, totalizando{" "}
          <strong>{formatBRL(sum(buckets["3_anos"]))}</strong>.
        </p>
      </Card>

      {(
        [
          ["Agir agora", buckets.agir_agora],
          ["12 meses", buckets["12_meses"]],
          ["3 anos", buckets["3_anos"]],
        ] as const
      ).map(([title, rows]) => (
        <Card key={title}>
          <h2 className="display mb-4 text-xl">{title}</h2>
          <ul className="space-y-3">
            {rows.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-3"
              >
                <div className="min-w-0">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted">
                    {formatDate(item.dueAt)} · origem {item.source}
                  </p>
                  {item.systemId ? (
                    <form action={deferWorkAction} className="mt-2 flex flex-wrap items-end gap-2">
                      <input type="hidden" name="kind" value="forecast" />
                      <input type="hidden" name="id" value={item.id} />
                      <select
                        className={`${inputClass} !min-h-10 w-auto`}
                        name="months"
                        defaultValue="6"
                      >
                        <option value="3">Adiar 3 meses</option>
                        <option value="6">Adiar 6 meses</option>
                        <option value="12">Adiar 12 meses</option>
                      </select>
                      <SecondaryButton type="submit">Aplicar cenário</SecondaryButton>
                    </form>
                  ) : null}
                </div>
                <p className="font-medium">{formatBRL(item.estimatedCost)}</p>
              </li>
            ))}
            {!rows.length ? (
              <li className="text-sm text-muted">Nenhum item neste horizonte.</li>
            ) : null}
          </ul>
        </Card>
      ))}
    </div>
  );
}
