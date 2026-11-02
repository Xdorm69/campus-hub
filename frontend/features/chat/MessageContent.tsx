import { Fragment } from "react";
import { cn } from "@/lib/utils";

/**
 * Tiny, safe subset of Discord markdown: ```code blocks```, `inline code`,
 * **bold**, *italics*, bare links and @mentions. Everything renders as React
 * text nodes — no HTML injection.
 */

const URL_PATTERN = /(https?:\/\/[^\s<]+[^\s<.,:;"')\]!?])/g;
const INLINE_PATTERN = /(`[^`\n]+`|\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g;
// Mirrors backend/utils/mentions.js.
const MENTION_PATTERN = /((?<![\w@])@[a-zA-Z0-9_]{3,20}(?![\w]))/g;

/** Lowercased username -> whether it's the current user. */
type MentionMap = Map<string, boolean>;

function renderMentions(text: string, keyPrefix: string, mentions: MentionMap) {
  if (mentions.size === 0) return text;

  return text.split(MENTION_PATTERN).map((part, index) => {
    const key = `${keyPrefix}-m${index}`;
    // Only names the server resolved to real members become pills.
    const isMe = index % 2 === 1 ? mentions.get(part.slice(1).toLowerCase()) : undefined;
    if (isMe === undefined) return <Fragment key={key}>{part}</Fragment>;

    return (
      <span
        key={key}
        className={cn(
          "rounded px-0.5 font-medium",
          isMe ? "bg-warning/25 text-warning" : "bg-primary/20 text-primary"
        )}
      >
        {part}
      </span>
    );
  });
}

function renderLinks(text: string, keyPrefix: string, mentions: MentionMap) {
  return text.split(URL_PATTERN).map((part, index) =>
    index % 2 === 1 ? (
      <a
        key={`${keyPrefix}-l${index}`}
        href={part}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="text-primary hover:underline"
      >
        {part}
      </a>
    ) : (
      <Fragment key={`${keyPrefix}-t${index}`}>{renderMentions(part, `${keyPrefix}-t${index}`, mentions)}</Fragment>
    )
  );
}

function renderInline(text: string, keyPrefix: string, mentions: MentionMap) {
  return text.split(INLINE_PATTERN).map((part, index) => {
    const key = `${keyPrefix}-i${index}`;
    if (index % 2 === 0) return <Fragment key={key}>{renderLinks(part, key, mentions)}</Fragment>;

    if (part.startsWith("`")) {
      return (
        <code key={key} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**")) {
      return <strong key={key}>{renderLinks(part.slice(2, -2), key, mentions)}</strong>;
    }
    return <em key={key}>{renderLinks(part.slice(1, -1), key, mentions)}</em>;
  });
}

interface MessageContentProps {
  content: string;
  suffix?: React.ReactNode;
  mentions?: { id: string; username: string }[];
  meId?: string;
}

export function MessageContent({ content, suffix, mentions = [], meId }: MessageContentProps) {
  const segments = content.split(/```(?:[a-z0-9]*\n)?([\s\S]*?)```/gi);
  const mentionMap: MentionMap = new Map(mentions.map((m) => [m.username.toLowerCase(), m.id === meId]));

  return (
    <div className="whitespace-pre-wrap break-words text-[15px] leading-[1.375rem]">
      {segments.map((segment, index) =>
        index % 2 === 1 ? (
          <pre
            key={index}
            className="my-1 max-w-full overflow-x-auto whitespace-pre rounded-md border border-border bg-muted p-2 font-mono text-[13px] leading-5"
          >
            {segment.replace(/\n$/, "")}
          </pre>
        ) : (
          <Fragment key={index}>{renderInline(segment, String(index), mentionMap)}</Fragment>
        )
      )}
      {suffix}
    </div>
  );
}
