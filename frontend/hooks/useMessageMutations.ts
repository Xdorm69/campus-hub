"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { messageService } from "@/services/message.service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/api-error";
import {
  appendMessage,
  findMessage,
  MessagesData,
  removeMessage,
  resolveOptimisticMessage,
  updateMessage,
} from "@/lib/message-cache";
import { Message, SendMessagePayload } from "@/types/message";
import { CurrentUser } from "@/types/user";

/** Read/write access to one room's history cache. */
function useMessagesCache(classId: string) {
  const queryClient = useQueryClient();
  const key = queryKeys.messages.list(classId);

  return {
    get: () => queryClient.getQueryData<MessagesData>(key),
    set: (updater: (old: MessagesData | undefined) => MessagesData | undefined) =>
      queryClient.setQueryData<MessagesData>(key, updater),
    me: () => queryClient.getQueryData<CurrentUser>(queryKeys.me),
  };
}

function buildOptimisticMessage(
  classId: string,
  me: CurrentUser | undefined,
  payload: SendMessagePayload
): Message {
  const now = new Date().toISOString();

  return {
    // Not crypto.randomUUID(): that's unavailable on plain-http LAN origins.
    id: `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    classId,
    author: me
      ? { id: me.id, username: me.username, avatarUrl: me.avatarUrl, role: me.role }
      : null,
    content: payload.content,
    // Local previews; the real URLs come back from the server.
    attachments: payload.files.map((file, index) => ({
      id: `temp-file-${index}`,
      url: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
      name: file.name,
      mimeType: file.type,
      size: file.size,
    })),
    replyTo: payload.replyTo
      ? {
          id: payload.replyTo.id,
          author: payload.replyTo.author,
          content: payload.replyTo.content,
          hasAttachments: payload.replyTo.attachments.length > 0,
          isDeleted: false,
        }
      : null,
    reactions: [],
    editedAt: null,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
    clientStatus: "sending",
    clientPayload: payload,
  };
}

function revokePreviewUrls(message: Message | undefined) {
  message?.attachments.forEach((a) => a.url.startsWith("blob:") && URL.revokeObjectURL(a.url));
}

/**
 * Sends with an optimistic placeholder. On failure the placeholder stays in
 * the list marked "failed" so the user can retry or discard it.
 */
export function useSendMessage(classId: string) {
  const cache = useMessagesCache(classId);

  return useMutation({
    mutationFn: (payload: SendMessagePayload) => messageService.send(classId, payload),
    onMutate: (payload) => {
      const optimistic = buildOptimisticMessage(classId, cache.me(), payload);
      cache.set((old) => appendMessage(old, optimistic));
      return { tempId: optimistic.id };
    },
    onSuccess: (message, _payload, context) => {
      revokePreviewUrls(findMessage(cache.get(), context.tempId));
      cache.set((old) => resolveOptimisticMessage(old, context.tempId, message));
    },
    onError: (error, _payload, context) => {
      if (!context) return;
      cache.set((old) =>
        updateMessage(old, context.tempId, (m) => ({ ...m, clientStatus: "failed" }))
      );
      toast.error(getErrorMessage(error, "Message failed to send"));
    },
  });
}

export function useDiscardFailedMessage(classId: string) {
  const cache = useMessagesCache(classId);

  return (tempId: string) => {
    revokePreviewUrls(findMessage(cache.get(), tempId));
    cache.set((old) => removeMessage(old, tempId));
  };
}

export function useEditMessage(classId: string) {
  const cache = useMessagesCache(classId);

  return useMutation({
    mutationFn: ({ messageId, content }: { messageId: string; content: string }) =>
      messageService.edit(messageId, content),
    onMutate: ({ messageId, content }) => {
      const previous = findMessage(cache.get(), messageId);
      cache.set((old) =>
        updateMessage(old, messageId, (m) => ({
          ...m,
          content,
          editedAt: new Date().toISOString(),
        }))
      );
      return { previous };
    },
    onSuccess: (message) => cache.set((old) => updateMessage(old, message.id, () => message)),
    onError: (error, { messageId }, context) => {
      if (context?.previous) {
        cache.set((old) => updateMessage(old, messageId, () => context.previous!));
      }
      toast.error(getErrorMessage(error, "Couldn't edit message"));
    },
  });
}

export function useDeleteMessage(classId: string) {
  const cache = useMessagesCache(classId);

  return useMutation({
    mutationFn: (messageId: string) => messageService.remove(messageId),
    onMutate: (messageId) => {
      const snapshot = cache.get();
      cache.set((old) => removeMessage(old, messageId));
      return { snapshot };
    },
    onError: (error, _messageId, context) => {
      if (context?.snapshot) cache.set(() => context.snapshot);
      toast.error(getErrorMessage(error, "Couldn't delete message"));
    },
  });
}

export function useToggleReaction(classId: string) {
  const cache = useMessagesCache(classId);

  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      messageService.toggleReaction(messageId, emoji),
    onMutate: ({ messageId, emoji }) => {
      const me = cache.me();
      const previous = findMessage(cache.get(), messageId);
      if (!me || !previous) return { previous };

      cache.set((old) =>
        updateMessage(old, messageId, (message) => {
          const existing = message.reactions.find((r) => r.emoji === emoji);
          const reacted = existing?.userIds.includes(me.id);

          const reactions = existing
            ? message.reactions.map((r) => {
                if (r.emoji !== emoji) return r;
                const userIds = reacted
                  ? r.userIds.filter((id) => id !== me.id)
                  : [...r.userIds, me.id];
                return { ...r, userIds, count: userIds.length };
              })
            : [...message.reactions, { emoji, count: 1, userIds: [me.id] }];

          return { ...message, reactions: reactions.filter((r) => r.count > 0) };
        })
      );

      return { previous };
    },
    onSuccess: (message) => cache.set((old) => updateMessage(old, message.id, () => message)),
    onError: (error, { messageId }, context) => {
      if (context?.previous) {
        cache.set((old) => updateMessage(old, messageId, () => context.previous!));
      }
      toast.error(getErrorMessage(error, "Couldn't update reaction"));
    },
  });
}
