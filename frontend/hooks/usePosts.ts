"use client";

import { useMutation, useQueryClient, InfiniteData } from "@tanstack/react-query";
import { postService } from "@/services/post.service";
import { CreatePostPayload, FeedPage, Post } from "@/types/post";
import { User } from "@/types/user";

export function useCreatePost(classId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePostPayload) => postService.create(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["classes", classId, "feed"] });

      const previousFeed = queryClient.getQueryData<InfiniteData<FeedPage>>([
        "classes",
        classId,
        "feed",
      ]);
      const me = queryClient.getQueryData<User>(["me"]);

      const optimisticPost: Post = {
        id: `optimistic-${Date.now()}`,
        classId: payload.classId,
        authorId: me?.id ?? "me",
        author: {
          username: me?.username ?? "You",
          avatar: me?.avatarUrl ?? null,
        },
        content: payload.content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<InfiniteData<FeedPage>>(
        ["classes", classId, "feed"],
        (old) => {
          if (!old) {
            return {
              pages: [{ posts: [optimisticPost], nextCursor: null }],
              pageParams: [null],
            };
          }
          const [firstPage, ...rest] = old.pages;
          return {
            ...old,
            pages: [
              { ...firstPage, posts: [optimisticPost, ...firstPage.posts] },
              ...rest,
            ],
          };
        }
      );

      return { previousFeed, optimisticId: optimisticPost.id };
    },
    onError: (_err, _payload, context) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(["classes", classId, "feed"], context.previousFeed);
      }
    },
    onSuccess: (createdPost, _payload, context) => {
      // Swap the optimistic post for the real one so the id (and any
      // server-computed fields) line up for future edits/deletes.
      queryClient.setQueryData<InfiniteData<FeedPage>>(
        ["classes", classId, "feed"],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              posts: page.posts.map((post) =>
                post.id === context?.optimisticId ? createdPost : post
              ),
            })),
          };
        }
      );
    },
  });
}

export function useUpdatePost(classId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      postService.update(postId, content),
    onSuccess: (updatedPost) => {
      queryClient.setQueryData<InfiniteData<FeedPage>>(
        ["classes", classId, "feed"],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              posts: page.posts.map((post) =>
                post.id === updatedPost.id ? updatedPost : post
              ),
            })),
          };
        }
      );
    },
  });
}

export function useDeletePost(classId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => postService.remove(postId),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["classes", classId, "feed"] });
      const previousFeed = queryClient.getQueryData<InfiniteData<FeedPage>>([
        "classes",
        classId,
        "feed",
      ]);

      queryClient.setQueryData<InfiniteData<FeedPage>>(
        ["classes", classId, "feed"],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              posts: page.posts.filter((post) => post.id !== postId),
            })),
          };
        }
      );

      return { previousFeed };
    },
    onError: (_err, _postId, context) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(["classes", classId, "feed"], context.previousFeed);
      }
    },
  });
}
