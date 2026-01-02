import { NextResponse } from "next/server";

import { errorResponse } from "@/lib/api/response";
import { updateCurrentUserProfile } from "@/lib/db";
import {
  AVATAR_ALLOWED_TYPES,
  AVATAR_MAX_BYTES,
  detectAvatarMimeType,
  getAvatarExtension,
} from "@/lib/avatar";
import { logSupabaseError } from "@/lib/supabase/errors";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse("unauthorized", "로그인이 필요합니다.", 401);
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("avatar");

  if (!(file instanceof File)) {
    return errorResponse("invalid_input", "파일을 찾을 수 없습니다.", 400);
  }

  if (file.size > AVATAR_MAX_BYTES) {
    return errorResponse(
      "file_too_large",
      "이미지 용량은 2MB 이하만 가능합니다.",
      400
    );
  }

  const buffer = await file.arrayBuffer();
  const detectedType = detectAvatarMimeType(buffer);

  if (!detectedType || !AVATAR_ALLOWED_TYPES.includes(detectedType)) {
    return errorResponse(
      "invalid_file_type",
      "지원하지 않는 이미지 형식입니다.",
      400
    );
  }

  const extension = getAvatarExtension(detectedType);
  const filePath = `${user.id}/avatar.${extension}`;
  const uploadFile = new Blob([buffer], { type: detectedType });

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, uploadFile, {
      upsert: true,
      contentType: detectedType,
    });

  if (uploadError) {
    logSupabaseError("storage.avatars.upload", uploadError);
    return errorResponse("upload_failed", "업로드에 실패했습니다.", 500);
  }

  const { data: publicData } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);
  const publicUrl = publicData.publicUrl;

  const { data: profile, error } = await updateCurrentUserProfile(supabase, {
    displayName: null,
    avatarUrl: publicUrl,
  });

  if (error || !profile) {
    logSupabaseError("users.update_current_user_profile", error);
    return errorResponse("update_failed", "프로필 저장에 실패했습니다.", 500);
  }

  return NextResponse.json({ profile });
}

export async function DELETE() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse("unauthorized", "로그인이 필요합니다.", 401);
  }

  const filePaths = [
    `${user.id}/avatar.webp`,
    `${user.id}/avatar.png`,
    `${user.id}/avatar.jpg`,
  ];

  const { error: removeError } = await supabase.storage
    .from("avatars")
    .remove(filePaths);

  if (removeError) {
    logSupabaseError("storage.avatars.remove", removeError);
    return errorResponse("remove_failed", "이미지 삭제에 실패했습니다.", 500);
  }

  const { data: profile, error } = await updateCurrentUserProfile(supabase, {
    displayName: null,
    avatarUrl: "",
  });

  if (error || !profile) {
    logSupabaseError("users.update_current_user_profile", error);
    return errorResponse("update_failed", "프로필 저장에 실패했습니다.", 500);
  }

  return NextResponse.json({ profile });
}
