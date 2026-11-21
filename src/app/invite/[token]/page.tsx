import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { acceptInviteAction } from "@/app/actions/invites";
import {
  PageHeader,
  Card,
  Field,
  PrimaryButton,
  inputClass,
} from "@/components/ui";
import { db } from "@/db";
import { buildings, invitations } from "@/db/schema";

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = db
    .select()
    .from(invitations)
    .where(eq(invitations.token, token))
    .get();
  if (!invite) notFound();

  const building = db
    .select()
    .from(buildings)
    .where(eq(buildings.id, invite.buildingId))
    .get();

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-10">
      <PageHeader
        title="Aceitar convite"
        subtitle={`${invite.name} · ${invite.role} em ${building?.name ?? "edifício"}`}
      />
      {invite.status !== "pending" ? (
        <Card>
          <p className="text-sm text-muted">Este convite já foi {invite.status}.</p>
        </Card>
      ) : (
        <Card>
          <form action={acceptInviteAction} className="space-y-3">
            <input type="hidden" name="token" value={token} />
            <Field label="Senha inicial">
              <input
                className={inputClass}
                name="password"
                type="password"
                defaultValue="predizza123"
              />
            </Field>
            <PrimaryButton type="submit">Criar acesso e ir ao login</PrimaryButton>
          </form>
        </Card>
      )}
    </main>
  );
}
