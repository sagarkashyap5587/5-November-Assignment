import type { DeviceType } from "../enum/enum.js";

export interface AuthenticatedUser {
  userId: string;
  sessionId: string;
}

export interface AccessTokenPayload {
  sub: string;
  sid: string;
}

export interface RefreshTokenPayload {
  sub: string;
  sid: string;
  jti: string;
}

export interface DeviceDetails {
  deviceId: string;
  deviceType: DeviceType;
  timezone: string;
  lang: "en" | "hi";
}

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      auth?: AuthenticatedUser;
      device?: DeviceDetails;
      refreshAuth?: RefreshTokenPayload;
    }
  }
}

export {};