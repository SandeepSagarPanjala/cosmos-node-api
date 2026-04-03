/**
 * 🔑 Industry Standard: Centralized Cache Key Factory
 */
export const CACHE_KEYS = {
  EXOPLANETS: {
    // Standard list cache
    ALL: "exoplanets:all",
    // Individual record (e.g. for a details page)
    ONE: (id: string | number) => `exoplanets:one:${id}`,
  },
  USERS: {
    // List of all active users
    ALL: "users:all",
    // User profile by ID
    BY_ID: (id: string) => `users:id:${id}`,
    // User profile by username
    BY_USERNAME: (username: string) => `users:username:${username}`,
  },
} as const;

export const getNamespacePattern = (namespace: keyof typeof CACHE_KEYS) => `${namespace.toLowerCase()}:*`;
