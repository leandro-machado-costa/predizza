import { eq } from "drizzle-orm";
import { addDays, formatISO } from "date-fns";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { buildings, occurrenceEvents, occurrences } from "@/db/schema";
import { dueDaysForPriority } from "@/lib/format";

function authorize(req: Request) {
  const key = process.env.PREDIZZA_API_KEY;
  if (!key) return true; // dev: aberto se não configurado
  const hdr =
    req.headers.get("x-api-key") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";
  return hdr === key;
}

function nextCode(buildingId: number) {
  const last = db
    .select({ code: occurrences.code })
    .from(occurrences)
    .where(eq(occurrences.buildingId, buildingId))
    .all();
  const max = last.reduce((acc, row) => {
    const n = Number(row.code.replace(/\D/g, ""));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `OC-${String(max + 1).padStart(4, "0")}`;
}

/** GET /api/v1/occurrences?buildingSlug=palmeiras&status=open */
export async function GET(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const slug = url.searchParams.get("buildingSlug") || "palmeiras";
  const status = url.searchParams.get("status");

  const building = db
    .select()
    .from(buildings)
    .where(eq(buildings.slug, slug))
    .get();
  if (!building) {
    return NextResponse.json({ error: "building not found" }, { status: 404 });
  }

  let rows = db
    .select()
    .from(occurrences)
    .where(eq(occurrences.buildingId, building.id))
    .all();

  if (status === "open") {
    rows = rows.filter((o) =>
      ["aberta", "programada", "em_execucao"].includes(o.status),
    );
  }

  return NextResponse.json({
    building: { id: building.id, slug: building.slug, name: building.name },
    count: rows.length,
    occurrences: rows.map((o) => ({
      id: o.id,
      code: o.code,
      title: o.title,
      status: o.status,
      priority: o.priority,
      dueAt: o.dueAt,
      systemId: o.systemId,
      source: o.source,
      createdAt: o.createdAt,
    })),
  });
}

/** POST { buildingSlug, title, description?, priority?, systemId? } */
export async function POST(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: {
    buildingSlug?: string;
    title?: string;
    description?: string;
    priority?: string;
    systemId?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const slug = String(body.buildingSlug ?? "").trim();
  const title = String(body.title ?? "").trim();
  if (!slug || !title) {
    return NextResponse.json(
      { error: "buildingSlug and title required" },
      { status: 400 },
    );
  }

  const building = db
    .select()
    .from(buildings)
    .where(eq(buildings.slug, slug))
    .get();
  if (!building) {
    return NextResponse.json({ error: "building not found" }, { status: 404 });
  }

  const priority = (body.priority || "media") as
    | "baixa"
    | "media"
    | "alta"
    | "urgente";
  const dueAt = formatISO(addDays(new Date(), dueDaysForPriority(priority)), {
    representation: "date",
  });

  const occ = db
    .insert(occurrences)
    .values({
      buildingId: building.id,
      systemId: body.systemId ?? null,
      code: nextCode(building.id),
      title,
      description: body.description ?? null,
      priority,
      status: "aberta",
      dueAt,
      source: "api",
    })
    .returning()
    .get();

  db.insert(occurrenceEvents)
    .values({
      occurrenceId: occ.id,
      type: "criacao",
      note: "Criada via API /api/v1/occurrences",
    })
    .run();

  return NextResponse.json({ ok: true, occurrence: occ }, { status: 201 });
}
