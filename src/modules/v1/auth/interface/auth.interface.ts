export interface DeviceInfo {
  deviceId: string;
  deviceType: 1 | 2 | 3;
  timezone: string;
  lang: "en" | "hi";
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface TokenPayload {
  sub: string;
  sid: string;
}

export interface RefreshTokenPayload extends TokenPayload {
  jti: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface RegisterResult {
  user: AuthUser;
  tokens: AuthTokens;
}

export type LoginResult = RegisterResult;

export interface RefreshResult {
  tokens: AuthTokens;
}

export interface SessionInfo {
  sessionId: string;
  deviceId: string;
  deviceType: 1 | 2 | 3;
  timezone: string;
  lang: "en" | "hi";
  loginAt: string;
  lastUsedAt: string;
  isCurrent: boolean;
}