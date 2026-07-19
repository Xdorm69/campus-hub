export interface Post {
  id: string;
  classId: string;
  authorId: string;
  author: {
    username: string;
    avatar: string | null;
  }
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedPage {
  posts: Post[];
  nextCursor: string | null;
}

export interface CreatePostPayload {
  classId: string;
  content: string;
}
