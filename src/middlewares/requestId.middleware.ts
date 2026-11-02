import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";
import logger from "../logger/logger.js";

const REQUEST_ID_PATTERN = /^[a-zA-Z0-9._:-]{1,128}$/;

export const requestIdMiddleware: RequestHandler = (
  req,
  res,
  next,
) => {
  const incomingRequestId = req.headers["x-request-id"];

  const isValidRequestId =
    typeof incomingRequestId === "string" &&
    REQUEST_ID_PATTERN.test(incomingRequestId);

  const requestId = isValidRequestId
    ? incomingRequestId
    : randomUUID();

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  const startedAt = Date.now();

  res.on("finish", () => {
    logger.info("HTTP request completed", {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
      ip: req.ip,
    });
  });

  next();
};