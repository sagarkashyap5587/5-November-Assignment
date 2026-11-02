import type { RequestHandler } from "express";

import { AppError, ERROR_CODES } from "../common/errors.js";

export type GroupMembershipChecker = (
  groupId: string,
  userId: string,
) => Promise<boolean>;

export function groupMemberMiddleware(
  isGroupMember: GroupMembershipChecker,
): RequestHandler {
  return async (req, _res, next) => {
    try {
      const groupId = req.params.groupId;
      const userId = req.auth?.userId;

      if (!userId) {
        throw new AppError(
          401,
          ERROR_CODES.UNAUTHORIZED,
          "Authentication is required",
        );
      }

      if (
        typeof groupId !== "string" ||
        groupId.trim().length === 0
      ) {
        throw new AppError(
          400,
          ERROR_CODES.VALIDATION_ERROR,
          "A valid groupId is required",
        );
      }

      const member = await isGroupMember(groupId, userId);

      if (!member) {
        throw new AppError(
          403,
          ERROR_CODES.NOT_GROUP_MEMBER,
          "You are not a member of this group",
        );
      }

      next();
    } catch (error: unknown) {
      next(error);
    }
  };
}