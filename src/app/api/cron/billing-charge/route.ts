import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization") ?? "";
  const bearer =
    authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const headerSecret = request.headers.get("x-cron-secret");
  const providedSecret =
    (bearer && bearer.length > 0 ? bearer : null) ?? headerSecret ?? null;
  const userAgent = request.headers.get("user-agent") ?? "";
  const isVercelCron = userAgent.toLowerCase().includes("vercel-cron");

  if (!isVercelCron) {
    if (!cronSecret || !providedSecret || cronSecret !== providedSecret) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
  }

  const projectRef = process.env.NEXT_PUBLIC_SB_URL?.match(
    /https:\/\/([^.]+)\.supabase\.co/
  )?.[1];

  if (!projectRef) {
    return NextResponse.json(
      { ok: false, error: "Missing Supabase project ref" },
      { status: 500 }
    );
  }

  const url = `https://${projectRef}.functions.supabase.co/billing-charge`;
  const response = await fetch(url, { method: "POST" });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return NextResponse.json({ ok: false, data }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}
