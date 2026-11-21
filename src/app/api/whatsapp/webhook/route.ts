import { NextResponse } from "next/server";
import { getEvolutionConfig, isEvolutionConfigured } from "@/lib/whatsapp/evolution";
import { processWhatsAppInbound } from "@/lib/whatsapp/inbound";

/**
 * Webhook Evolution API (MESSAGES_UPSERT) + JSON simples Prediza.
 *
 * Evolution: configure URL → {APP}/api/whatsapp/webhook
 * Header opcional: x-webhook-secret = EVOLUTION_WEBHOOK_SECRET
 */
export async function POST(req: Request) {
  const cfg = getEvolutionConfig();
  if (cfg.webhookSecret) {
    const hdr =
      req.headers.get("x-webhook-secret") ||
      req.headers.get("apikey") ||
      "";
    if (hdr !== cfg.webhookSecret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const result = await processWhatsAppInbound(raw);
  if (!result.ok && "status" in result && result.status) {
    return NextResponse.json(result, { status: result.status });
  }
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}

export async function GET() {
  const cfg = getEvolutionConfig();
  return NextResponse.json({
    ok: true,
    provider: "evolution",
    configured: isEvolutionConfigured(),
    instance: cfg.instance || null,
    buildingSlug: cfg.defaultBuildingSlug,
    requireMention: cfg.requireMention,
    hint: "Aponte o webhook MESSAGES_UPSERT da Evolution para este endpoint",
  });
}
