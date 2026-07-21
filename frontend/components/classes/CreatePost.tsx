"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePost } from "@/hooks/usePosts";
import { toast } from "sonner";

export function CreatePost({ classId }: { classId: string }) {
  const [content, setContent] = useState("");
  const createPost = useCreatePost(classId);

  const submitPost = () => {
    const trimmed = content.trim();
    if (!trimmed || createPost.isPending) return;

    createPost.mutate(
      { classId, content: trimmed },
      {
        onSuccess: () => {
          toast.success("Post added successfully!");
          setContent("");
        },
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitPost();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Shift + Enter -> new line
    if (e.key === "Enter" && e.shiftKey) {
      return;
    }

    // Enter -> submit
    if (e.key === "Enter") {
      e.preventDefault();
      submitPost();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-border bg-card p-4"
    >
      <Textarea
        placeholder="Share something with the class..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={3}
        maxLength={2000}
      />

      <div className="mt-2 flex items-center justify-between">
        {createPost.isError ? (
          <p className="text-sm text-destructive">
            Couldn&apos;t post. Try again.
          </p>
        ) : (
          <span />
        )}

        <Button
          type="submit"
          size="sm"
          isLoading={createPost.isPending}
          disabled={!content.trim()}
        >
          Post
        </Button>
      </div>
    </form>
  );
}