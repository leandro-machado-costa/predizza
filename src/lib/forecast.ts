import { and, eq } from "drizzle-orm";
import { addMonths, formatISO, parseISO, isBefore, addYears } from "date-fns";
import { db } from "@/db";
import {
  forecastItems,
  maintenancePlans,
  systems,
  works,
} from "@/db/schema";

export async function rebuildForecast(buildingId: number) {
  await db.delete(forecastItems).where(eq(forecastItems.buildingId, buildingId));

  const now = new Date();
  const horizon = addYears(now, 3);
  const rows: (typeof forecastItems.$inferInsert)[] = [];

  const systemRows = await db
    .select()
    .from(systems)
    .where(eq(systems.buildingId, buildingId));

  for (const s of systemRows) {
    if (!s.nextDueAt) continue;
    let cursor = parseISO(s.nextDueAt);
    const months = s.periodicityMonths ?? 12;
    let guard = 0;
    while (isBefore(cursor, horizon) && guard < 36) {
      const monthsAhead =
        (cursor.getFullYear() - now.getFullYear()) * 12 +
        (cursor.getMonth() - now.getMonth());
      rows.push({
        buildingId,
        systemId: s.id,
        source: "sistema",
        title: `Manutenção — ${s.name}`,
        dueAt: formatISO(cursor, { representation: "date" }),
        estimatedCost: s.estimatedCost ?? 0,
        urgency: monthsAhead <= 3 ? "agir_agora" : monthsAhead <= 12 ? "12_meses" : "3_anos",
      });
      cursor = addMonths(cursor, months);
      guard += 1;
    }
  }

  const plans = await db
    .select()
    .from(maintenancePlans)
    .where(eq(maintenancePlans.buildingId, buildingId));

  for (const p of plans) {
    if (!p.nextDueAt) continue;
    let cursor = parseISO(p.nextDueAt);
    let guard = 0;
    while (isBefore(cursor, horizon) && guard < 36) {
      const monthsAhead =
        (cursor.getFullYear() - now.getFullYear()) * 12 +
        (cursor.getMonth() - now.getMonth());
      rows.push({
        buildingId,
        systemId: p.systemId,
        source: "plano",
        title: p.title,
        dueAt: formatISO(cursor, { representation: "date" }),
        estimatedCost: p.estimatedCost ?? 0,
        urgency: monthsAhead <= 3 ? "agir_agora" : monthsAhead <= 12 ? "12_meses" : "3_anos",
      });
      cursor = addMonths(cursor, p.periodicityMonths);
      guard += 1;
    }
  }

  const workRows = await db
    .select()
    .from(works)
    .where(and(eq(works.buildingId, buildingId)));

  for (const w of workRows) {
    if (!w.startAt || w.status === "concluida") continue;
    const start = parseISO(w.startAt);
    const monthsAhead =
      (start.getFullYear() - now.getFullYear()) * 12 +
      (start.getMonth() - now.getMonth());
    rows.push({
      buildingId,
      systemId: w.systemId,
      source: "obra",
      title: w.title,
      dueAt: w.startAt,
      estimatedCost: w.estimatedCost ?? 0,
      urgency: monthsAhead <= 3 ? "agir_agora" : monthsAhead <= 12 ? "12_meses" : "3_anos",
    });
  }

  if (rows.length) {
    await db.insert(forecastItems).values(rows);
  }
}
