import type { NextFunction, Request, Response } from "express";

import { userService } from "./user.service.js";
import { searchUsersSchema } from "./dto/search-users.dto.js";
import type { UpdateProfileDTO } from "./dto/update-profile.dto.js";

import { successResponse } from "../../../common/responses.js";
import { AppError, ERROR_CODES } from "../../../common/errors.js";
import { getPagination } from "../../../common/utils.js";

const requireUserId = (req: Request): string => {
  if (!req.auth) {
    throw new AppError(
      401,
      ERROR_CODES.UNAUTHORIZED,
      "Authentication is required"
    );
  }

  return req.auth.userId;
};

class UserController {
  getMe = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = requireUserId(req);

      const profile = await userService.getProfile(userId);

      res
        .status(200)
        .json(successResponse(200, "Profile fetched successfully", profile));
    } catch (error: unknown) {
      next(error);
    }
  };

  updateMe = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = requireUserId(req);
      const body = req.body as UpdateProfileDTO;

      const profile = await userService.updateProfile(userId, body);

      res
        .status(200)
        .json(successResponse(200, "Profile updated successfully", profile));
    } catch (error: unknown) {
      next(error);
    }
  };

   search = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      requireUserId(req);

      const parsed = searchUsersSchema.safeParse(req.query);

      if (!parsed.success) {
        throw new AppError(
          400,
          ERROR_CODES.VALIDATION_ERROR,
          parsed.error.issues
            .map((issue) => {
              const path = issue.path.join(".");
              return path ? `${path}: ${issue.message}` : issue.message;
            })
            .join("; ")
        );
      }

      const user = await userService.findByEmail(parsed.data.email);

      res
        .status(200)
        .json(successResponse(200, "User fetched successfully", user));
    } catch (error: unknown) {
      next(error);
    }
  };
}

export const userController = new UserController();