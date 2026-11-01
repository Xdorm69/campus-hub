import { Download, FileText } from "lucide-react";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Attachment } from "@/types/message";

const isImage = (attachment: Attachment) => attachment.mimeType.startsWith("image/");

function ImageAttachment({ attachment }: { attachment: Attachment }) {
  // Optimistic non-image previews have no URL yet.
  if (!attachment.url) return null;

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block overflow-hidden rounded-lg bg-muted"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- user uploads on another origin */}
      <img
        src={attachment.url}
        alt={attachment.name}
        loading="lazy"
        className="max-h-80 w-auto max-w-full object-contain"
      />
    </a>
  );
}

function FileAttachment({ attachment }: { attachment: Attachment }) {
  return (
    <div className="flex w-full max-w-sm items-center gap-3 rounded-lg border border-border bg-muted/60 p-3">
      <FileText className="h-9 w-9 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        {attachment.url ? (
          <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate text-sm font-medium text-primary hover:underline"
          >
            {attachment.name}
          </a>
        ) : (
          <p className="truncate text-sm font-medium">{attachment.name}</p>
        )}
        <p className="text-xs text-muted-foreground">{formatBytes(attachment.size)}</p>
      </div>
      {attachment.url && (
        <a
          href={attachment.url}
          download={attachment.name}
          className="text-muted-foreground transition-colors hover:text-foreground"
          aria-label={`Download ${attachment.name}`}
        >
          <Download className="h-5 w-5" />
        </a>
      )}
    </div>
  );
}

export function MessageAttachments({ attachments }: { attachments: Attachment[] }) {
  if (attachments.length === 0) return null;

  const images = attachments.filter(isImage);
  const files = attachments.filter((a) => !isImage(a));

  return (
    <div className="mt-1 space-y-1.5">
      {images.length > 0 && (
        <div className={cn("grid max-w-lg gap-1.5", images.length > 1 && "grid-cols-2")}>
          {images.map((attachment) => (
            <ImageAttachment key={attachment.id} attachment={attachment} />
          ))}
        </div>
      )}
      {files.map((attachment) => (
        <FileAttachment key={attachment.id} attachment={attachment} />
      ))}
    </div>
  );
}
