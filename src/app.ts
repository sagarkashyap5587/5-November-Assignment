import express from "express";

import { requestIdMiddleware } from "./middlewares/requestId.middleware.js";
import { headerValidator } from "./middlewares/header.validator.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

import { databaseConnection } from "./providers/database/database.js";
import { redisProvider } from "./providers/redis/redis.provider.js";
import { rabbitMQConnection } from "./providers/rabbitmq/rabbitmq.connection.js";

const app = express();

app.use(express.json());

app.use(requestIdMiddleware);
app.use(headerValidator);

// Health Check API
app.get("/health", (_req, res) => {
  const mongo = databaseConnection.getConnectionStatus();
  const redis = redisProvider.getConnectionStatus();
  const rabbitmq = rabbitMQConnection.getConnectionStatus();

  const isHealthy = mongo && redis && rabbitmq;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "healthy" : "unhealthy",
    services: {
      mongo: mongo ? "connected" : "disconnected",
      redis: redis ? "connected" : "disconnected",
      rabbitmq: rabbitmq ? "connected" : "disconnected",
    },
  });
});

// app.use("/api/v1", appRoutes);

// Error middleware must be registered after routes.
app.use(errorMiddleware);

export default app;