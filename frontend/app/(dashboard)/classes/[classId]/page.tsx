"use client";

import { use } from "react";
import { ChatRoom } from "@/features/chat/ChatRoom";

export default function ClassChatPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = use(params);
  return <ChatRoom classId={classId} />;
}
