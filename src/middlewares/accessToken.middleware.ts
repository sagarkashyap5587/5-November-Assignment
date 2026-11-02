import jwt, {
  TokenExpiredError,
  type JwtPayload,
} from "jsonwebtoken";
import type { RequestHandler } from "express";
import type { RedisClient } from "../providers/redis/redis.provider.js";

import { ConfigurationFactory } from "../config/configuration.js";
import { AppError, ERROR_CODES } from "../common/errors.js";
import type { AccessTokenPayload } from "../interfaces/express.js";

function isAccessTokenPayload(
  payload: string | JwtPayload,
): payload is JwtPayload & AccessTokenPayload {
  return (
    typeof payload !== "string" &&
    typeof payload.sub === "string" &&
    typeof payload.sid === "string"
  );
}

export function accessTokenMiddleware(
  redisClient: RedisClient,
): RequestHandler {
  return async (req, _res, next) => {
    try {
      const authorization = req.headers.authorization;

      if (!authorization?.startsWith("Bearer ")) {
        throw new AppError(
          401,
          ERROR_CODES.UNAUTHORIZED,
          "Access token is required",
        );
      }

      const token = authorization.slice(7).trim();

      if (!token) {
        throw new AppError(
          401,
          ERROR_CODES.UNAUTHORIZED,
          "Access token is required",
        );
      }

      let decoded: string | JwtPayload;

      try {
        decoded = jwt.verify(
          token,
          ConfigurationFactory.JWT_ACCESS_SECRET,
        );
      } catch (error: unknown) {
        if (error instanceof TokenExpiredError) {
          throw new AppError(
            401,
            ERROR_CODES.TOKEN_EXPIRED,
            "Access token has expired",
          );
        }

        throw new AppError(
          401,
          ERROR_CODES.UNAUTHORIZED,
          "Invalid access token",
        );
      }

      if (!isAccessTokenPayload(decoded)) {
        throw new AppError(
          401,
          ERROR_CODES.UNAUTHORIZED,
          "Invalid access token payload",
        );
      }

      const sessionKey = `session:${decoded.sid}`;
      const session = await redisClient.get(sessionKey);

      if (!session) {
        throw new AppError(
          401,
          ERROR_CODES.UNAUTHORIZED,
          "Session is invalid or has been revoked",
        );
      }

      req.auth = {
        userId: decoded.sub,
        sessionId: decoded.sid,
      };

      next();
    } catch (error: unknown) {
      next(error);
    }
  };
}