import { Fragment } from "react";

/**
 * Tiny, safe subset of Discord markdown: ```code blocks```, `inline code`,
 * **bold**, *italics* and bare links. Everything renders as React text
 * nodes — no HTML injection.
 */

const URL_PATTERN = /(https?:\/\/[^\s<]+[^\s<.,:;"')\]!?])/g;
const INLINE_PATTERN = /(`[^`\n]+`|\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g;

function renderLinks(text: string, keyPrefix: string) {
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
      <Fragment key={`${keyPrefix}-t${index}`}>{part}</Fragment>
    )
  );
}

function renderInline(text: string, keyPrefix: string) {
  return text.split(INLINE_PATTERN).map((part, index) => {
    const key = `${keyPrefix}-i${index}`;
    if (index % 2 === 0) return <Fragment key={key}>{renderLinks(part, key)}</Fragment>;

    if (part.startsWith("`")) {
      return (
        <code key={key} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**")) {
      return <strong key={key}>{renderLinks(part.slice(2, -2), key)}</strong>;
    }
    return <em key={key}>{renderLinks(part.slice(1, -1), key)}</em>;
  });
}

export function MessageContent({ content, suffix }: { content: string; suffix?: React.ReactNode }) {
  const segments = content.split(/```(?:[a-z0-9]*\n)?([\s\S]*?)```/gi);

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
          <Fragment key={index}>{renderInline(segment, String(index))}</Fragment>
        )
      )}
      {suffix}
    </div>
  );
}
