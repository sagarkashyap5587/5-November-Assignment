
import { ConfigurationFactory } from "./config/configuration.js";
import { databaseConnection } from "./providers/database/database.js";
import { redisProvider } from "./providers/redis/redis.provider.js";
import { rabbitMQConnection } from "./providers/rabbitmq/rabbitmq.connection.js";
import { rabbitMQChannel } from "./providers/rabbitmq/rabbitmq.channel.js";
import  logger  from "./logger/logger.js";

let isShuttingDown = false;

// Future consumers ke tags yahan register honge.
const consumerTags: string[] = [];

// Currently process ho rahe messages ke tasks yahan track honge.
const inFlightMessages = new Set<Promise<void>>();

function registerConsumerTag(tag: string): void {
  consumerTags.push(tag);
}

function trackMessage(task: Promise<void>): void {
  inFlightMessages.add(task);

  void task.finally(() => {
    inFlightMessages.delete(task);
  });
}

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;

  isShuttingDown = true;
  logger.info(`Received ${signal}. Consumer shutdown started...`);

  let shutdownFailed = false;

  // 1. Stop receiving new messages.
  try {
    const channel = rabbitMQChannel.getChannel();

    for (const tag of consumerTags) {
      await channel.cancel(tag);
      logger.info("RabbitMQ consumer cancelled", { consumerTag: tag });
    }
  } catch (error: unknown) {
    shutdownFailed = true;
    logger.error("Consumer cancellation failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // 2. Wait for currently processing messages.
  try {
    await Promise.allSettled([...inFlightMessages]);
    logger.info("All in-flight messages have finished");
  } catch (error: unknown) {
    shutdownFailed = true;
    logger.error("Waiting for messages failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // 3. Close RabbitMQ channel and connection.
  try {
    await rabbitMQChannel.disconnect();
    await rabbitMQConnection.disconnect();
  } catch (error: unknown) {
    shutdownFailed = true;
    logger.error("RabbitMQ shutdown failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // 4. Disconnect Redis and MongoDB.
  try {
    await redisProvider.disconnect();
  } catch (error: unknown) {
    shutdownFailed = true;
    logger.error("Redis shutdown failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  try {
    await databaseConnection.disconnect();
  } catch (error: unknown) {
    shutdownFailed = true;
    logger.error("MongoDB shutdown failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  if (shutdownFailed) {
    process.exitCode = 1;
    logger.error("Consumer shutdown completed with errors");
  } else {
    logger.info("Consumer shutdown completed successfully");
  }
}

async function startConsumer(): Promise<void> {
  try {
    console.log("=================================");
    console.log("     SplitEase Consumer");
    console.log("=================================");

    console.log("Environment:", ConfigurationFactory.NODE_ENV);

    await databaseConnection.connect();
    await redisProvider.connect();
    await rabbitMQConnection.connect();
    await rabbitMQChannel.connect();

    logger.info("SplitEase Consumer initialized successfully");

    // Actual RabbitMQ consumers will be registered here
    // in the upcoming queue/consumer implementation.
  } catch (error: unknown) {
    logger.error("Consumer startup failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    await shutdown("STARTUP_FAILURE");
    process.exitCode = 1;
  }
}

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

void startConsumer();
