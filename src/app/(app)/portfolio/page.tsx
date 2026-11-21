import { and, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  PageHeader,
  Card,
  StatCard,
  Empty,
} from "@/components/ui";
import { db } from "@/db";
import {
  buildings,
  forecastItems,
  memberships,
  occurrences,
} from "@/db/schema";
import { getSession } from "@/lib/auth";
import { formatBRL } from "@/lib/format";

export default async function PortfolioPage() {
  const session = await getSession();
  if (!session) return null;
  if (session.role !== "construtora") {
    redirect("/dashboard");
  }

  const mine = db
    .select({
      buildingId: memberships.buildingId,
      role: memberships.role,
      name: buildings.name,
      slug: buildings.slug,
      address: buildings.address,
    })
    .from(memberships)
    .innerJoin(buildings, eq(buildings.id, memberships.buildingId))
    .where(
      and(eq(memberships.userId, session.id), eq(memberships.role, "construtora")),
    )
    .all();

  const cards = mine.map((b) => {
    const open = db
      .select()
      .from(occurrences)
      .where(
        and(
          eq(occurrences.buildingId, b.buildingId),
          inArray(occurrences.status, ["aberta", "programada", "em_execucao"]),
        ),
      )
      .all();
    const all = db
      .select()
      .from(occurrences)
      .where(eq(occurrences.buildingId, b.buildingId))
      .all();
    const internal = all.reduce((a, o) => a + (o.internalCost ?? 0), 0);
    const actNow = db
      .select()
      .from(forecastItems)
      .where(
        and(
          eq(forecastItems.buildingId, b.buildingId),
          eq(forecastItems.urgency, "agir_agora"),
        ),
      )
      .all();
    return {
      ...b,
      openCount: open.length,
      internal,
      actNowCost: actNow.reduce((a, i) => a + (i.estimatedCost ?? 0), 0),
      actNowCount: actNow.length,
    };
  });

  const totals = {
    buildings: cards.length,
    open: cards.reduce((a, c) => a + c.openCount, 0),
    internal: cards.reduce((a, c) => a + c.internal, 0),
    actNow: cards.reduce((a, c) => a + c.actNowCost, 0),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Portfólio"
        subtitle="Visão da construtora nos edifícios entregues."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Edifícios" value={String(totals.buildings)} />
        <StatCard
          label="OCs abertas"
          value={String(totals.open)}
          tone={totals.open ? "warn" : "ok"}
        />
        <StatCard
          label="Custo interno"
          value={formatBRL(totals.internal)}
          hint={`Agir agora: ${formatBRL(totals.actNow)}`}
        />
      </div>

      {!cards.length ? (
        <Empty>Nenhum edifício no portfólio.</Empty>
      ) : (
        <ul className="space-y-3">
          {cards.map((c) => (
            <li key={c.buildingId}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-sm text-muted">{c.address ?? c.slug}</p>
                    <p className="mt-2 text-sm text-muted">
                      {c.openCount} OCs abertas · {c.actNowCount} agir agora ·
                      interno {formatBRL(c.internal)}
                    </p>
                  </div>
                  {c.buildingId === session.buildingId ? (
                    <Link
                      href="/lessons"
                      className="text-sm font-semibold text-accent underline-offset-2 hover:underline"
                    >
                      Lessons learned
                    </Link>
                  ) : (
                    <span className="text-xs text-muted">
                      Sessão atual: {session.buildingName}
                    </span>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
