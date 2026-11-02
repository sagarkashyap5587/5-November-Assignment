import { randomUUID } from "node:crypto";
import { rabbitMQChannel } from "./rabbitmq.channel.js";
import  logger  from "../../logger/logger.js";

class RabbitMQPublisher {
  async publish<T>(
    queue: string,
    message: T,
  ): Promise<void> {
    try {
      const channel = rabbitMQChannel.getChannel();

      await channel.assertQueue(queue, {
        durable: true,
      });

      const payload = {
        messageId: randomUUID(),
        timestamp: new Date().toISOString(),
        data: message,
      };

      const messageBuffer = Buffer.from(
        JSON.stringify(payload),
      );

      channel.sendToQueue(queue, messageBuffer, {
        persistent: true,
        contentType: "application/json",
        messageId: payload.messageId,
        timestamp: Date.now(),
      });

      await channel.waitForConfirms();

      logger.info("RabbitMQ message published successfully", {
        queue,
        messageId: payload.messageId,
      });
    } catch (error: unknown) {
      logger.error("RabbitMQ message publishing failed", {
        queue,
        error:
          error instanceof Error ? error.message : "Unknown publisher error",
      });

      throw error;
    }
  }
}

export const rabbitMQPublisher = new RabbitMQPublisher();