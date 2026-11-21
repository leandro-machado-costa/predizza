import { desc, eq } from "drizzle-orm";
import { createInviteAction } from "@/app/actions/invites";
import {
  PageHeader,
  Card,
  Field,
  PrimaryButton,
  inputClass,
  Empty,
} from "@/components/ui";
import { db } from "@/db";
import { invitations } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { formatDate } from "@/lib/format";

export default async function InvitesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const sp = await searchParams;

  const rows = db
    .select()
    .from(invitations)
    .where(eq(invitations.buildingId, session.buildingId))
    .orderBy(desc(invitations.createdAt))
    .all();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Convites"
        subtitle="Chame síndico, gestor, técnico ou fornecedor para o edifício."
      />

      {sp.created ? (
        <Card className="bg-accent-container/40">
          <p className="text-sm font-medium">Convite criado</p>
          <p className="mt-1 break-all text-sm text-muted">
            Token: {sp.created} — aceite em /invite/{sp.created}
          </p>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-base font-semibold">Novo convite</h2>
          <form action={createInviteAction} className="space-y-3">
            <Field label="Nome">
              <input className={inputClass} name="name" required />
            </Field>
            <Field label="E-mail">
              <input className={inputClass} name="email" type="email" required />
            </Field>
            <Field label="Papel">
              <select className={inputClass} name="role" defaultValue="tecnico">
                <option value="sindico">Síndico</option>
                <option value="gestor">Gestor</option>
                <option value="tecnico">Técnico</option>
                <option value="fornecedor">Fornecedor</option>
                <option value="construtora">Construtora</option>
              </select>
            </Field>
            <PrimaryButton type="submit">Gerar convite</PrimaryButton>
          </form>
        </Card>

        <Card>
          <h2 className="mb-3 text-base font-semibold">Pendentes e aceitos</h2>
          {!rows.length ? (
            <Empty>Nenhum convite ainda.</Empty>
          ) : (
            <ul className="space-y-3">
              {rows.map((r) => (
                <li
                  key={r.id}
                  className="flex items-start justify-between gap-3 border-b border-line pb-3 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {r.name} · {r.role}
                    </p>
                    <p className="text-muted">
                      {r.email} · {formatDate(r.createdAt)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-semibold uppercase">
                    {r.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
