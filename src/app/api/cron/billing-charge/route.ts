import { NextResponse } from "next/server";

export async function GET() {
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
