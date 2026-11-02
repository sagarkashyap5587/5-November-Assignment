import type { RequestHandler } from "express";
import { AppError, ERROR_CODES } from "../common/errors.js";
import type { DeviceDetails } from "../interfaces/express.js";

function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
    });

    return true;
  } catch {
    return false;
  }
}

export const headerValidator: RequestHandler = (
  req,
  _res,
  next,
) => {
  if (req.method === "GET" && req.path === "/health") {
    next();
    return;
  }

  const deviceId = req.headers["device_id"];
  const deviceType = req.headers["device_type"];
  const timezone = req.headers["timezone"];
  const lang = req.headers["lang"];

  if (
    typeof deviceId !== "string" ||
    deviceId.trim().length === 0
  ) {
    next(
      new AppError(
        400,
        ERROR_CODES.DEVICE_ID_REQUIRED,
        "device_id header is required",
      ),
    );
    return;
  }

  if (
    typeof deviceType !== "string" ||
    !["1", "2", "3"].includes(deviceType)
  ) {
    next(
      new AppError(
        400,
        ERROR_CODES.DEVICE_TYPE_INVALID,
        "device_type must be 1, 2 or 3",
      ),
    );
    return;
  }

  if (
    typeof timezone !== "string" ||
    !isValidTimezone(timezone)
  ) {
    next(
      new AppError(
        400,
        ERROR_CODES.TIMEZONE_INVALID,
        "A valid IANA timezone is required",
      ),
    );
    return;
  }

  if (lang !== "en" && lang !== "hi") {
    next(
      new AppError(
        400,
        ERROR_CODES.LANG_INVALID,
        "lang must be en or hi",
      ),
    );
    return;
  }

  const device: DeviceDetails = {
    deviceId: deviceId.trim(),
    deviceType: Number(deviceType) as DeviceDetails["deviceType"],
    timezone,
    lang,
  };

  req.device = device;

  next();
};