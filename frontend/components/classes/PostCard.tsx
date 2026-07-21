"use client";

import { useState } from "react";
import { MoreVertical } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useDeletePost, useUpdatePost } from "@/hooks/usePosts";
import { Post } from "@/types/post";

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const units: [number, string][] = [
    [60, "s"],
    [60, "m"],
    [24, "h"],
    [7, "d"],
  ];
  let value = seconds;
  let label = "s";
  for (const [size, unit] of units) {
    if (value < size) {
      label = unit;
      break;
    }
    value = Math.floor(value / size);
    label = unit;
  }
  return value <= 0 ? "just now" : `${value}${label} ago`;
}

export function PostCard({ post, classId, isOwn }: { post: Post; classId: string; isOwn: boolean }) {
  const updatePost = useUpdatePost(classId);
  const deletePost = useDeletePost(classId);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(post.content);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isOptimistic = post.id.startsWith("optimistic-");
  const initials = post.author.username.slice(0, 2).toUpperCase();

  const handleSave = () => {
    if (!draft.trim() || draft === post.content) {
      setIsEditing(false);
      return;
    }
    updatePost.mutate(
      { postId: post.id, content: draft.trim() },
      { onSuccess: () => setIsEditing(false) }
    );
  };

  return (
    <div className={`rounded-lg border border-border bg-card p-4 ${isOptimistic ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={post.author.avatar ?? undefined} alt={post.author.username} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{post.author.username}</p>
            <p className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</p>
          </div>
        </div>

        {isOwn && !isOptimistic && (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>Edit</DropdownMenuItem>
                <DropdownMenuItem destructive onClick={() => setConfirmDelete(true)}>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <ConfirmDialog
              open={confirmDelete}
              onOpenChange={setConfirmDelete}
              title="Delete post?"
              description="This can't be undone."
              confirmLabel="Delete"
              destructive
              isLoading={deletePost.isPending}
              onConfirm={() =>
                deletePost.mutate(post.id, { onSuccess: () => setConfirmDelete(false) })
              }
            />
          </>
        )}
      </div>

      {isEditing ? (
        <div className="mt-3 space-y-2">
          <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} autoFocus />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDraft(post.content);
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
            <Button size="sm" isLoading={updatePost.isPending} onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-3 whitespace-pre-wrap text-sm">{post.content}</p>
      )}
    </div>
  );
}
