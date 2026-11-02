import winston from "winston";
import { ConfigurationFactory } from "../config/configuration.js";

const SENSITIVE_KEYS = new Set([
  "authorization",
  "password",
  "passwordhash",
  "token",
  "accesstoken",
  "refreshtoken",
  "x-access-token",
  "x-refresh-token",
  "jwt_access_secret",
  "jwt_refresh_secret",
  "smtp_pass",
  "secret",
]);

const REDACTED_VALUE = "[REDACTED]";

function redactString(value: string): string {
  return value
    .replace(
      /(Bearer\s+)[A-Za-z0-9\-._~+/]+=*/gi,
      `$1${REDACTED_VALUE}`,
    )
    .replace(
      /((?:access|refresh)[_-]?token\s*[:=]\s*)["']?[^,\s"']+/gi,
      `$1${REDACTED_VALUE}`,
    );
}

function redactValue(value: unknown, key = ""): unknown {
  if (SENSITIVE_KEYS.has(key.toLowerCase())) {
    return REDACTED_VALUE;
  }

  if (typeof value === "string") {
    return redactString(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item));
  }

  if (typeof value === "object" && value !== null) {
    const safeObject: Record<string, unknown> = {};

    for (const [childKey, childValue] of Object.entries(value)) {
      safeObject[childKey] = redactValue(childValue, childKey);
    }

    return safeObject;
  }

  return value;
}

const redactFormat = winston.format((info) => {
  const safeInfo = redactValue(info) as Record<string, unknown>;

  return Object.assign(info, safeInfo);
});

const logger = winston.createLogger({
  level: ConfigurationFactory.LOG_LEVEL,

  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    redactFormat(),
    winston.format.json(),
  ),

  transports: [
    new winston.transports.Console(),
  ],
});

export default logger;