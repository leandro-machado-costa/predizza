import { desc, eq } from "drizzle-orm";
import {
  resolveWhatsAppEventAction,
  simulateWhatsAppMessageAction,
} from "@/app/actions/whatsapp";
import {
  PageHeader,
  Card,
  Field,
  PrimaryButton,
  SecondaryButton,
  inputClass,
  Empty,
} from "@/components/ui";
import { db } from "@/db";
import { whatsappEvents } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import {
  getEvolutionConfig,
  isEvolutionConfigured,
} from "@/lib/whatsapp/evolution";

export default async function WhatsAppPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const sp = await searchParams;
  const evo = getEvolutionConfig();
  const configured = isEvolutionConfigured();

  const events = db
    .select()
    .from(whatsappEvents)
    .where(eq(whatsappEvents.buildingId, session.buildingId))
    .orderBy(desc(whatsappEvents.createdAt))
    .all();

  const focus = sp.event
    ? events.find((e) => e.id === Number(sp.event))
    : events.find((e) => e.status === "pending");

  return (
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp"
        subtitle="O grupo continua. A Predizza só guarda o que você confirmar — nada de dump."
      />

      <Card className="border-accent/20 bg-accent-container/25">
        <h2 className="text-base font-semibold">Regra de ouro</h2>
        <p className="mt-1 text-sm text-muted">
          Relato entra na fila → triagem (nova / duplicata / ruído) → você
          responde só <strong className="text-foreground">Confirmar</strong>,{" "}
          <strong className="text-foreground">Vincular</strong> ou{" "}
          <strong className="text-foreground">Ignorar</strong>. Sem confirmação,
          não vira ocorrência.
        </p>
      </Card>

      <Card className={configured ? "bg-card" : "bg-surface-2"}>
        <h2 className="text-base font-semibold">Evolution API</h2>
        <p className="mt-1 text-sm text-muted">
          {configured
            ? `Conectada em ${evo.baseUrl} · instância ${evo.instance} · edifício ${evo.defaultBuildingSlug || session.buildingSlug}`
            : "Não configurada — use a simulação abaixo ou copie .env.example e suba docker compose."}
        </p>
        <ul className="mt-3 list-inside list-disc text-sm text-muted">
          <li>
            Webhook: <code className="text-foreground">/api/whatsapp/webhook</code>
          </li>
          <li>
            Confirmação no chat:{" "}
            <code className="text-foreground">Confirmar</code> /{" "}
            <code className="text-foreground">Vincular</code> /{" "}
            <code className="text-foreground">Ignorar</code>
          </li>
          {evo.requireMention ? (
            <li>Grupos: cite Predizza na mensagem (EVOLUTION_REQUIRE_MENTION=1)</li>
          ) : null}
        </ul>
        <p className="mt-2 text-sm">
          Guia: <code className="text-foreground">docs/whatsapp-evolution.md</code>
        </p>
      </Card>

      <Card>
        <h2 className="mb-3 text-base font-semibold">Simular mensagem</h2>
        <form action={simulateWhatsAppMessageAction} className="space-y-3">
          <Field label="Grupo">
            <input
              className={inputClass}
              name="groupName"
              defaultValue="Grupo do condomínio"
            />
          </Field>
          <Field label="Autor">
            <input className={inputClass} name="authorName" defaultValue="Morador" />
          </Field>
          <Field label="Mensagem">
            <textarea
              className={inputClass}
              name="body"
              rows={3}
              required
              placeholder="Ex.: Predizza — infiltração na garagem perto da bomba"
            />
          </Field>
          <PrimaryButton type="submit">Enviar para triagem</PrimaryButton>
        </form>
      </Card>

      {focus ? (
        <Card className="space-y-3">
          <h2 className="text-base font-semibold">Evento #{focus.id}</h2>
          <p className="text-sm">
            <strong>{focus.authorName}</strong>
            {focus.groupName ? ` em ${focus.groupName}` : ""}
          </p>
          <p className="rounded-[var(--radius-md)] bg-surface-2 px-3 py-2 text-sm">
            {focus.body}
          </p>
          <p className="text-sm text-muted">
            Classificação: {focus.classification} · status: {focus.status}
            {focus.remoteJid ? ` · jid ${focus.remoteJid}` : ""}
          </p>
          {focus.status === "pending" ? (
            <form action={resolveWhatsAppEventAction} className="flex flex-wrap gap-2">
              <input type="hidden" name="eventId" value={focus.id} />
              <PrimaryButton type="submit" name="action" value="create">
                Abrir ocorrência
              </PrimaryButton>
              {focus.matchedOccurrenceId ? (
                <SecondaryButton type="submit" name="action" value="link">
                  Vincular existente
                </SecondaryButton>
              ) : null}
              <SecondaryButton type="submit" name="action" value="ignore">
                Ignorar
              </SecondaryButton>
            </form>
          ) : null}
        </Card>
      ) : null}

      <Card>
        <h2 className="mb-3 text-base font-semibold">Fila</h2>
        {!events.length ? (
          <Empty>Nenhuma mensagem processada.</Empty>
        ) : (
          <ul className="space-y-3">
            {events.map((e) => (
              <li key={e.id} className="border-b border-line pb-3 text-sm">
                <a
                  href={`/whatsapp?event=${e.id}`}
                  className="font-medium underline-offset-2 hover:underline"
                >
                  {e.authorName}: {e.body.slice(0, 70)}
                </a>
                <p className="text-muted">
                  {e.classification} · {e.status} · {formatDate(e.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
