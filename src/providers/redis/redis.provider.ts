import { createClient } from "redis";
import { ConfigurationFactory } from "../../config/configuration.js";
import logger from "../../logger/logger.js";

export type RedisClient = ReturnType<typeof createClient>;

class RedisProvider {
  private readonly client: RedisClient;

  constructor() {
    this.client = createClient({
      url: ConfigurationFactory.REDIS_URL,
    });

    this.client.on("error", (error: Error) => {
      logger.error("Redis client error", {
        error: error.message,
      });
    });

    this.client.on("connect", () => {
      logger.info("Redis connecting...");
    });

    this.client.on("ready", () => {
      logger.info("Redis connected and ready");
    });

    this.client.on("reconnecting", () => {
      logger.warn("Redis reconnecting...");
    });
  }

  async connect(): Promise<void> {
    if (this.client.isOpen) {
      logger.info("Redis connection is already open");
      return;
    }

    try {
      await this.client.connect();
      logger.info("Redis connection established successfully");
    } catch (error: unknown) {
      logger.error("Redis connection failed", {
        error:
          error instanceof Error ? error.message : "Unknown Redis error",
      });

      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.client.isOpen) {
      return;
    }

    try {
      await this.client.quit();
      logger.info("Redis disconnected successfully");
    } catch (error: unknown) {
      logger.error("Redis disconnection failed", {
        error:
          error instanceof Error ? error.message : "Unknown Redis error",
      });

      throw error;
    }
  }

  getClient(): RedisClient {
    return this.client;
  }

  getConnectionStatus(): boolean {
    return this.client.isReady;
  }
}

export const redisProvider = new RedisProvider();