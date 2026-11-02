import type { RequestHandler } from "express";
import type { ZodType } from "zod";

import { AppError, ERROR_CODES } from "../common/errors.js";

export function validateBody<T>(schema: ZodType<T>): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => {
          const path = issue.path.join(".");
          return path ? `${path}: ${issue.message}` : issue.message;
        })
        .join("; ");

      next(new AppError(400, ERROR_CODES.VALIDATION_ERROR, message));
      return;
    }

    req.body = result.data;

    next();
  };
}
