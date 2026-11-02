import { UserSummary } from "./user";

export interface Attachment {
  id: string;
  /** "" for optimistic non-previewable files; null once a video has expired. */
  url: string | null;
  name: string;
  mimeType: string;
  size: number;
  isExpired?: boolean;
}

/** A GIF from the provider's search; its URLs point at the provider's CDN. */
export interface GifEmbed {
  provider: "klipy" | "giphy";
  providerId: string;
  title: string;
  /** Full-size loop (MP4 where available). */
  url: string;
  /** Small still/animated image for placeholders. */
  previewUrl: string | null;
  width: number;
  height: number;
}

export interface VoiceNote {
  /** null once the audio has expired (see VOICE_RETENTION_DAYS). */
  url: string | null;
  mimeType: string;
  size: number;
  durationMs: number;
  isExpired: boolean;
}

export interface ReplyPreview {
  id: string;
  author: UserSummary | null;
  content: string;
  hasAttachments: boolean;
  hasVoiceNote: boolean;
  hasGif: boolean;
  isDeleted: boolean;
}

/** A finished recording, ready to send. */
export interface VoiceRecording {
  file: File;
  durationMs: number;
}

export interface Reaction {
  emoji: string;
  count: number;
  userIds: string[];
}

export interface SendMessagePayload {
  content: string;
  files: File[];
  /** Voice messages and GIFs stand alone: no text or files alongside. */
  voice?: VoiceRecording | null;
  gif?: GifEmbed | null;
  replyTo?: Message | null;
}

export interface Message {
  id: string;
  classId: string;
  /** null when the author's account was deleted. */
  author: UserSummary | null;
  content: string;
  attachments: Attachment[];
  voiceNote: VoiceNote | null;
  gif: GifEmbed | null;
  replyTo: ReplyPreview | null;
  reactions: Reaction[];
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;

  // Client-only fields for optimistic sends.
  clientStatus?: "sending" | "failed";
  clientPayload?: SendMessagePayload;
}

/** One page of history, oldest -> newest. */
export interface MessagePage {
  messages: Message[];
  /** Cursor for the next *older* page; null at the start of the channel. */
  nextCursor: string | null;
  serverTime: string;
}

export interface MessageSyncResponse {
  messages: Message[];
  /** Too many changes to patch in place; refetch from scratch. */
  hasMore: boolean;
  serverTime: string;
}
