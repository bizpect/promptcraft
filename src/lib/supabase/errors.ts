type SupabaseErrorLike = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

export function logSupabaseError(
  context: string,
  error: SupabaseErrorLike | null | undefined
) {
  if (!error) {
    return;
  }

  console.error(`[supabase] ${context}`, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
}
