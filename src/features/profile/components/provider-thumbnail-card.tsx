"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { compressImage } from "@/lib/compress-image";
import { updateProviderCoverImage } from "../profile.service";

type CoverImageProvider = {
  id: string;
  name: string;
  media: { thumbnail: string | null };
};

export function ProviderThumbnailCard({
  provider,
  canEdit,
  onSaved,
}: {
  provider: CoverImageProvider;
  canEdit: boolean;
  onSaved: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error("Select a thumbnail image.");
      return updateProviderCoverImage(provider.id, file);
    },
    onMutate: () => setError(null),
    onSuccess: () => {
      onSaved();
      setFile(null);
      setPreviewUrl(null);
    },
    onError: () => setError("Unable to update the thumbnail. Your selected image has been preserved."),
  });

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  async function selectImage(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (!selected) return;

    try {
      const compressed = await compressImage(selected, { maxWidth: 768, quality: 0.95 });
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(compressed);
      setPreviewUrl(URL.createObjectURL(compressed));
      setError(null);
    } catch (compressionError) {
      setError(compressionError instanceof Error ? compressionError.message : "Unable to prepare the selected image.");
    }
  }

  function clearSelection() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setError(null);
  }

  const source = previewUrl ?? provider.media.thumbnail;

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-extrabold">
          <i className="fa-solid fa-image text-brand" aria-hidden="true" />
          Thumbnail
        </h2>
        {canEdit && (
          <>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={mutation.isPending}
              className="rounded-lg bg-brand-50 px-3 py-1.5 text-[11px] font-extrabold text-brand disabled:opacity-50"
            >
              <i className="fa-solid fa-pen mr-1" aria-hidden="true" />
              Edit
            </button>
            <input ref={inputRef} type="file" accept="image/*" onChange={selectImage} className="sr-only" />
          </>
        )}
      </div>

      <div className="mt-3">
        {source ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-100">
            {previewUrl ? (
              <img src={previewUrl} alt="Selected thumbnail preview" className="size-full object-cover" />
            ) : (
              <Image src={source} alt={`${provider.name} thumbnail`} fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
            )}
            {previewUrl && <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-1 text-[10px] font-extrabold text-white">New</span>}
          </div>
        ) : canEdit ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-video w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-foreground-muted"
          >
            <i className="fa-solid fa-image text-2xl" aria-hidden="true" />
            <span className="mt-2 text-xs font-bold">Select a thumbnail</span>
          </button>
        ) : (
          <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-slate-100 text-foreground-muted">
            <i className="fa-solid fa-image text-2xl" aria-hidden="true" />
          </div>
        )}

        {error && <p role="alert" className="mt-3 text-sm font-semibold text-danger">{error}</p>}
        {canEdit && file && (
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={clearSelection} disabled={mutation.isPending} className="h-11 flex-1 rounded-xl border border-slate-200 text-sm font-extrabold">
              Cancel
            </button>
            <button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending} className="h-11 flex-1 rounded-xl bg-brand text-sm font-extrabold text-white disabled:opacity-50">
              {mutation.isPending ? "Saving..." : "Save thumbnail"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
