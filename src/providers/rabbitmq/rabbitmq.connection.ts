import amqp from "amqplib";
import { ConfigurationFactory } from "../../config/configuration.js";
import  logger  from "../../logger/logger.js";

export type RabbitConnection = Awaited<
  ReturnType<typeof amqp.connect>
>;

class RabbitMQConnection {
  private connection: RabbitConnection | null = null;

  async connect(): Promise<void> {
    if (this.connection) {
      logger.info("RabbitMQ connection is already established");
      return;
    }

    try {
      this.connection = await amqp.connect(
        ConfigurationFactory.RABBITMQ_URL,
      );

      this.connection.on("error", (error: Error) => {
        logger.error("RabbitMQ connection error", {
          error: error.message,
        });
      });

      this.connection.on("close", () => {
        this.connection = null;
        logger.warn("RabbitMQ connection closed");
      });

      logger.info("RabbitMQ connected successfully");
    } catch (error: unknown) {
      logger.error("RabbitMQ connection failed", {
        error:
          error instanceof Error ? error.message : "Unknown RabbitMQ error",
      });

      throw error;
    }
  }

  getConnection(): RabbitConnection {
    if (!this.connection) {
      throw new Error("RabbitMQ connection is not established");
    }

    return this.connection;
  }

  async disconnect(): Promise<void> {
    if (!this.connection) {
      return;
    }

    try {
      const connection = this.connection;
      this.connection = null;

      await connection.close();

      logger.info("RabbitMQ disconnected successfully");
    } catch (error: unknown) {
      logger.error("RabbitMQ disconnection failed", {
        error:
          error instanceof Error ? error.message : "Unknown RabbitMQ error",
      });

      throw error;
    }
  }

  getConnectionStatus(): boolean {
    return this.connection !== null;
  }
}

export const rabbitMQConnection = new RabbitMQConnection();