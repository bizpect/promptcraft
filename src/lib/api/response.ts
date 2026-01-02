import { NextResponse } from "next/server";

export function errorResponse(
  code: string,
  message: string,
  status = 400
) {
  return NextResponse.json({ code, message }, { status });
}
