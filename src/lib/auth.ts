import { cookies } from "next/headers";
import { randomBytes, createHash } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

const COOKIE = "tb_session";
const SESSION_DAYS = 7;

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: { token: hashToken(token), userId, expiresAt },
  });
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token: hashToken(token) } });
  }
  store.delete(COOKIE);
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "CANDIDATE" | "COMPANY";
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token: hashToken(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role as SessionUser["role"],
  };
}

export async function requireCandidate() {
  const user = await getSessionUser();
  if (!user || user.role !== "CANDIDATE") return null;
  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) return null;
  return { user, profile };
}

export async function requireCompany() {
  const user = await getSessionUser();
  if (!user || user.role !== "COMPANY") return null;
  const profile = await prisma.companyProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) return null;
  return { user, profile };
}
