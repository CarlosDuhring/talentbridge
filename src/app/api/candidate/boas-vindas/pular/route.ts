import { NextResponse } from "next/server";
import { requireCandidate } from "@/lib/auth";

async function skip(req: Request) {
  const session = await requireCandidate();
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  const res = NextResponse.redirect(new URL("/candidato", req.url));
  res.cookies.set("tb_welcome_skipped", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export async function GET(req: Request) {
  return skip(req);
}

export async function POST(req: Request) {
  return skip(req);
}
