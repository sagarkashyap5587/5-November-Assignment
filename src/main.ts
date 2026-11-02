
import app from "./app.js";
import { ConfigurationFactory } from "./config/configuration.js";

import { databaseConnection } from "./providers/database/database.js";
import { redisProvider } from "./providers/redis/redis.provider.js";
import { rabbitMQConnection } from "./providers/rabbitmq/rabbitmq.connection.js";
import { rabbitMQChannel } from "./providers/rabbitmq/rabbitmq.channel.js";

import logger  from "./logger/logger.js";

let server: ReturnType<typeof app.listen> | null = null;
let isShuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  let shutdownFailed = false;

  // 1. Stop accepting new HTTP requests
  if (server) {
    await new Promise<void>((resolve) => {
      server?.close((error) => {
        if (error) {
          shutdownFailed = true;
          logger.error("HTTP server shutdown failed", {
            error: error.message,
          });
        } else {
          logger.info("HTTP server closed successfully");
        }

        resolve();
      });
    });
  }

  // 2. Close RabbitMQ channel
  try {
    await rabbitMQChannel.disconnect();
  } catch (error: unknown) {
    shutdownFailed = true;
    logger.error("RabbitMQ channel shutdown failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // 3. Close RabbitMQ connection
  try {
    await rabbitMQConnection.disconnect();
  } catch (error: unknown) {
    shutdownFailed = true;
    logger.error("RabbitMQ shutdown failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // 4. Disconnect Redis
  try {
    await redisProvider.disconnect();
  } catch (error: unknown) {
    shutdownFailed = true;
    logger.error("Redis shutdown failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // 5. Disconnect MongoDB
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
    logger.error("Application shutdown completed with errors");
  } else {
    logger.info("Application shutdown completed successfully");
  }
}

async function startServer(): Promise<void> {
  try {
    console.log("=================================");
    console.log("       SplitEase API");
    console.log("=================================");

    console.log("Environment:", ConfigurationFactory.NODE_ENV);
    console.log("Port:", ConfigurationFactory.PORT);

    await databaseConnection.connect();
    await redisProvider.connect();
    await rabbitMQConnection.connect();
    await rabbitMQChannel.connect();

    server = app.listen(ConfigurationFactory.PORT, () => {
      logger.info(
        `SplitEase API running on port ${ConfigurationFactory.PORT}`,
      );
    });
  } catch (error: unknown) {
    logger.error("Application startup failed", {
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

void startServer();
