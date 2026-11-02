import { api } from "@/lib/axios";
import { MESSAGES_PAGE_SIZE } from "@/lib/constants";
import { ApiResponse } from "@/types/api";
import { Message, MessagePage, MessageSyncResponse, SendMessagePayload } from "@/types/message";

export const messageService = {
  /** Page of history older than `before` (or the latest page when null). */
  async list(classId: string, before: string | null): Promise<MessagePage> {
    const { data } = await api.get<ApiResponse<MessagePage>>(`/classes/${classId}/messages`, {
      params: { before: before ?? undefined, limit: MESSAGES_PAGE_SIZE },
    });
    return data.data;
  },

  /** Everything that changed since `since` — used by polling. */
  async sync(classId: string, since: string, signal?: AbortSignal): Promise<MessageSyncResponse> {
    const { data } = await api.get<ApiResponse<MessageSyncResponse>>(
      `/classes/${classId}/messages/sync`,
      { params: { since }, signal }
    );
    return data.data;
  },

  async send(classId: string, { content, files, voice, replyTo }: SendMessagePayload): Promise<Message> {
    const form = new FormData();
    form.append("content", content);
    if (replyTo) form.append("replyTo", replyTo.id);
    files.forEach((file) => form.append("files", file));
    if (voice) {
      form.append("voice", voice.file);
      form.append("voiceDurationMs", String(Math.round(voice.durationMs)));
    }

    const { data } = await api.post<ApiResponse<Message>>(`/classes/${classId}/messages`, form);
    return data.data;
  },

  async edit(messageId: string, content: string): Promise<Message> {
    const { data } = await api.patch<ApiResponse<Message>>(`/messages/${messageId}`, { content });
    return data.data;
  },

  async remove(messageId: string): Promise<Message> {
    const { data } = await api.delete<ApiResponse<Message>>(`/messages/${messageId}`);
    return data.data;
  },

  async toggleReaction(messageId: string, emoji: string): Promise<Message> {
    const { data } = await api.put<ApiResponse<Message>>(`/messages/${messageId}/reactions`, {
      emoji,
    });
    return data.data;
  },
};
