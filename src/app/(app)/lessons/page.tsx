import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import {
  PageHeader,
  Card,
  Empty,
  PrimaryButton,
} from "@/components/ui";
import { db } from "@/db";
import { occurrences, systems } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { formatBRL, formatDate } from "@/lib/format";

export default async function LessonsPage() {
  const session = await getSession();
  if (!session) return null;
  if (session.role !== "construtora") {
    redirect("/dashboard");
  }

  const rows = db
    .select()
    .from(occurrences)
    .where(eq(occurrences.buildingId, session.buildingId))
    .all()
    .filter(
      (o) =>
        o.internalRootCause ||
        o.internalCost != null ||
        o.internalNotes ||
        o.status === "concluida",
    );

  const sys = db
    .select()
    .from(systems)
    .where(eq(systems.buildingId, session.buildingId))
    .all();
  const byId = Object.fromEntries(sys.map((s) => [s.id, s.name]));

  const csv = [
    [
      "code",
      "title",
      "system",
      "status",
      "priority",
      "root_cause",
      "internal_cost",
      "notes",
      "created_at",
    ].join(","),
    ...rows.map((o) =>
      [
        o.code,
        JSON.stringify(o.title),
        JSON.stringify(o.systemId ? byId[o.systemId] ?? "" : ""),
        o.status,
        o.priority,
        JSON.stringify(o.internalRootCause ?? ""),
        o.internalCost ?? "",
        JSON.stringify(o.internalNotes ?? ""),
        o.createdAt,
      ].join(","),
    ),
  ].join("\n");

  const dataUrl = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lessons learned"
        subtitle="Pós-obra interno: causa raiz, custo e padrões — só construtora."
        action={
          <a href={dataUrl} download={`lessons-${session.buildingSlug}.csv`}>
            <PrimaryButton type="button">Exportar CSV</PrimaryButton>
          </a>
        }
      />

      <Card>
        {!rows.length ? (
          <Empty>
            Nenhuma ocorrência com campos internos ou concluída ainda.
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-muted">
                  <th className="py-2 pr-3">OC</th>
                  <th className="py-2 pr-3">Sistema</th>
                  <th className="py-2 pr-3">Causa raiz</th>
                  <th className="py-2 pr-3">Custo</th>
                  <th className="py-2">Quando</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.id} className="border-b border-line/60">
                    <td className="py-2 pr-3">
                      <a
                        href={`/occurrences/${o.id}`}
                        className="font-medium underline-offset-2 hover:underline"
                      >
                        {o.code}
                      </a>
                      <p className="text-muted">{o.title}</p>
                    </td>
                    <td className="py-2 pr-3 text-muted">
                      {o.systemId ? byId[o.systemId] ?? "—" : "—"}
                    </td>
                    <td className="py-2 pr-3">
                      {o.internalRootCause ?? (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      {o.internalCost != null
                        ? formatBRL(o.internalCost)
                        : "—"}
                    </td>
                    <td className="py-2 text-muted">
                      {formatDate(o.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
