type SupabaseErrorLike = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

export function logSupabaseError(
  context: string,
  error: unknown
) {
  if (!error) {
    return;
  }

  if (typeof error !== "object") {
    console.error(`[supabase] ${context}`, { message: String(error) });
    return;
  }

  const supabaseError = error as SupabaseErrorLike;
  const fallbackMessage = error instanceof Error ? error.message : undefined;

  console.error(`[supabase] ${context}`, {
    message: supabaseError.message ?? fallbackMessage,
    code: supabaseError.code,
    details: supabaseError.details,
    hint: supabaseError.hint,
  });
}
