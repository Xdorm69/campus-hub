/**
 * Every query key in one place. Messages live under their own root so that
 * invalidating a class (details, members) never refetches chat history.
 */
export const queryKeys = {
  me: ["me"] as const,
  myClasses: ["me", "classes"] as const,

  classes: {
    all: ["classes"] as const,
    lists: () => ["classes", "list"] as const,
    list: (search: string) => ["classes", "list", { search }] as const,
    detail: (classId: string) => ["classes", "detail", classId] as const,
    members: (classId: string) => ["classes", "members", classId] as const,
  },

  messages: {
    list: (classId: string) => ["messages", classId, "list"] as const,
    sync: (classId: string) => ["messages", classId, "sync"] as const,
  },

  users: {
    detail: (userId: string) => ["users", userId] as const,
  },
};
