import { api } from "@/lib/axios";
import { ApiResponse } from "@/types/auth";
import { CreatePostPayload, FeedPage, Post } from "@/types/post";

const FEED_PAGE_SIZE = 15;

export const postService = {
  async getFeed(classId: string, cursor: string | null): Promise<FeedPage> {
    const { data } = await api.get<ApiResponse<FeedPage>>(`/classes/${classId}/feed`, {
      params: { cursor: cursor ?? undefined, limit: FEED_PAGE_SIZE },
    });
    return data.data;
  },

  async create(payload: CreatePostPayload): Promise<Post> {
    const { data } = await api.post<ApiResponse<Post>>("/posts", payload);
    return data.data;
  },

  async update(postId: string, content: string): Promise<Post> {
    const { data } = await api.put<ApiResponse<Post>>(`/posts/${postId}`, { content });
    return data.data;
  },

  async remove(postId: string): Promise<void> {
    await api.delete<ApiResponse<void>>(`/posts/${postId}`);
  },
};
