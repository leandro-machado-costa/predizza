import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/db";
import { buildings, memberships, users, type Role } from "@/db/schema";

const COOKIE = "prediza_session";
const SECRET = process.env.AUTH_SECRET ?? "prediza-dev-secret-change-me";

export type SessionUser = {
  id: number;
  email: string;
  name: string;
  buildingId: number;
  buildingSlug: string;
  buildingName: string;
  role: Role;
};

function sign(payload: string) {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: number) {
  const payload = `${userId}.${Date.now()}`;
  const token = `${payload}.${sign(payload)}`;
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

function readUserId(token: string | undefined): number | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, ts, sig] = parts;
  const payload = `${userId}.${ts}`;
  const expected = sign(payload);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  const id = Number(userId);
  return Number.isFinite(id) ? id : null;
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const userId = readUserId(jar.get(COOKIE)?.value);
  if (!userId) return null;

  const row = db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      buildingId: memberships.buildingId,
      role: memberships.role,
      buildingSlug: buildings.slug,
      buildingName: buildings.name,
    })
    .from(users)
    .innerJoin(memberships, eq(memberships.userId, users.id))
    .innerJoin(buildings, eq(buildings.id, memberships.buildingId))
    .where(eq(users.id, userId))
    .limit(1)
    .get();

  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    buildingId: row.buildingId,
    buildingSlug: row.buildingSlug,
    buildingName: row.buildingName,
    role: row.role as Role,
  };
}

export async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}
