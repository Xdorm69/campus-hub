"use client";

import { useEffect, useMemo } from "react";
import { FileText, X } from "lucide-react";
import { formatBytes } from "@/lib/format";

/** Thumbnails for files queued in the composer. */
export function ComposerAttachments({
  files,
  onRemove,
}: {
  files: File[];
  onRemove: (index: number) => void;
}) {
  const previews = useMemo(
    () =>
      files.map((file) =>
        file.type.startsWith("image/") || file.type.startsWith("video/") ? URL.createObjectURL(file) : null
      ),
    [files]
  );

  useEffect(
    () => () => previews.forEach((url) => url && URL.revokeObjectURL(url)),
    [previews]
  );

  if (files.length === 0) return null;

  return (
    <div className="flex gap-3 overflow-x-auto border-b border-border/60 p-3">
      {files.map((file, index) => (
        <div
          key={`${file.name}-${file.lastModified}-${index}`}
          className="relative flex w-44 shrink-0 flex-col rounded-md bg-card p-2"
        >
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow"
            aria-label={`Remove ${file.name}`}
          >
            <X className="h-3 w-3" />
          </button>

          <div className="flex h-28 items-center justify-center overflow-hidden rounded bg-muted">
            {previews[index] && file.type.startsWith("video/") ? (
              // First frame as a thumbnail.
              <video src={previews[index]!} muted playsInline preload="metadata" className="h-full w-full object-cover" />
            ) : previews[index] ? (
              // eslint-disable-next-line @next/next/no-img-element -- local blob preview
              <img src={previews[index]!} alt={file.name} className="h-full w-full object-cover" />
            ) : (
              <FileText className="h-10 w-10 text-primary" />
            )}
          </div>
          <p className="mt-1.5 truncate text-xs font-medium">{file.name}</p>
          <p className="text-[11px] text-muted-foreground">{formatBytes(file.size)}</p>
        </div>
      ))}
    </div>
  );
}
