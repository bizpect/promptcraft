import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { getSupabaseConfig } from "@/lib/supabase/config";

function getRedirectPath(request: NextRequest) {
  const redirectedFrom = request.nextUrl.searchParams.get("redirectedFrom");
  if (redirectedFrom && redirectedFrom.startsWith("/")) {
    return redirectedFrom;
  }
  return "/app";
}

export async function GET(request: NextRequest) {
  const { url, anonKey } = getSupabaseConfig();
  const code = request.nextUrl.searchParams.get("code");
  const redirectPath = getRedirectPath(request);
  const response = NextResponse.redirect(new URL(redirectPath, request.url));

  if (!code) {
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      get(name) {
        return request.cookies.get(name)?.value;
      },
      set(name, value, options) {
        response.cookies.set({ name, value, ...options });
      },
      remove(name, options) {
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const errorUrl = new URL("/login", request.url);
    errorUrl.searchParams.set("error", "oauth");
    return NextResponse.redirect(errorUrl);
  }

  return response;
}
