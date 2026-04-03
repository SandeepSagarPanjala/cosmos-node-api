import { Redis } from "ioredis";
import superjson from "superjson";
import dotenv from "dotenv";

dotenv.config();

/**
 * 🔒 Industry Standard: The Smart Redis Wrapper
 */
export class SmartRedis {
  private client: Redis | null = null;
  private isEnabled: boolean = process.env.REDIS_ENABLED === "true";
  public status: "ready" | "disabled" | "connecting" = "connecting";

  constructor() {
    if (!this.isEnabled) {
      this.status = "disabled";
      return;
    }

    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    
    // 🛡️ Change: We re-enable Offline Queue (default ioredis behavior).
    // This allows startup scripts (like Rate Limiting) to wait a split second 
    // for the connection instead of returning 'null' and crashing.
    this.client = new Redis(redisUrl, {
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
      enableOfflineQueue: true, // 🚀 Crucial for startup scripts
      retryStrategy(times: number) {
        return Math.min(times * 50, 2000);
      },
    });

    this.client.on("connect", () => {
      this.status = "ready";
      console.log("[REDIS] Smart Client: Connected.");
    });

    this.client.on("error", (err: Error) => {
      console.error("[REDIS] Connection issue:", err.message);
    });
  }

  public async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.isEnabled) return null;
    try {
      const data = await this.client.get(key);
      return data ? (superjson.parse(data) as T) : null;
    } catch {
      return null;
    }
  }

  public async set(
    key: string, 
    value: any, 
    ttl: number = Number(process.env.REDIS_TTL) || 3600
  ): Promise<void> {
    if (!this.client || !this.isEnabled) return;
    try {
      const serialized = superjson.stringify(value);
      await this.client.set(key, serialized, "EX", ttl);
    } catch {
      // Fail silently
    }
  }

  public async del(key: string): Promise<void> {
    if (!this.client || !this.isEnabled) return;
    try {
      await this.client.del(key);
    } catch {
      // Ignored
    }
  }

  public async quit(): Promise<void> {
    if (this.client) await this.client.quit();
  }

  /**
   * 🛡️ Fixed: The Rate-Limiter requires a raw proxy to 'call'
   */
  public async call(...args: any[]): Promise<any> {
    // If Redis is disabled, we MUST return something meaningful or null
    if (!this.client || !this.isEnabled) return null;

    // We let ioredis handle the command (it will queue if 'connecting')
    // @ts-ignore
    return this.client.call(...args);
  }
}

// Export a singleton instance for global use
export const redisInstance = new SmartRedis();
