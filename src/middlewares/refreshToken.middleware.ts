import jwt, {
  TokenExpiredError,
  type JwtPayload,
} from "jsonwebtoken";
import type { RequestHandler } from "express";
import type { RedisClientType } from "redis";

import { ConfigurationFactory } from "../config/configuration.js";
import { AppError, ERROR_CODES } from "../common/errors.js";
import type { RefreshTokenPayload } from "../interfaces/express.js";

function isRefreshTokenPayload(
  payload: string | JwtPayload,
): payload is JwtPayload & RefreshTokenPayload {
  return (
    typeof payload !== "string" &&
    typeof payload.sub === "string" &&
    typeof payload.sid === "string" &&
    typeof payload.jti === "string"
  );
}

export function refreshTokenMiddleware(
  redisClient: RedisClientType,
): RequestHandler {
  return async (req, _res, next) => {
    try {
      const refreshToken = req.headers["x-refresh-token"];

      if (
        typeof refreshToken !== "string" ||
        refreshToken.trim().length === 0
      ) {
        throw new AppError(
          401,
          ERROR_CODES.UNAUTHORIZED,
          "x-refresh-token header is required",
        );
      }

      let decoded: string | JwtPayload;

      try {
        decoded = jwt.verify(
          refreshToken,
          ConfigurationFactory.JWT_REFRESH_SECRET,
        );
      } catch (error: unknown) {
        if (error instanceof TokenExpiredError) {
          throw new AppError(
            401,
            ERROR_CODES.UNAUTHORIZED,
            "Refresh token has expired",
          );
        }

        throw new AppError(
          401,
          ERROR_CODES.UNAUTHORIZED,
          "Invalid refresh token",
        );
      }

      if (!isRefreshTokenPayload(decoded)) {
        throw new AppError(
          401,
          ERROR_CODES.UNAUTHORIZED,
          "Invalid refresh token payload",
        );
      }

      const sessionKey = `session:${decoded.sid}`;
      const refreshKey = `refresh:${decoded.sid}`;

      const [session, storedJti] = await Promise.all([
        redisClient.get(sessionKey),
        redisClient.get(refreshKey),
      ]);

      if (!session) {
        throw new AppError(
          401,
          ERROR_CODES.UNAUTHORIZED,
          "Session is invalid or has been revoked",
        );
      }

      if (!storedJti || storedJti !== decoded.jti) {
      await redisClient.del([sessionKey, refreshKey]);

        throw new AppError(
          401,
          ERROR_CODES.REFRESH_TOKEN_REUSED,
          "Refresh token reuse detected. Please log in again",
        );
      }

      req.refreshAuth = {
        sub: decoded.sub,
        sid: decoded.sid,
        jti: decoded.jti,
      };

      next();
    } catch (error: unknown) {
      next(error);
    }
  };
}