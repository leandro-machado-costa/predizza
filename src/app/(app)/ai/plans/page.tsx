import { eq } from "drizzle-orm";
import { suggestPlansAction } from "@/app/actions/ai";
import {
  PageHeader,
  Card,
  PrimaryButton,
  Empty,
} from "@/components/ui";
import { db } from "@/db";
import { maintenancePlans, occurrences, systems } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { formatBRL, formatDate } from "@/lib/format";
import { findRepeatedPatterns } from "@/lib/patterns";

export default async function AiPlansPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const sp = await searchParams;

  const plans = db
    .select()
    .from(maintenancePlans)
    .where(eq(maintenancePlans.buildingId, session.buildingId))
    .all();
  const sys = db
    .select()
    .from(systems)
    .where(eq(systems.buildingId, session.buildingId))
    .all();
  const byId = Object.fromEntries(sys.map((s) => [s.id, s]));

  const occs = db
    .select()
    .from(occurrences)
    .where(eq(occurrences.buildingId, session.buildingId))
    .all();
  const patterns = findRepeatedPatterns(
    occs.map((o) => ({
      id: o.id,
      code: o.code,
      title: o.title,
      systemId: o.systemId,
      status: o.status,
    })),
    Object.fromEntries(sys.map((s) => [s.id, s.name])),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planos assistidos"
        subtitle="Preventivas faltantes + alertas quando a mesma patologia se repete."
      />

      {sp.created != null ? (
        <Card className="bg-accent-container/40">
          <p className="text-sm">
            {Number(sp.created) === 0
              ? "Nenhum plano novo — todos os sistemas já têm preventiva."
              : `${sp.created} plano(s) criado(s).`}
          </p>
        </Card>
      ) : null}

      {patterns.length ? (
        <Card>
          <h2 className="mb-2 text-base font-semibold">Alertas de padrão</h2>
          <p className="mb-3 text-sm text-muted">
            Ocorrências repetidas sugerem reforçar o plano preventivo.
          </p>
          <ul className="space-y-2 text-sm">
            {patterns.slice(0, 8).map((p) => (
              <li key={p.key} className="border-b border-line pb-2">
                <p className="font-medium">{p.label}</p>
                <p className="text-muted">{p.codes.join(", ")}</p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card>
        <form action={suggestPlansAction}>
          <PrimaryButton type="submit">Sugerir planos faltantes</PrimaryButton>
        </form>
      </Card>

      <Card>
        <h2 className="mb-3 text-base font-semibold">Planos atuais</h2>
        {!plans.length ? (
          <Empty>Nenhum plano cadastrado.</Empty>
        ) : (
          <ul className="space-y-3">
            {plans.map((p) => (
              <li
                key={p.id}
                className="flex justify-between gap-3 border-b border-line pb-3 text-sm"
              >
                <div>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-muted">
                    {byId[p.systemId]?.name ?? "Sistema"} · a cada{" "}
                    {p.periodicityMonths} mês(es) · próximo{" "}
                    {formatDate(p.nextDueAt)}
                  </p>
                </div>
                <span className="shrink-0 font-semibold">
                  {formatBRL(p.estimatedCost)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
