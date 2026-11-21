import { desc, eq } from "drizzle-orm";
import {
  confirmTriageAction,
  triageTextAction,
} from "@/app/actions/ai";
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
import { aiSuggestions, systems } from "@/db/schema";
import type { TriageResult } from "@/lib/ai/triage";
import { getSession } from "@/lib/auth";
import { formatDate } from "@/lib/format";

export default async function AiTriagePage({
  searchParams,
}: {
  searchParams: Promise<{ sid?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const sp = await searchParams;

  const suggestion = sp.sid
    ? db
        .select()
        .from(aiSuggestions)
        .where(eq(aiSuggestions.id, Number(sp.sid)))
        .get()
    : null;

  const recent = db
    .select()
    .from(aiSuggestions)
    .where(eq(aiSuggestions.buildingId, session.buildingId))
    .orderBy(desc(aiSuggestions.createdAt))
    .all()
    .filter((s) => s.kind === "triage")
    .slice(0, 8);

  const sys = db
    .select()
    .from(systems)
    .where(eq(systems.buildingId, session.buildingId))
    .all();

  const result = suggestion
    ? (JSON.parse(suggestion.resultJson) as TriageResult)
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Triagem com IA"
        subtitle="Texto e/ou foto → tipo, prioridade e sistema. Confirme antes de gravar."
      />

      <Card>
        <form
          action={triageTextAction}
          className="space-y-3"
          encType="multipart/form-data"
        >
          <Field label="Relato">
            <textarea
              className={inputClass}
              name="text"
              rows={4}
              placeholder="Ex.: Elevador do bloco A parou no 3º andar com gente dentro"
            />
          </Field>
          <Field label="Foto (opcional)">
            <input className={inputClass} type="file" name="photo" accept="image/*" />
          </Field>
          <Field label="Legenda da foto">
            <input
              className={inputClass}
              name="caption"
              placeholder="Ex.: Infiltração na garagem"
            />
          </Field>
          <PrimaryButton type="submit">Analisar</PrimaryButton>
        </form>
      </Card>

      {suggestion && result ? (
        <Card className="space-y-3">
          <h2 className="text-base font-semibold">Sugestão #{suggestion.id}</h2>
          {suggestion.imagePath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={suggestion.imagePath}
              alt="Foto da triagem"
              className="max-h-56 rounded-[var(--radius-md)] object-cover"
            />
          ) : null}
          <p className="text-sm text-muted">{suggestion.inputText}</p>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Classificação</dt>
              <dd className="font-medium">{result.classification}</dd>
            </div>
            <div>
              <dt className="text-muted">Prioridade</dt>
              <dd className="font-medium">{result.priority}</dd>
            </div>
            <div>
              <dt className="text-muted">Sistema</dt>
              <dd className="font-medium">
                {result.suggestedSystemName ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Motor</dt>
              <dd className="font-medium">
                {result.engine} · conf. {(result.confidence * 100).toFixed(0)}%
              </dd>
            </div>
          </dl>
          <p className="text-sm">{result.rationale}</p>

          <form action={confirmTriageAction} className="space-y-3 border-t border-line pt-3">
            <input type="hidden" name="suggestionId" value={suggestion.id} />
            <Field label="Título">
              <input
                className={inputClass}
                name="title"
                defaultValue={result.title}
              />
            </Field>
            <Field label="Descrição">
              <textarea
                className={inputClass}
                name="description"
                rows={3}
                defaultValue={result.description}
              />
            </Field>
            <Field label="Prioridade">
              <select
                className={inputClass}
                name="priority"
                defaultValue={result.priority}
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </Field>
            <Field label="Sistema">
              <select
                className={inputClass}
                name="systemId"
                defaultValue={result.suggestedSystemId ?? ""}
              >
                <option value="">—</option>
                {sys.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex flex-wrap gap-2">
              <PrimaryButton type="submit" name="action" value="create">
                Criar ocorrência
              </PrimaryButton>
              {result.matchedOccurrenceId ? (
                <SecondaryButton type="submit" name="action" value="link">
                  Vincular a {result.matchedOccurrenceCode}
                </SecondaryButton>
              ) : null}
              <SecondaryButton type="submit" name="action" value="ignore">
                Ignorar
              </SecondaryButton>
            </div>
          </form>
        </Card>
      ) : null}

      <Card>
        <h2 className="mb-3 text-base font-semibold">Histórico recente</h2>
        {!recent.length ? (
          <Empty>Nenhuma triagem ainda.</Empty>
        ) : (
          <ul className="space-y-2 text-sm">
            {recent.map((r) => (
              <li key={r.id} className="flex justify-between gap-2 border-b border-line pb-2">
                <a href={`/ai/triage?sid=${r.id}`} className="truncate font-medium underline-offset-2 hover:underline">
                  {r.inputText?.slice(0, 60) || `Sugestão #${r.id}`}
                </a>
                <span className="shrink-0 text-muted">
                  {r.status} · {formatDate(r.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
