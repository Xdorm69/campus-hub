import { UserSummary } from "./user";

export interface Attachment {
  id: string;
  url: string;
  name: string;
  mimeType: string;
  size: number;
}

export interface ReplyPreview {
  id: string;
  author: UserSummary | null;
  content: string;
  hasAttachments: boolean;
  isDeleted: boolean;
}

export interface Reaction {
  emoji: string;
  count: number;
  userIds: string[];
}

export interface SendMessagePayload {
  content: string;
  files: File[];
  replyTo?: Message | null;
}

export interface Message {
  id: string;
  classId: string;
  /** null when the author's account was deleted. */
  author: UserSummary | null;
  content: string;
  attachments: Attachment[];
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
