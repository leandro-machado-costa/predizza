import { eq } from "drizzle-orm";
import { createPlanAction, runPlanAction } from "@/app/actions/maintenance";
import { db } from "@/db";
import { maintenancePlans, systems } from "@/db/schema";
import {
  PageHeader,
  Card,
  Field,
  PrimaryButton,
  inputClass,
  Empty,
} from "@/components/ui";
import { getSession } from "@/lib/auth";
import { formatBRL, formatDate } from "@/lib/format";

export default async function MaintenancePage() {
  const session = await getSession();
  if (!session) return null;

  const plans = db
    .select({
      plan: maintenancePlans,
      systemName: systems.name,
    })
    .from(maintenancePlans)
    .leftJoin(systems, eq(systems.id, maintenancePlans.systemId))
    .where(eq(maintenancePlans.buildingId, session.buildingId))
    .all();

  const systemRows = db
    .select()
    .from(systems)
    .where(eq(systems.buildingId, session.buildingId))
    .all();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Manutenção preventiva"
        subtitle="Planos alinhados à NBR 5674, ligados às fichas de sistema."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="display mb-4 text-xl">Novo plano</h2>
          <form action={createPlanAction} className="space-y-3">
            <Field label="Sistema">
              <select className={inputClass} name="systemId" required>
                {systemRows.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Título">
              <input className={inputClass} name="title" required />
            </Field>
            <Field label="Periodicidade (meses)">
              <input
                className={inputClass}
                type="number"
                name="periodicityMonths"
                defaultValue={6}
              />
            </Field>
            <Field label="Próxima data">
              <input className={inputClass} type="date" name="nextDueAt" />
            </Field>
            <Field label="Custo estimado">
              <input
                className={inputClass}
                type="number"
                name="estimatedCost"
                defaultValue={0}
              />
            </Field>
            <Field label="Notas">
              <textarea className={inputClass} name="notes" rows={2} />
            </Field>
            <PrimaryButton type="submit">Criar plano</PrimaryButton>
          </form>
        </Card>

        <Card>
          <h2 className="display mb-4 text-xl">Planos ativos</h2>
          {!plans.length ? (
            <Empty>Nenhum plano cadastrado.</Empty>
          ) : (
            <ul className="space-y-4">
              {plans.map(({ plan, systemName }) => (
                <li key={plan.id} className="border-b border-line pb-4">
                  <p className="font-medium">{plan.title}</p>
                  <p className="text-sm text-muted">
                    {systemName} · próxima {formatDate(plan.nextDueAt)} ·{" "}
                    {formatBRL(plan.estimatedCost)}
                  </p>
                  <form action={runPlanAction} className="mt-3 flex flex-wrap gap-2">
                    <input type="hidden" name="planId" value={plan.id} />
                    <input
                      className={inputClass}
                      name="cost"
                      type="number"
                      placeholder="Custo"
                      defaultValue={plan.estimatedCost ?? 0}
                    />
                    <PrimaryButton type="submit">Registrar execução</PrimaryButton>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
