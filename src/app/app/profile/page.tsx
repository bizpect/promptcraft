"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import {
  AVATAR_ALLOWED_TYPES,
  AVATAR_MAX_BYTES,
  AVATAR_MAX_DIMENSION,
  appendAvatarVersion,
} from "@/lib/avatar";

type UserProfile = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  updated_at: string | null;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarVersion, setAvatarVersion] = useState<string | number | null>(
    null
  );

  const maxUploadMb = Math.round(AVATAR_MAX_BYTES / 1024 / 1024);
  const avatarDisplayUrl = avatarUrl
    ? appendAvatarVersion(
        avatarUrl,
        avatarVersion ?? profile?.updated_at ?? null
      )
    : "";

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        const response = await fetch("/api/users/me", {
          credentials: "include",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "프로필 조회 실패");
        }

        if (!cancelled) {
          setProfile(data.profile);
          setDisplayName(data.profile.display_name ?? "");
          setAvatarUrl(data.profile.avatar_url ?? "");
          setAvatarVersion(data.profile.updated_at ?? null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "프로필 조회 실패"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          avatar_url: avatarUrl,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "프로필 저장 실패");
      }

      setProfile(data.profile);
      setSuccess("프로필이 저장되었습니다.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-black/60">불러오는 중...</p>;
  }

  if (error && !profile) {
    return <ErrorState title="프로필을 불러오지 못했습니다." body={error} />;
  }

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !profile) {
      return;
    }

    const fileType = file.type as (typeof AVATAR_ALLOWED_TYPES)[number];
    if (!AVATAR_ALLOWED_TYPES.includes(fileType)) {
      setError("지원하지 않는 이미지 형식입니다. JPG/PNG/WEBP만 가능합니다.");
      event.target.value = "";
      return;
    }

    if (file.size > AVATAR_MAX_BYTES) {
      setError(`이미지 용량은 ${maxUploadMb}MB 이하만 가능합니다.`);
      event.target.value = "";
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const resized = await resizeAvatarImage(file, AVATAR_MAX_DIMENSION);
      const extension = resized.type === "image/png" ? "png" : "webp";
      const uploadFile = new File(
        [resized.blob],
        `avatar.${extension}`,
        { type: resized.type }
      );
      const previewUrl = URL.createObjectURL(resized.blob);
      setAvatarPreviewUrl(previewUrl);

      const formData = new FormData();
      formData.append("avatar", uploadFile);

      const response = await fetch("/api/users/avatar", {
        method: "POST",
        body: formData,
      });
      const saved = await response.json();

      if (!response.ok) {
        throw new Error(saved.message || "프로필 저장 실패");
      }

      setProfile(saved.profile);
      setAvatarUrl(saved.profile.avatar_url ?? "");
      setAvatarVersion(saved.profile.updated_at ?? Date.now());
      setAvatarPreviewUrl(null);
      setSuccess("프로필 이미지가 업데이트되었습니다.");
    } catch (uploadErr) {
      setAvatarPreviewUrl(null);
      setError(uploadErr instanceof Error ? uploadErr.message : "업로드 실패");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleAvatarRemove = async () => {
    if (!profile) {
      return;
    }

    setRemoving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/users/avatar", { method: "DELETE" });
      const saved = await response.json();

      if (!response.ok) {
        throw new Error(saved.message || "프로필 삭제 실패");
      }

      setProfile(saved.profile);
      setAvatarUrl(saved.profile.avatar_url ?? "");
      setAvatarVersion(saved.profile.updated_at ?? Date.now());
      setAvatarPreviewUrl(null);
      setSuccess("프로필 이미지가 삭제되었습니다.");
    } catch (removeErr) {
      setError(removeErr instanceof Error ? removeErr.message : "삭제 실패");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">프로필 설정</h1>
        <p className="text-sm text-black/60">
          표시 이름과 프로필 이미지를 관리합니다.
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="space-y-4 rounded-xl border border-black/10 bg-white p-5 text-sm"
      >
        <div className="space-y-2">
          <label className="text-sm font-medium">이메일</label>
          <p className="text-black/70">{profile?.email ?? "미설정"}</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">프로필 이미지</label>
          {avatarPreviewUrl || avatarUrl ? (
            <img
              src={avatarPreviewUrl ?? avatarDisplayUrl}
              alt="프로필 이미지"
              className="h-16 w-16 rounded-full border border-black/10 object-cover"
            />
          ) : (
            <p className="text-black/60">등록된 이미지가 없습니다.</p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarUpload}
              disabled={uploading || removing}
              className="text-sm"
            />
            <Button
              type="button"
              variant="ghost"
              onClick={handleAvatarRemove}
              disabled={!avatarUrl || uploading || removing}
            >
              {removing ? "삭제 중..." : "이미지 삭제"}
            </Button>
          </div>
          <p className="text-xs text-black/50">
            JPG/PNG/WEBP, {maxUploadMb}MB 이하. 업로드 시 자동 리사이즈됩니다.
          </p>
          {uploading && <p className="text-black/60">업로드 중...</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="displayName">
            표시 이름
          </label>
          <input
            id="displayName"
            className="h-10 w-full rounded-md border border-black/10 px-3"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="이름을 입력하세요"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="avatarUrl">
            프로필 이미지 URL
          </label>
          <input
            id="avatarUrl"
            className="h-10 w-full rounded-md border border-black/10 px-3"
            value={avatarUrl}
            onChange={(event) => setAvatarUrl(event.target.value)}
            placeholder="https://"
          />
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? "저장 중..." : "저장"}
        </Button>

        {success && <p className="text-green-600">{success}</p>}
        {error && <p className="text-red-600">{error}</p>}
      </form>
    </div>
  );
}

async function resizeAvatarImage(file: File, maxDimension: number) {
  const image = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.round(image.width * scale);
  const height = Math.round(image.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("이미지 처리에 실패했습니다.");
  }

  context.drawImage(image, 0, 0, width, height);

  const blobWebp = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", 0.85);
  });

  const blob =
    blobWebp ||
    (await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/png");
    }));

  if (!blob) {
    throw new Error("이미지 변환에 실패했습니다.");
  }

  return {
    blob,
    type: blobWebp ? "image/webp" : "image/png",
  };
}
