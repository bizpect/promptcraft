import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

import { getSupabaseConfig } from "@/lib/supabase/config";
import { insertLoginEvent } from "@/lib/db";

function getRedirectPath(request: NextRequest) {
  const redirectedFrom = request.nextUrl.searchParams.get("redirectedFrom");
  if (redirectedFrom && redirectedFrom.startsWith("/")) {
    return redirectedFrom;
  }
  return "/app";
}

function resolveLoginType(user: User | null): string | null {
  const provider = user?.app_metadata?.provider;
  if (typeof provider === "string" && provider.length > 0) {
    return provider;
  }

  const identityProvider = user?.identities?.[0]?.provider;
  if (typeof identityProvider === "string" && identityProvider.length > 0) {
    return identityProvider;
  }

  return null;
}

function mapLoginTypeToCode(loginType: string | null): string | null {
  switch (loginType) {
    case "google":
      return "G";
    case "tiktok":
      return "T";
    case "kakao":
      return "K";
    case "facebook":
      return "F";
    default:
      return null;
  }
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

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const loginType = resolveLoginType(userData?.user ?? null);
  const loginTypeCode = mapLoginTypeToCode(loginType);

  if (!userError && loginTypeCode) {
    const { error: loginError } = await insertLoginEvent(supabase, {
      loginType: loginTypeCode,
    });

    if (loginError) {
      console.error("Failed to record login event:", loginError);
    }
  }

  return response;
}
