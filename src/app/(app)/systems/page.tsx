import { eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { systems } from "@/db/schema";
import { PageHeader, Card, Empty, PrimaryButton } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { formatBRL, formatDate } from "@/lib/format";

export default async function SystemsPage() {
  const session = await getSession();
  if (!session) return null;
  const rows = db
    .select()
    .from(systems)
    .where(eq(systems.buildingId, session.buildingId))
    .all();

  return (
    <div>
      <PageHeader
        title="Fichas de sistema"
        subtitle="Especificações, garantias, periodicidade, próxima intervenção e custo."
        action={
          <Link href="/systems/new">
            <PrimaryButton type="button">Nova ficha</PrimaryButton>
          </Link>
        }
      />
      {!rows.length ? (
        <Empty>Nenhum sistema cadastrado. Comece pela entrega da construtora.</Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((s) => (
            <Link key={s.id} href={`/systems/${s.id}`}>
              <Card className="h-full transition hover:-translate-y-0.5 hover:border-accent/40">
                <p className="text-xs uppercase tracking-wide text-muted">
                  {s.category}
                </p>
                <h2 className="display mt-1 text-2xl">{s.name}</h2>
                <p className="mt-2 text-sm text-muted">{s.locationLabel ?? "—"}</p>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-muted">Próxima</dt>
                    <dd className="font-medium">{formatDate(s.nextDueAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Custo est.</dt>
                    <dd className="font-medium">{formatBRL(s.estimatedCost)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Garantia até</dt>
                    <dd className="font-medium">{formatDate(s.warrantyUntil)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Periodicidade</dt>
                    <dd className="font-medium">{s.periodicityMonths} meses</dd>
                  </div>
                </dl>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
