"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { MemberList } from "@/features/members/MemberList";
import { useClass } from "@/hooks/useClasses";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useProfile } from "@/hooks/useProfile";
import { getErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { ChatProvider } from "./ChatContext";
import { ChatHeader } from "./ChatHeader";
import { BannedState, JoinPrompt, MessageSkeletons } from "./ChatStates";
import { MessageComposer } from "./MessageComposer";
import { MessageList } from "./MessageList";

function ChatRoomSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-12 items-center border-b border-border px-4">
        <Skeleton className="h-5 w-48" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-end">
        <MessageSkeletons />
        <div className="px-4 pb-6">
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function ChatRoom({ classId }: { classId: string }) {
  const { data: classRoom, isLoading, error } = useClass(classId);
  const { data: me } = useProfile();
  const isDesktop = useMediaQuery("(min-width: 1024px)", true);
  // Desktop shows members by default; on small screens it's an overlay.
  const [desktopMembers, setDesktopMembers] = useState(true);
  const [mobileMembers, setMobileMembers] = useState(false);

  if (isLoading || !me) return <ChatRoomSkeleton />;

  if (!classRoom) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageHeader title="Class unavailable" />
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="text-lg font-semibold">Couldn&apos;t open this class</p>
          <p className="text-sm text-muted-foreground">
            {getErrorMessage(error, "It may have been deleted.")}
          </p>
        </div>
      </div>
    );
  }

  const isAdmin = me.role === "ADMIN";
  const canRead = !classRoom.isBanned && (classRoom.isMember || isAdmin);
  const membersOpen = isDesktop ? desktopMembers : mobileMembers;
  const toggleMembers = () =>
    isDesktop ? setDesktopMembers((v) => !v) : setMobileMembers((v) => !v);

  return (
    // Keyed so reply/edit/scroll state never carries over between rooms.
    <ChatProvider key={classRoom.id} classRoom={classRoom} me={me}>
      <div className="flex min-h-0 flex-1 flex-col">
        <ChatHeader
          classRoom={classRoom}
          isAdmin={isAdmin}
          membersOpen={membersOpen}
          onToggleMembers={toggleMembers}
        />

        <div className="relative flex min-h-0 flex-1">
          <section className="flex min-w-0 flex-1 flex-col">
            {classRoom.isBanned ? (
              <BannedState classRoom={classRoom} />
            ) : !canRead ? (
              <JoinPrompt classRoom={classRoom} />
            ) : (
              <ErrorBoundary fallbackTitle="This chat hit an unexpected error.">
                <MessageList />
                {classRoom.isMember ? (
                  <MessageComposer />
                ) : (
                  <p className="px-4 pb-6 text-center text-sm text-muted-foreground">
                    You&apos;re viewing as an admin. Join the class to send messages.
                  </p>
                )}
              </ErrorBoundary>
            )}
          </section>

          {!classRoom.isBanned && membersOpen && (
            <>
              {!isDesktop && (
                <div
                  className="absolute inset-0 z-20 bg-black/50"
                  onClick={() => setMobileMembers(false)}
                  aria-hidden
                />
              )}
              <MemberList
                classId={classId}
                canModerate={classRoom.canModerate}
                className={cn(!isDesktop && "absolute inset-y-0 right-0 z-30 shadow-xl")}
              />
            </>
          )}
        </div>
      </div>
    </ChatProvider>
  );
}
