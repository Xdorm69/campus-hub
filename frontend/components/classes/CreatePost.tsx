"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePost } from "@/hooks/usePosts";

export function CreatePost({ classId }: { classId: string }) {
  const [content, setContent] = useState("");
  const createPost = useCreatePost(classId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    createPost.mutate(
      { classId, content: trimmed },
      { onSuccess: () => setContent("") }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-4">
      <Textarea
        placeholder="Share something with the class..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        maxLength={2000}
      />
      <div className="mt-2 flex items-center justify-between">
        {createPost.isError ? (
          <p className="text-sm text-destructive">Couldn&apos;t post. Try again.</p>
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
