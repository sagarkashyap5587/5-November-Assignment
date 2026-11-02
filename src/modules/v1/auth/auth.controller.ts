import type {
  Request,
  Response,
  NextFunction
} from "express";

import { authService } from "./auth.service.js";
import type { RegisterDTO } from "./dto/register.dto.js";
import type { LoginDTO } from "./dto/login.dto.js";

import { successResponse } from "../../../common/responses.js";
import { AppError, ERROR_CODES } from "../../../common/errors.js";
import { AUTH_CONSTANTS } from "../../../common/constant.js";
import { clearLoginAttempts } from "../../../middlewares/rateLimit.middleware.js";
import { redisProvider } from "../../../providers/redis/redis.provider.js";

import type {
  AuthTokens,
  DeviceInfo
} from "./interface/auth.interface.js";

const getDevice = (req: Request): DeviceInfo => {
  if (!req.device) {
    throw new AppError(
      400,
      ERROR_CODES.VALIDATION_ERROR,
      "Required device headers are missing"
    );
  }

  return req.device;
};

const setTokenHeaders = (res: Response, tokens: AuthTokens): void => {
  res.setHeader(AUTH_CONSTANTS.ACCESS_TOKEN_HEADER, tokens.accessToken);
  res.setHeader(AUTH_CONSTANTS.REFRESH_TOKEN_HEADER, tokens.refreshToken);
};

class AuthController {
  register = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const body = req.body as RegisterDTO;
      const device = getDevice(req);

      const result = await authService.register(body, device);

      setTokenHeaders(res, result.tokens);

      res.status(201).json(
        successResponse(201, "Account registered successfully", {
          user: result.user
        })
      );
    } catch (error: unknown) {
      next(error);
    }
  };

  login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const body = req.body as LoginDTO;
      const device = getDevice(req);

      const result = await authService.login(body, device);

      // Successful login resets the email + IP attempt counter.
      await clearLoginAttempts(
        redisProvider.getClient(),
        body.email,
        req.ip || "unknown"
      );

      setTokenHeaders(res, result.tokens);

      res.status(200).json(
        successResponse(200, "Logged in successfully", {
          user: result.user
        })
      );
    } catch (error: unknown) {
      next(error);
    }
  };

  refresh = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.refreshAuth) {
        throw new AppError(
          401,
          ERROR_CODES.UNAUTHORIZED,
          "Refresh token is required"
        );
      }

      const result = await authService.refresh(req.refreshAuth);

      setTokenHeaders(res, result.tokens);

      res.status(200).json(
        successResponse(200, "Token refreshed successfully", null)
      );
    } catch (error: unknown) {
      next(error);
    }
  };

  logout = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.auth) {
        throw new AppError(
          401,
          ERROR_CODES.UNAUTHORIZED,
          "Authentication is required"
        );
      }

      await authService.logout(req.auth.sessionId);

      res.status(200).json(
        successResponse(200, "Logged out successfully", null)
      );
    } catch (error: unknown) {
      next(error);
    }
  };

    logoutAll = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.auth) {
        throw new AppError(
          401,
          ERROR_CODES.UNAUTHORIZED,
          "Authentication is required"
        );
      }

      await authService.logoutAll(req.auth.userId);

      res.status(200).json(
        successResponse(200, "Logged out from all devices", null)
      );
    } catch (error: unknown) {
      next(error);
    }
  };

  sessions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.auth) {
        throw new AppError(
          401,
          ERROR_CODES.UNAUTHORIZED,
          "Authentication is required"
        );
      }

      const sessions = await authService.listSessions(
        req.auth.userId,
        req.auth.sessionId
      );

      res.status(200).json(
        successResponse(200, "Sessions fetched successfully", { sessions })
      );
    } catch (error: unknown) {
      next(error);
    }
  };
}

export const authController = new AuthController();