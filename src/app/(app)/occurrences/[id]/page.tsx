import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import {
  resolveAndNotifyAction,
  transitionOccurrenceAction,
} from "@/app/actions/occurrences";
import { updateInternalFieldsAction } from "@/app/actions/occurrences-internal";
import { db } from "@/db";
import { occurrenceEvents, occurrences, systems } from "@/db/schema";
import { CopyButton } from "@/components/CopyButton";
import {
  PageHeader,
  Card,
  PrimaryButton,
  Field,
  inputClass,
  TextLink,
} from "@/components/ui";
import { getSession } from "@/lib/auth";
import { formatBRL, formatDate, priorityLabel, statusLabel } from "@/lib/format";
import { isEvolutionConfigured } from "@/lib/whatsapp/evolution";

function extractPhoto(description: string | null) {
  const m = description?.match(/Foto:\s*(\S+)/);
  return m?.[1] ?? null;
}

export default async function OccurrenceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ resolved?: string; wa?: string }>;
}) {
  const session = await getSession();
  const { id } = await params;
  const sp = await searchParams;
  const occ = db
    .select()
    .from(occurrences)
    .where(eq(occurrences.id, Number(id)))
    .get();
  if (!occ) notFound();

  const system = occ.systemId
    ? db.select().from(systems).where(eq(systems.id, occ.systemId)).get()
    : null;
  const events = db
    .select()
    .from(occurrenceEvents)
    .where(eq(occurrenceEvents.occurrenceId, occ.id))
    .all();

  const nextStatuses = [
    "programada",
    "em_execucao",
    "executada",
    "concluida",
    "cancelada",
  ] as const;

  const isConstrutora = session?.role === "construtora";
  const reportPhoto = extractPhoto(occ.description);
  const evoOk = isEvolutionConfigured();

  const delegateText = [
    `Prediza · ${occ.code}`,
    occ.title,
    `Prazo: ${formatDate(occ.dueAt)} · Prioridade: ${priorityLabel[occ.priority] ?? occ.priority}`,
    system ? `Sistema: ${system.name}` : null,
    "",
    "Pode confirmar quando iniciar / concluir? Obrigado.",
  ]
    .filter(Boolean)
    .join("\n");

  const groupPreview = [
    `*Prediza* · ${occ.code} *concluída*`,
    occ.title,
    "",
    occ.resolutionNote || "[seu texto de resolução]",
    "",
    "_Atualização oficial — só o fechamento vai ao grupo._",
  ].join("\n");

  return (
    <div className="space-y-6">
      <PageHeader
        title={occ.title}
        subtitle={`${occ.code} · ${statusLabel[occ.status] ?? occ.status}${
          occ.source && occ.source !== "app" ? ` · origem ${occ.source}` : ""
        }`}
        action={<TextLink href="/map">Onde fica</TextLink>}
      />

      {sp.resolved === "1" ? (
        <Card className="bg-accent-container/40">
          <p className="text-sm font-medium">
            Ocorrência concluída
            {sp.wa === "1"
              ? " · aviso enviado ao grupo."
              : sp.wa === "0"
                ? " · aviso ao grupo não enviado (configure Evolution / JID)."
                : "."}
          </p>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-muted">Prioridade</p>
          <p className="display mt-1 text-2xl">
            {priorityLabel[occ.priority] ?? occ.priority}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Prazo</p>
          <p className="display mt-1 text-2xl">{formatDate(occ.dueAt)}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Sistema</p>
          <p className="display mt-1 text-2xl">
            {system ? (
              <TextLink href={`/systems/${system.id}`}>{system.name}</TextLink>
            ) : (
              "—"
            )}
          </p>
        </Card>
      </div>

      <Card>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="display text-xl">Delegar ao técnico</h2>
          <CopyButton text={delegateText} label="Copiar WhatsApp" />
        </div>
        <p className="text-sm text-muted">
          Texto pronto para enviar — o grupo só recebe o essencial.
        </p>
      </Card>

      <Card>
        <h2 className="display mb-2 text-xl">Relato</h2>
        <p className="whitespace-pre-wrap text-muted">
          {(occ.description ?? "Sem descrição.")
            .replace(/\n\nFoto:\s*\S+/g, "")
            .trim()}
        </p>
        {reportPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={reportPhoto}
            alt="Foto do relato"
            className="mt-4 max-h-80 w-full rounded-[var(--radius-md)] object-cover"
          />
        ) : null}
      </Card>

      {occ.resolutionNote || occ.resolutionPhotoPath ? (
        <Card className="border-accent/25 bg-accent-container/20">
          <h2 className="display mb-2 text-xl">Resolução</h2>
          <p className="whitespace-pre-wrap text-sm">{occ.resolutionNote}</p>
          {occ.resolutionPhotoPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={occ.resolutionPhotoPath}
              alt="Foto da resolução"
              className="mt-4 max-h-80 w-full rounded-[var(--radius-md)] object-cover"
            />
          ) : null}
          {occ.resolutionNotifiedAt ? (
            <p className="mt-3 text-xs text-muted">
              Grupo notificado em {formatDate(occ.resolutionNotifiedAt)}
            </p>
          ) : null}
          <div className="mt-3">
            <CopyButton text={groupPreview} label="Copiar texto do grupo" />
          </div>
        </Card>
      ) : null}

      {occ.status !== "concluida" && occ.status !== "cancelada" ? (
        <Card>
          <h2 className="display mb-2 text-xl">Concluir e avisar o grupo</h2>
          <p className="mb-4 text-sm text-muted">
            Foto do serviço + texto curto. O grupo recebe só o fechamento — não o
            histórico interno. Faz sentido para fechar o ciclo com o morador.
          </p>
          <form
            action={resolveAndNotifyAction}
            encType="multipart/form-data"
            className="space-y-3"
          >
            <input type="hidden" name="id" value={occ.id} />
            <Field label="Texto para o grupo / histórico">
              <textarea
                className={inputClass}
                name="resolutionNote"
                rows={3}
                required
                placeholder="Ex.: Equipe selou a junta e secou a área. Sem vazamento no teste."
                defaultValue="Equipe selou a junta do teto da garagem e validou a área seca. Situação normalizada."
              />
            </Field>
            <Field label="Foto da resolução">
              <input
                className={inputClass}
                type="file"
                name="resolutionPhoto"
                accept="image/*"
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="notifyGroup" defaultChecked />
              Enviar aviso ao grupo WhatsApp
            </label>
            {evoOk ? (
              <Field label="JID / número do grupo (DDI+DDD ou @g.us)">
                <input
                  className={inputClass}
                  name="remoteJid"
                  placeholder={
                    process.env.EVOLUTION_DIGEST_JID || "grupo@g.us"
                  }
                  defaultValue={process.env.EVOLUTION_DIGEST_JID || ""}
                />
              </Field>
            ) : (
              <p className="text-sm text-muted">
                Evolution offline: a conclusão fica no app; use “Copiar texto do
                grupo” depois, ou grave o HTML da demo.
              </p>
            )}
            <PrimaryButton type="submit">Concluir ocorrência</PrimaryButton>
          </form>
        </Card>
      ) : null}

      <Card>
        <h2 className="display mb-4 text-xl">Atualizar status</h2>
        <form action={transitionOccurrenceAction} className="flex flex-wrap gap-3">
          <input type="hidden" name="id" value={occ.id} />
          <Field label="Novo status">
            <select className={inputClass} name="status" defaultValue={occ.status}>
              {nextStatuses.map((s) => (
                <option key={s} value={s}>
                  {statusLabel[s] ?? s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Nota">
            <input className={inputClass} name="note" placeholder="Opcional" />
          </Field>
          <div className="flex items-end">
            <PrimaryButton type="submit">Salvar</PrimaryButton>
          </div>
        </form>
      </Card>

      {isConstrutora ? (
        <Card>
          <h2 className="display mb-2 text-xl">Campos internos (construtora)</h2>
          <p className="mb-4 text-sm text-muted">
            Não visíveis para síndico — causa raiz e custo pós-obra.
          </p>
          <form action={updateInternalFieldsAction} className="space-y-3">
            <input type="hidden" name="id" value={occ.id} />
            <Field label="Causa raiz">
              <input
                className={inputClass}
                name="internalRootCause"
                defaultValue={occ.internalRootCause ?? ""}
              />
            </Field>
            <Field label="Custo interno (R$)">
              <input
                className={inputClass}
                name="internalCost"
                type="number"
                step="0.01"
                defaultValue={occ.internalCost ?? ""}
              />
            </Field>
            <Field label="Notas internas">
              <textarea
                className={inputClass}
                name="internalNotes"
                rows={2}
                defaultValue={occ.internalNotes ?? ""}
              />
            </Field>
            {occ.internalCost != null ? (
              <p className="text-sm text-muted">
                Registrado: {formatBRL(occ.internalCost)}
              </p>
            ) : null}
            <PrimaryButton type="submit">Salvar internos</PrimaryButton>
          </form>
        </Card>
      ) : null}

      <Card>
        <h2 className="display mb-3 text-xl">Linha do tempo</h2>
        <ul className="space-y-3">
          {events.map((e) => (
            <li key={e.id} className="border-b border-line pb-2 text-sm">
              <p className="font-medium">{e.type}</p>
              <p className="text-muted">
                {e.note} · {formatDate(e.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
