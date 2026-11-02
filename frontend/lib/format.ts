const timeFormatter = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
const dateFormatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });
const longDateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});
const fullFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "full", timeStyle: "short" });

export function isSameDay(a: string | Date, b: string | Date) {
  const first = new Date(a);
  const second = new Date(b);
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function isYesterday(date: Date) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday);
}

/** "Today at 3:04 PM", "Yesterday at 9:12 AM", or "Mar 3, 2026 3:04 PM". */
export function formatMessageTimestamp(iso: string) {
  const date = new Date(iso);
  const time = timeFormatter.format(date);

  if (isSameDay(date, new Date())) return `Today at ${time}`;
  if (isYesterday(date)) return `Yesterday at ${time}`;
  return `${dateFormatter.format(date)} ${time}`;
}

export function formatTime(iso: string) {
  return timeFormatter.format(new Date(iso));
}

export function formatDate(iso: string) {
  return dateFormatter.format(new Date(iso));
}

export function formatDayDivider(iso: string) {
  return longDateFormatter.format(new Date(iso));
}

export function formatFullDate(iso: string) {
  return fullFormatter.format(new Date(iso));
}

export function formatRelative(iso: string | null) {
  if (!iso) return "No activity yet";

  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";

  const units: [number, string][] = [
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.35, "week"],
    [12, "month"],
    [Infinity, "year"],
  ];

  let value = seconds / 60;
  let unit = "minute";
  for (const [size, name] of units) {
    unit = name;
    if (value < size) break;
    value /= size;
  }

  const rounded = Math.floor(value);
  return `${rounded} ${unit}${rounded === 1 ? "" : "s"} ago`;
}

/** 75_000 -> "1:15" */
export function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatCount(count: number, max = 99) {
  return count > max ? `${max}+` : String(count);
}
