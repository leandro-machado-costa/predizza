import { desc, eq } from "drizzle-orm";
import { deliveryAction } from "@/app/actions/delivery";
import { DeliveryWizard } from "@/components/DeliveryWizard";
import { db } from "@/db";
import { documents, occurrences } from "@/db/schema";
import {
  PageHeader,
  Card,
  Field,
  PrimaryButton,
  inputClass,
  Empty,
} from "@/components/ui";
import { getSession } from "@/lib/auth";
import { formatDate } from "@/lib/format";

export default async function DeliveryPage({
  searchParams,
}: {
  searchParams: Promise<{ wizard?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const sp = await searchParams;

  const docs = db
    .select()
    .from(documents)
    .where(eq(documents.buildingId, session.buildingId))
    .orderBy(desc(documents.createdAt))
    .all();

  const postOcc = db
    .select()
    .from(occurrences)
    .where(eq(occurrences.buildingId, session.buildingId))
    .all();

  const canWizard =
    session.role === "construtora" || session.role === "sindico";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Entrega digital"
        subtitle="Construtora sobe plantas, manuais e garantias. A Prediza gera fichas e a primeira previsão."
      />

      {sp.wizard === "ok" ? (
        <Card className="bg-accent-container/40">
          <p className="text-sm font-medium">
            Wizard concluído — sistemas e previsão atualizados.
          </p>
        </Card>
      ) : null}

      {canWizard ? (
        <Card>
          <h2 className="display mb-4 text-xl">Wizard de entrega</h2>
          <DeliveryWizard />
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="display mb-4 text-xl">Documento avulso</h2>
          <form action={deliveryAction} className="space-y-4">
            <Field label="Título do documento">
              <input className={inputClass} name="title" required />
            </Field>
            <Field label="Tipo">
              <select className={inputClass} name="kind" defaultValue="manual">
                <option value="planta">Planta</option>
                <option value="memorial">Memorial</option>
                <option value="manual">Manual</option>
                <option value="garantia">Garantia</option>
                <option value="outro">Outro</option>
              </select>
            </Field>
            <Field label="Notas">
              <textarea className={inputClass} name="notes" rows={3} />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="createSystem" defaultChecked />
              Criar ficha de sistema a partir desta entrega
            </label>
            <Field label="Nome do sistema">
              <input className={inputClass} name="systemName" placeholder="Ex.: Bombas" />
            </Field>
            <Field label="Categoria">
              <select className={inputClass} name="category" defaultValue="bombas">
                <option value="elevadores">Elevadores</option>
                <option value="bombas">Bombas</option>
                <option value="fachada">Fachada</option>
                <option value="cobertura">Cobertura</option>
                <option value="eletrica">Elétrica</option>
                <option value="hidraulica">Hidráulica</option>
                <option value="spda">SPDA</option>
                <option value="reservatorio">Reservatório</option>
                <option value="outro">Outro</option>
              </select>
            </Field>
            <Field label="Local">
              <input className={inputClass} name="locationLabel" />
            </Field>
            <PrimaryButton type="submit">Registrar entrega</PrimaryButton>
          </form>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="display mb-3 text-xl">Documentos entregues</h2>
            {!docs.length ? (
              <Empty>Nenhum documento ainda.</Empty>
            ) : (
              <ul className="space-y-3">
                {docs.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-start justify-between gap-3 border-b border-line pb-3"
                  >
                    <div>
                      <p className="font-medium">{d.title}</p>
                      <p className="text-sm text-muted">
                        {d.kind} · {formatDate(d.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h2 className="display mb-3 text-xl">Pós-obra (leitura)</h2>
            <p className="mb-3 text-sm text-muted">
              Ocorrências do edifício para a construtora melhorar os próximos projetos.
            </p>
            <ul className="space-y-2 text-sm">
              {postOcc.map((o) => (
                <li key={o.id} className="flex justify-between gap-2">
                  <span>
                    {o.code} — {o.title}
                  </span>
                  <span className="text-muted">{o.status}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
