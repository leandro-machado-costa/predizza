import { eq } from "drizzle-orm";
import { db } from "@/db";
import { forecastItems } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { formatBRL, formatDate } from "@/lib/format";
import { PrintActions } from "./PrintActions";

export default async function ForecastPrintPage() {
  const session = await getSession();
  if (!session) return null;

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

  const whatsappText = [
    `*Prediza · ${session.buildingName}*`,
    `Assembleia — previsão`,
    "",
    `Agir agora: ${formatBRL(sum(buckets.agir_agora))} (${buckets.agir_agora.length})`,
    `12 meses: ${formatBRL(sum(buckets["12_meses"]))} (${buckets["12_meses"].length})`,
    `3 anos: ${formatBRL(sum(buckets["3_anos"]))} (${buckets["3_anos"].length})`,
    "",
    ...buckets.agir_agora.slice(0, 8).map(
      (i) => `• ${i.title} — ${formatDate(i.dueAt)} — ${formatBRL(i.estimatedCost)}`,
    ),
  ].join("\n");

  return (
    <div className="mx-auto max-w-3xl bg-white p-6 text-black print:p-0">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <PrintActions whatsappText={whatsappText} />
      </div>

      <header className="mb-6 border-b border-neutral-300 pb-4">
        <p className="text-sm uppercase tracking-wide text-neutral-500">Prediza</p>
        <h1 className="text-2xl font-bold">{session.buildingName}</h1>
        <p className="text-sm text-neutral-600">
          Relatório para assembleia · {formatDate(new Date().toISOString())}
        </p>
      </header>

      <section className="mb-6 grid grid-cols-3 gap-3 text-sm">
        <div className="rounded border border-neutral-200 p-3">
          <p className="text-neutral-500">Agir agora</p>
          <p className="text-lg font-semibold">{formatBRL(sum(buckets.agir_agora))}</p>
        </div>
        <div className="rounded border border-neutral-200 p-3">
          <p className="text-neutral-500">12 meses</p>
          <p className="text-lg font-semibold">{formatBRL(sum(buckets["12_meses"]))}</p>
        </div>
        <div className="rounded border border-neutral-200 p-3">
          <p className="text-neutral-500">3 anos</p>
          <p className="text-lg font-semibold">{formatBRL(sum(buckets["3_anos"]))}</p>
        </div>
      </section>

      {(
        [
          ["Agir agora", buckets.agir_agora],
          ["12 meses", buckets["12_meses"]],
          ["3 anos", buckets["3_anos"]],
        ] as const
      ).map(([title, rows]) => (
        <section key={title} className="mb-6">
          <h2 className="mb-2 text-lg font-semibold">{title}</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-300 text-left">
                <th className="py-1">Item</th>
                <th className="py-1">Prazo</th>
                <th className="py-1 text-right">Custo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id} className="border-b border-neutral-100">
                  <td className="py-1.5">{item.title}</td>
                  <td className="py-1.5">{formatDate(item.dueAt)}</td>
                  <td className="py-1.5 text-right">
                    {formatBRL(item.estimatedCost)}
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={3} className="py-2 text-neutral-500">
                    Nenhum item
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
