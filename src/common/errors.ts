
export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  DEVICE_ID_REQUIRED: "DEVICE_ID_REQUIRED",
  DEVICE_TYPE_INVALID: "DEVICE_TYPE_INVALID",
  TIMEZONE_INVALID: "TIMEZONE_INVALID",
  LANG_INVALID: "LANG_INVALID",
  SPLIT_TOTAL_MISMATCH: "SPLIT_TOTAL_MISMATCH",
  UNAUTHORIZED: "UNAUTHORIZED",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  REFRESH_TOKEN_REUSED: "REFRESH_TOKEN_REUSED",
  NOT_GROUP_MEMBER: "NOT_GROUP_MEMBER",
  NOT_FOUND: "NOT_FOUND",
  EMAIL_TAKEN: "EMAIL_TAKEN",
  ALREADY_MEMBER: "ALREADY_MEMBER",
  BALANCE_NOT_SETTLED: "BALANCE_NOT_SETTLED",
  TOO_MANY_ATTEMPTS: "TOO_MANY_ATTEMPTS",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR"
} as const;

export type ErrorCode =
  (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    code: ErrorCode,
    message: string,
    isOperational = true
  ) {
    super(message);

    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, new.target.prototype);

    Error.captureStackTrace(this, this.constructor);
  }
}
