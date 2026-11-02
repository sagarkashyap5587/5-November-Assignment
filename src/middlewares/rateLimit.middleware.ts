import { createHash } from "node:crypto";
import type { RequestHandler } from "express";
import type { RedisClient } from "../providers/redis/redis.provider.js";

import { AppError, ERROR_CODES } from "../common/errors.js";

const MAX_LOGIN_ATTEMPTS = 5;
const WINDOW_SECONDS = 60;

function getEmailFromBody(body: unknown): string {
  if (
    typeof body !== "object" ||
    body === null ||
    !("email" in body) ||
    typeof body.email !== "string"
  ) {
    return "missing-email";
  }

  return body.email.trim().toLowerCase();
}

function createRateLimitKey(email: string, ip: string): string {
  const identifier = `${email}:${ip}`;

  const hash = createHash("sha256")
    .update(identifier)
    .digest("hex");

  return `rate-limit:login:${hash}`;
}

export function loginRateLimitMiddleware(
  redisClient: RedisClient,
): RequestHandler {
  return async (req, _res, next) => {
    try {
      const email = getEmailFromBody(req.body);
      const ip = req.ip || "unknown";
      const key = createRateLimitKey(email, ip);

      const attempts = await redisClient.incr(key);

      if (attempts === 1) {
        await redisClient.expire(key, WINDOW_SECONDS);
      }

      if (attempts > MAX_LOGIN_ATTEMPTS) {
        throw new AppError(
          429,
          ERROR_CODES.TOO_MANY_ATTEMPTS,
          "Too many login attempts. Please try again after one minute",
        );
      }

      next();
    } catch (error: unknown) {
      next(error);
    }
  };
}

/**
 * Call this from the auth service after a successful login.
 */
export async function clearLoginAttempts(
  redisClient: RedisClient,
  email: string,
  ip: string,
): Promise<void> {
  const key = createRateLimitKey(
    email.trim().toLowerCase(),
    ip,
  );

  await redisClient.del(key);
}