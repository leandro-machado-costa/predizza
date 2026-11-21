import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { documents, occurrences, quoteRequests, systems } from "@/db/schema";
import { createQuoteRequestAction } from "@/app/actions/quotes";
import { upsertSystemAction } from "@/app/actions/systems";
import { CopyButton } from "@/components/CopyButton";
import {
  PageHeader,
  Card,
  Field,
  PrimaryButton,
  inputClass,
  TextLink,
} from "@/components/ui";
import { getSession } from "@/lib/auth";
import { formatBRL, formatDate } from "@/lib/format";

export default async function SystemDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ quote?: string }>;
}) {
  const session = await getSession();
  const { id } = await params;
  const sp = await searchParams;
  const system = db
    .select()
    .from(systems)
    .where(eq(systems.id, Number(id)))
    .get();
  if (!system) notFound();

  const docs = db
    .select()
    .from(documents)
    .where(eq(documents.systemId, system.id))
    .all();
  const occs = db
    .select()
    .from(occurrences)
    .where(eq(occurrences.systemId, system.id))
    .all();
  const quotes = db
    .select()
    .from(quoteRequests)
    .where(eq(quoteRequests.systemId, system.id))
    .orderBy(desc(quoteRequests.createdAt))
    .all();

  const quoteText = [
    `Pedido de orçamento — Predizza`,
    `Edifício: ${session?.buildingName ?? ""}`,
    `Sistema: ${system.name} (${system.category})`,
    `Local: ${system.locationLabel ?? "—"}`,
    `Specs: ${system.specs ?? "—"}`,
    `Periodicidade sugerida: ${system.periodicityMonths ?? "—"} meses`,
    `Custo estimado interno: ${formatBRL(system.estimatedCost)}`,
    "",
    `Favor enviar proposta com escopo, prazo e validade.`,
  ].join("\n");

  return (
    <div className="space-y-6">
      <PageHeader
        title={system.name}
        subtitle={`${system.category} · ${system.locationLabel ?? "sem local"}`}
        action={<TextLink href={`/map?system=${system.id}`}>Ver no mapa</TextLink>}
      />

      {sp.quote ? (
        <Card className="bg-accent-container/40">
          <p className="text-sm">Pedido de orçamento #{sp.quote} registrado.</p>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-muted">Próxima intervenção</p>
          <p className="display mt-1 text-2xl">{formatDate(system.nextDueAt)}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Custo estimado</p>
          <p className="display mt-1 text-2xl">{formatBRL(system.estimatedCost)}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Garantia</p>
          <p className="display mt-1 text-2xl">{formatDate(system.warrantyUntil)}</p>
        </Card>
      </div>

      <Card>
        <h2 className="display mb-4 text-xl">Editar ficha</h2>
        <form action={upsertSystemAction} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="id" value={system.id} />
          <Field label="Nome">
            <input className={inputClass} name="name" defaultValue={system.name} />
          </Field>
          <Field label="Categoria">
            <input
              className={inputClass}
              name="category"
              defaultValue={system.category}
            />
          </Field>
          <Field label="Local">
            <input
              className={inputClass}
              name="locationLabel"
              defaultValue={system.locationLabel ?? ""}
            />
          </Field>
          <Field label="Garantia até">
            <input
              className={inputClass}
              type="date"
              name="warrantyUntil"
              defaultValue={system.warrantyUntil ?? ""}
            />
          </Field>
          <Field label="Periodicidade (meses)">
            <input
              className={inputClass}
              type="number"
              name="periodicityMonths"
              defaultValue={system.periodicityMonths ?? 12}
            />
          </Field>
          <Field label="Próxima intervenção">
            <input
              className={inputClass}
              type="date"
              name="nextDueAt"
              defaultValue={system.nextDueAt ?? ""}
            />
          </Field>
          <Field label="Custo estimado">
            <input
              className={inputClass}
              type="number"
              name="estimatedCost"
              defaultValue={system.estimatedCost ?? 0}
            />
          </Field>
          <Field label="Mapa X / Y / Z">
            <div className="grid grid-cols-3 gap-2">
              <input className={inputClass} name="mapX" defaultValue={system.mapX ?? 0} />
              <input className={inputClass} name="mapY" defaultValue={system.mapY ?? 0} />
              <input className={inputClass} name="mapZ" defaultValue={system.mapZ ?? 0} />
            </div>
          </Field>
          <Field label="Especificações">
            <textarea
              className={inputClass}
              name="specs"
              rows={3}
              defaultValue={system.specs ?? ""}
            />
          </Field>
          <div className="md:col-span-2">
            <PrimaryButton type="submit">Salvar</PrimaryButton>
          </div>
        </form>
      </Card>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="display text-xl">Orçamentos no mesmo escopo</h2>
          <CopyButton text={quoteText} label="Copiar escopo" />
        </div>
        <p className="mb-4 text-sm text-muted">
          Compare propostas lado a lado — o que cabe na reserva da assembleia.
        </p>
        <form action={createQuoteRequestAction} className="space-y-3">
          <input type="hidden" name="systemId" value={system.id} />
          <Field label="Título / escopo curto">
            <input
              className={inputClass}
              name="title"
              required
              defaultValue={`Orçamento — ${system.name}`}
            />
          </Field>
          <Field label="Escopo enviado ao fornecedor">
            <textarea
              className={inputClass}
              name="scope"
              rows={2}
              defaultValue={system.specs ?? ""}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Fornecedor">
              <input className={inputClass} name="supplierName" placeholder="Nome" />
            </Field>
            <Field label="Valor (R$)">
              <input className={inputClass} name="amount" type="number" step="0.01" />
            </Field>
            <Field label="Validade">
              <input className={inputClass} name="validUntil" type="date" />
            </Field>
          </div>
          <PrimaryButton type="submit">Adicionar proposta</PrimaryButton>
        </form>
        {quotes.length ? (
          <div className="mt-4 overflow-x-auto border-t border-line pt-3">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="text-muted">
                  <th className="py-2 pr-2">Fornecedor</th>
                  <th className="py-2 pr-2">Valor</th>
                  <th className="py-2 pr-2">Validade</th>
                  <th className="py-2">vs reserva ficha</th>
                </tr>
              </thead>
              <tbody>
                {[...quotes]
                  .sort((a, b) => (a.amount ?? Infinity) - (b.amount ?? Infinity))
                  .map((q) => {
                    const est = system.estimatedCost ?? 0;
                    const delta =
                      q.amount != null && est ? q.amount - est : null;
                    return (
                      <tr key={q.id} className="border-t border-line/50">
                        <td className="py-2 pr-2">
                          <p className="font-medium">
                            {q.supplierName || q.title}
                          </p>
                          <p className="text-xs text-muted">{q.status}</p>
                        </td>
                        <td className="py-2 pr-2 font-semibold">
                          {q.amount != null ? formatBRL(q.amount) : "—"}
                        </td>
                        <td className="py-2 pr-2 text-muted">
                          {formatDate(q.validUntil)}
                        </td>
                        <td className="py-2 text-muted">
                          {delta == null
                            ? "—"
                            : delta <= 0
                              ? `${formatBRL(Math.abs(delta))} abaixo da ficha`
                              : `${formatBRL(delta)} acima da ficha`}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">Nenhuma proposta ainda.</p>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="display mb-3 text-xl">Documentos</h2>
          <ul className="space-y-2 text-sm">
            {docs.map((d) => (
              <li key={d.id} className="flex justify-between border-b border-line pb-2">
                <span>{d.title}</span>
                <span className="text-muted">{d.kind}</span>
              </li>
            ))}
            {!docs.length ? <li className="text-muted">Sem documentos.</li> : null}
          </ul>
        </Card>
        <Card>
          <h2 className="display mb-3 text-xl">Histórico de ocorrências</h2>
          <ul className="space-y-2 text-sm">
            {occs.map((o) => (
              <li key={o.id}>
                <TextLink href={`/occurrences/${o.id}`}>
                  {o.code} — {o.title}
                </TextLink>
              </li>
            ))}
            {!occs.length ? <li className="text-muted">Sem ocorrências.</li> : null}
          </ul>
        </Card>
      </div>
    </div>
  );
}
