import type { NextFunction, Request, Response } from "express";

import { groupService } from "./group.service.js";
import { listGroupsQuerySchema } from "./dto/list-groups.dto.js";
import { CreateGroupDTO } from "./dto/create-group.dto.js";
import { UpdateGroupDTO } from "./dto/update-group.dto.js";
import type { AddMemberDTO } from "./dto/add-member.dto.js";

import { successResponse } from "../../../common/responses.js";
import { AppError, ERROR_CODES } from "../../../common/errors.js";
import {
  getPagination,
  type PaginationOptions,
} from "../../../common/utils.js";

const requireUserId = (req: Request): string => {
  if (!req.auth) {
    throw new AppError(
      401,
      ERROR_CODES.UNAUTHORIZED,
      "Authentication is required",
    );
  }

  return req.auth.userId;
};

const getParam = (req: Request, name: string): string => {
  const value = req.params[name];

  if (typeof value !== "string" || value.length === 0) {
    throw new AppError(
      400,
      ERROR_CODES.VALIDATION_ERROR,
      `${name} is required`,
    );
  }

  return value;
};

class GroupController {
  create = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = requireUserId(req);
      const body = req.body as CreateGroupDTO;

      const group = await groupService.createGroup(userId, body.name);

      res
        .status(201)
        .json(successResponse(201, "Group created successfully", group));
    } catch (error: unknown) {
      next(error);
    }
  };

  list = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = requireUserId(req);

      const parsed = listGroupsQuerySchema.safeParse(req.query);

      if (!parsed.success) {
        throw new AppError(
          400,
          ERROR_CODES.VALIDATION_ERROR,
          parsed.error.issues
            .map((issue) => {
              const path = issue.path.join(".");
              return path ? `${path}: ${issue.message}` : issue.message;
            })
            .join("; "),
        );
      }

      let pagination: PaginationOptions;

      try {
        pagination = getPagination(parsed.data.page, parsed.data.limit);
      } catch (error: unknown) {
        throw new AppError(
          400,
          ERROR_CODES.VALIDATION_ERROR,
          error instanceof Error ? error.message : "Invalid pagination",
        );
      }

      const result = await groupService.listGroups({
        userId,
        skip: pagination.skip,
        page: pagination.page,
        limit: pagination.limit,
        sortBy: parsed.data.sortBy,
        order: parsed.data.order,
      });

      res
        .status(200)
        .json(successResponse(200, "Groups fetched successfully", result));
    } catch (error: unknown) {
      next(error);
    }
  };

  get = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const group = await groupService.getGroup(getParam(req, "groupId"));

      res
        .status(200)
        .json(successResponse(200, "Group fetched successfully", group));
    } catch (error: unknown) {
      next(error);
    }
  };

  rename = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const body = req.body as UpdateGroupDTO;

      const group = await groupService.renameGroup(
        getParam(req, "groupId"),
        body.name,
      );

      res
        .status(200)
        .json(successResponse(200, "Group updated successfully", group));
    } catch (error: unknown) {
      next(error);
    }
  };

  addMember = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const body = req.body as AddMemberDTO;

      const group = await groupService.addMemberByEmail(
        getParam(req, "groupId"),
        body.email,
      );

      res
        .status(201)
        .json(successResponse(201, "Member added successfully", group));
    } catch (error: unknown) {
      next(error);
    }
  };

  removeMember = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await groupService.removeMember(
        getParam(req, "groupId"),
        getParam(req, "userId"),
      );

      res
        .status(200)
        .json(successResponse(200, "Member removed successfully", null));
    } catch (error: unknown) {
      next(error);
    }
  };
}

export const groupController = new GroupController();