import type { ErrorRequestHandler } from "express";

import { AppError, ERROR_CODES } from "../common/errors.js";
import logger from "../logger/logger.js";

export const errorMiddleware: ErrorRequestHandler = (
  error: unknown,
  req,
  res,
  _next,
) => {
  if (error instanceof AppError) {
    logger.warn("Application error", {
      requestId: req.requestId,
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
    });

    res.status(error.statusCode).json({
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      requestId: req.requestId,
    });

    return;
  }

  logger.error("Unexpected server error", {
    requestId: req.requestId,
    error:
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : String(error),
  });

  res.status(500).json({
    statusCode: 500,
    code: ERROR_CODES.INTERNAL_SERVER_ERROR,
    message: "Internal server error",
    requestId: req.requestId,
  });
};