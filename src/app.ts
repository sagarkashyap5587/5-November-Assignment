import express from "express";
import cors from "cors";
import helmet from "helmet";

import { ConfigurationFactory } from "./config/configuration.js";
import { APP_CONSTANTS, AUTH_CONSTANTS } from "./common/constant.js";
import { AppError, ERROR_CODES } from "./common/errors.js";

import { requestIdMiddleware } from "./middlewares/requestId.middleware.js";
import { headerValidator } from "./middlewares/header.validator.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

import { databaseConnection } from "./providers/database/database.js";
import { redisProvider } from "./providers/redis/redis.provider.js";
import { rabbitMQConnection } from "./providers/rabbitmq/rabbitmq.connection.js";

import v1Routes from "./modules/v1/routes.js";

const app = express();

app.use(requestIdMiddleware);
app.use(helmet());
app.use(
  cors({
    origin: ConfigurationFactory.CORS_ORIGIN,
    exposedHeaders: [
      AUTH_CONSTANTS.ACCESS_TOKEN_HEADER,
      AUTH_CONSTANTS.REFRESH_TOKEN_HEADER,
      "x-request-id",
    ],
  }),
);
app.use(express.json());
app.use(headerValidator);

// Health Check API
app.get(APP_CONSTANTS.HEALTH_ROUTE, (_req, res) => {
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

app.use(APP_CONSTANTS.API_PREFIX, v1Routes);

// Unknown routes -> NOT_FOUND envelope
app.use((req, _res, next) => {
  next(
    new AppError(
      404,
      ERROR_CODES.NOT_FOUND,
      `Route ${req.method} ${req.originalUrl} not found`,
    ),
  );
});

// Error middleware must be registered last.
app.use(errorMiddleware);

export default app;
