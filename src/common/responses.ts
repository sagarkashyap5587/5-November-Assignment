
import type { ErrorCode } from "./errors.js";

export interface SuccessResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export interface ErrorResponse {
  statusCode: number;
  code: ErrorCode;
  message: string;
  requestId: string;
}

export const successResponse = <T>(
  statusCode: number,
  message: string,
  data: T
): SuccessResponse<T> => {
  return {
    statusCode,
    message,
    data
  };
};

export const errorResponse = (
  statusCode: number,
  code: ErrorCode,
  message: string,
  requestId: string
): ErrorResponse => {
  return {
    statusCode,
    code,
    message,
    requestId
  };
};
