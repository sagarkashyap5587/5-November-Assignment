import { Router } from "express";

import { authController } from "./auth.controller.js";
import { authService } from "./auth.service.js";
import { registerSchema } from "./dto/register.dto.js";
import { loginSchema } from "./dto/login.dto.js";

import { redisProvider } from "../../../providers/redis/redis.provider.js";
import { validateBody } from "../../../middlewares/validate.middleware.js";
import { loginRateLimitMiddleware } from "../../../middlewares/rateLimit.middleware.js";
import { accessTokenMiddleware } from "../../../middlewares/accessToken.middleware.js";
import { refreshTokenMiddleware } from "../../../middlewares/refreshToken.middleware.js";

const authRoutes = Router();

// The client object exists from construction; connect() happens in main.ts.
const redisClient = redisProvider.getClient();

authRoutes.post(
  "/register",
  validateBody(registerSchema),
  authController.register
);

authRoutes.post(
  "/login",
  loginRateLimitMiddleware(redisClient),
  validateBody(loginSchema),
  authController.login
);

authRoutes.post(
  "/refresh",
  refreshTokenMiddleware(redisClient, (sessionId) =>
    authService.revokeSession(sessionId)
  ),
  authController.refresh
);

authRoutes.post(
  "/logout",
  accessTokenMiddleware(redisClient),
  authController.logout
);

authRoutes.post(
  "/logout-all",
  accessTokenMiddleware(redisClient),
  authController.logoutAll
);

authRoutes.get(
  "/sessions",
  accessTokenMiddleware(redisClient),
  authController.sessions
);

export default authRoutes;