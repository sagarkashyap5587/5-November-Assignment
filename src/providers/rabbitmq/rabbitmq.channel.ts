import { rabbitMQConnection } from "./rabbitmq.connection.js";
import type { RabbitConnection } from "./rabbitmq.connection.js";
import logger from "../../logger/logger.js";

export type RabbitChannel = Awaited<
  ReturnType<RabbitConnection["createConfirmChannel"]>
>;

class RabbitMQChannel {
  private channel: RabbitChannel | null = null;

  async connect(): Promise<void> {
    if (this.channel) {
      logger.info("RabbitMQ channel is already established");
      return;
    }

    try {
      const connection = rabbitMQConnection.getConnection();

      this.channel = await connection.createConfirmChannel();

      this.channel.on("error", (error: Error) => {
        logger.error("RabbitMQ channel error", {
          error: error.message,
        });
      });

      this.channel.on("close", () => {
        this.channel = null;
        logger.warn("RabbitMQ channel closed");
      });

      logger.info("RabbitMQ channel created successfully");
    } catch (error: unknown) {
      logger.error("RabbitMQ channel creation failed", {
        error:
          error instanceof Error ? error.message : "Unknown channel error",
      });

      throw error;
    }
  }

  getChannel(): RabbitChannel {
    if (!this.channel) {
      throw new Error("RabbitMQ channel is not established");
    }

    return this.channel;
  }

  async disconnect(): Promise<void> {
    if (!this.channel) {
      return;
    }

    try {
      const channel = this.channel;
      this.channel = null;

      await channel.close();

      logger.info("RabbitMQ channel disconnected successfully");
    } catch (error: unknown) {
      logger.error("RabbitMQ channel disconnection failed", {
        error:
          error instanceof Error ? error.message : "Unknown channel error",
      });

      throw error;
    }
  }

  getConnectionStatus(): boolean {
    return this.channel !== null;
  }
}

export const rabbitMQChannel = new RabbitMQChannel();