import { eq } from "drizzle-orm";
import { createWorkAction } from "@/app/actions/works";
import { db } from "@/db";
import { systems, works } from "@/db/schema";
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

export default async function WorksPage() {
  const session = await getSession();
  if (!session) return null;

  const rows = db
    .select()
    .from(works)
    .where(eq(works.buildingId, session.buildingId))
    .all();
  const systemRows = db
    .select()
    .from(systems)
    .where(eq(systems.buildingId, session.buildingId))
    .all();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Obras e reformas"
        subtitle="Controle previsto na NBR 16280, com período, responsável e custo."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="display mb-4 text-xl">Nova obra</h2>
          <form action={createWorkAction} className="space-y-3">
            <Field label="Título">
              <input className={inputClass} name="title" required />
            </Field>
            <Field label="Tipo">
              <select className={inputClass} name="kind" defaultValue="reforma">
                <option value="reforma">Reforma</option>
                <option value="obra_comum">Obra área comum</option>
              </select>
            </Field>
            <Field label="Sistema">
              <select className={inputClass} name="systemId" defaultValue="">
                <option value="">Sem vínculo</option>
                {systemRows.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Início previsto">
              <input className={inputClass} type="date" name="startAt" />
            </Field>
            <Field label="Fim previsto">
              <input className={inputClass} type="date" name="endAt" />
            </Field>
            <Field label="Custo estimado">
              <input
                className={inputClass}
                type="number"
                name="estimatedCost"
                defaultValue={0}
              />
            </Field>
            <Field label="Responsável técnico">
              <input className={inputClass} name="responsible" />
            </Field>
            <Field label="Notas / documentos">
              <textarea className={inputClass} name="notes" rows={3} />
            </Field>
            <PrimaryButton type="submit">Salvar obra</PrimaryButton>
          </form>
        </Card>

        <Card>
          <h2 className="display mb-4 text-xl">Obras cadastradas</h2>
          {!rows.length ? (
            <Empty>Nenhuma obra.</Empty>
          ) : (
            <ul className="space-y-4">
              {rows.map((w) => (
                <li key={w.id} className="border-b border-line pb-3">
                  <p className="font-medium">{w.title}</p>
                  <p className="text-sm text-muted">
                    {w.kind} · {w.status} · {formatDate(w.startAt)} ·{" "}
                    {formatBRL(w.estimatedCost)}
                  </p>
                  {w.responsible ? (
                    <p className="text-sm text-muted">Resp.: {w.responsible}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
