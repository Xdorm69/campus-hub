"use client";

import { createContext, RefObject, useCallback, useContext, useMemo, useRef, useState } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { ClassRoom } from "@/types/class";
import { Message } from "@/types/message";
import { CurrentUser } from "@/types/user";

interface ChatContextValue {
  classRoom: ClassRoom;
  me: CurrentUser;
  isAdmin: boolean;

  replyingTo: Message | null;
  startReply: (message: Message) => void;
  cancelReply: () => void;

  editingId: string | null;
  setEditingId: (id: string | null) => void;

  /** Touch screens can't hover, so a tap "selects" a message to show its actions. */
  isTouch: boolean;
  activeMessageId: string | null;
  toggleActiveMessage: (id: string) => void;
  clearActiveMessage: () => void;

  composerRef: RefObject<HTMLTextAreaElement | null>;
  /** Registered by the message list; called after you send a message. */
  scrollToBottomRef: RefObject<(() => void) | null>;
  scrollToBottom: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({
  classRoom,
  me,
  children,
}: {
  classRoom: ClassRoom;
  me: CurrentUser;
  children: React.ReactNode;
}) {
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const isTouch = useMediaQuery("(hover: none)");
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollToBottomRef = useRef<(() => void) | null>(null);

  const startReply = useCallback((message: Message) => {
    setReplyingTo(message);
    setEditingId(null);
    setActiveMessageId(null);
    composerRef.current?.focus();
  }, []);

  const cancelReply = useCallback(() => setReplyingTo(null), []);
  const scrollToBottom = useCallback(() => scrollToBottomRef.current?.(), []);
  const toggleActiveMessage = useCallback(
    (id: string) => setActiveMessageId((current) => (current === id ? null : id)),
    []
  );
  const clearActiveMessage = useCallback(() => setActiveMessageId(null), []);

  const value = useMemo(
    () => ({
      classRoom,
      me,
      isAdmin: me.role === "ADMIN",
      replyingTo,
      startReply,
      cancelReply,
      editingId,
      setEditingId,
      isTouch,
      activeMessageId,
      toggleActiveMessage,
      clearActiveMessage,
      composerRef,
      scrollToBottomRef,
      scrollToBottom,
    }),
    [
      classRoom,
      me,
      replyingTo,
      startReply,
      cancelReply,
      editingId,
      isTouch,
      activeMessageId,
      toggleActiveMessage,
      clearActiveMessage,
      scrollToBottom,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used within ChatProvider");
  return context;
}
