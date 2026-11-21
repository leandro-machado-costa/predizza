import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { occurrences } from "@/db/schema";
import { PageHeader, Card, Empty, PrimaryButton } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { formatDate, priorityLabel, statusLabel } from "@/lib/format";

export default async function OccurrencesPage() {
  const session = await getSession();
  if (!session) return null;
  const rows = db
    .select()
    .from(occurrences)
    .where(eq(occurrences.buildingId, session.buildingId))
    .orderBy(desc(occurrences.createdAt))
    .all();

  return (
    <div>
      <PageHeader
        title="Ocorrências"
        subtitle="Problemas registrados no ponto do mapa, ligados às fichas de sistema."
        action={
          <Link href="/map">
            <PrimaryButton type="button">Registrar no mapa</PrimaryButton>
          </Link>
        }
      />
      {!rows.length ? (
        <Empty>Nenhuma ocorrência.</Empty>
      ) : (
        <div className="space-y-3">
          {rows.map((o) => (
            <Link key={o.id} href={`/occurrences/${o.id}`}>
              <Card className="mb-3 transition hover:border-accent/40">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted">{o.code}</p>
                    <h2 className="mt-1 text-lg font-medium">{o.title}</h2>
                    <p className="mt-1 text-sm text-muted">
                      Prazo {formatDate(o.dueAt)} · {statusLabel[o.status] ?? o.status}
                    </p>
                  </div>
                  <span className="rounded-full bg-accent-2/10 px-3 py-1 text-xs font-medium text-accent-2">
                    {priorityLabel[o.priority] ?? o.priority}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
