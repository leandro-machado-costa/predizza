"use server";

import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { invitations, memberships, users, type Role } from "@/db/schema";
import { hashPassword, requireSession } from "@/lib/auth";

export async function createInviteAction(formData: FormData) {
  const session = await requireSession();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "tecnico") as Role;
  if (!email || !name) throw new Error("Dados incompletos");

  const token = randomBytes(16).toString("hex");
  db.insert(invitations)
    .values({
      buildingId: session.buildingId,
      email,
      name,
      role,
      token,
      invitedBy: session.id,
    })
    .run();

  revalidatePath("/invites");
  redirect(`/invites?created=${token}`);
}

/** Aceite simplificado: cria usuário com senha predizza123 se não existir */
export async function acceptInviteAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "predizza123");
  const invite = db
    .select()
    .from(invitations)
    .where(eq(invitations.token, token))
    .get();
  if (!invite || invite.status !== "pending") {
    throw new Error("Convite inválido");
  }

  let user = db.select().from(users).where(eq(users.email, invite.email)).get();
  if (!user) {
    user = db
      .insert(users)
      .values({
        email: invite.email,
        name: invite.name,
        passwordHash: await hashPassword(password),
      })
      .returning()
      .get();
  }

  const existing = db
    .select()
    .from(memberships)
    .where(eq(memberships.userId, user.id))
    .get();
  if (!existing) {
    db.insert(memberships)
      .values({
        userId: user.id,
        buildingId: invite.buildingId,
        role: invite.role,
      })
      .run();
  }

  db.update(invitations)
    .set({ status: "accepted" })
    .where(eq(invitations.id, invite.id))
    .run();

  redirect("/login?invited=1");
}
