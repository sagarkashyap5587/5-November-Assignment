import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";

import { ConfigurationFactory } from "../../../config/configuration.js";
import {
  AUTH_CONSTANTS,
  REDIS_CONSTANTS
} from "../../../common/constant.js";
import { AppError, ERROR_CODES } from "../../../common/errors.js";
import logger from "../../../logger/logger.js";

import { userRepository } from "../../../repositories/user.repository.js";
import { sessionRepository } from "../../../repositories/session.repository.js";
import { redisService } from "../../../providers/redis/redis.service.js";
import type { IUser } from "../../../schemas/user.schema.js";

import type {
  AuthTokens,
  DeviceInfo,
  LoginInput,
  LoginResult,
  RefreshResult,
  RefreshTokenPayload,
  RegisterInput,
  RegisterResult,
  SessionInfo
} from "./interface/auth.interface.js";

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

const sessionKeyOf = (sessionId: string): string =>
  `${REDIS_CONSTANTS.SESSION_PREFIX}${sessionId}`;

const refreshKeyOf = (sessionId: string): string =>
  `${REDIS_CONSTANTS.REFRESH_TOKEN_PREFIX}${sessionId}`;

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  (error as { code?: unknown }).code === 11000;

// Used to keep login timing similar when the email does not exist.
let dummyHashPromise: Promise<string> | null = null;

const getDummyHash = (): Promise<string> => {
  dummyHashPromise ??= bcrypt.hash(
    "splitease-dummy-password",
    ConfigurationFactory.BCRYPT_SALT_ROUNDS
  );

  return dummyHashPromise;
};

class AuthService {
  async register(
    input: RegisterInput,
    device: DeviceInfo
  ): Promise<RegisterResult> {
    const existingUser = await userRepository.findByEmail(input.email);

    if (existingUser) {
      throw new AppError(
        409,
        ERROR_CODES.EMAIL_TAKEN,
        "Email is already registered"
      );
    }

    const passwordHash = await bcrypt.hash(
      input.password,
      ConfigurationFactory.BCRYPT_SALT_ROUNDS
    );

    let user: IUser;

    try {
      user = await userRepository.create({
        name: input.name,
        email: input.email,
        passwordHash
      });
    } catch (error: unknown) {
      if (isDuplicateKeyError(error)) {
        throw new AppError(
          409,
          ERROR_CODES.EMAIL_TAKEN,
          "Email is already registered"
        );
      }

      throw error;
    }

    const userId = user._id.toString();

    try {
      const tokens = await this.startSession(userId, device);

      return {
        user: {
          id: userId,
          name: user.name,
          email: user.email
        },
        tokens
      };
    } catch (error: unknown) {
      await userRepository.deleteById(userId);
      throw error;
    }
  }

  async login(
    input: LoginInput,
    device: DeviceInfo
  ): Promise<LoginResult> {
    const user = await userRepository.findByEmailWithPassword(input.email);

    const hashToCompare = user?.passwordHash ?? (await getDummyHash());
    const passwordMatches = await bcrypt.compare(
      input.password,
      hashToCompare
    );

    if (!user || !user.isActive || !passwordMatches) {
      throw new AppError(
        401,
        ERROR_CODES.UNAUTHORIZED,
        "Invalid email or password"
      );
    }

    const userId = user._id.toString();
    const tokens = await this.startSession(userId, device);

    logger.info("User logged in", { userId });

    return {
      user: {
        id: userId,
        name: user.name,
        email: user.email
      },
      tokens
    };
  }

  async refresh(auth: RefreshTokenPayload): Promise<RefreshResult> {
    const userId = auth.sub;
    const sessionId = auth.sid;

    const session = await sessionRepository.findActiveById(sessionId);

    if (!session || session.userId.toString() !== userId) {
      await this.revokeSession(sessionId);

      throw new AppError(
        401,
        ERROR_CODES.UNAUTHORIZED,
        "Session is invalid or has been revoked"
      );
    }

    const user = await userRepository.findById(userId);

    if (!user || !user.isActive) {
      await this.revokeSession(sessionId);

      throw new AppError(
        401,
        ERROR_CODES.UNAUTHORIZED,
        "User account is not available"
      );
    }

    // Atomic rotation: succeeds only if the stored jti is still the one
    // presented. A concurrent/replayed use of the same token fails here.
    const newJti = randomUUID();

    const rotated = await redisService.compareAndSet(
      refreshKeyOf(sessionId),
      auth.jti,
      newJti,
      SESSION_TTL_SECONDS
    );

    if (!rotated) {
      await this.revokeSession(sessionId);

      throw new AppError(
        401,
        ERROR_CODES.REFRESH_TOKEN_REUSED,
        "Refresh token reuse detected. Please log in again"
      );
    }

    const tokens = this.signTokens(userId, sessionId, newJti);

    await Promise.all([
      redisService.expire(sessionKeyOf(sessionId), SESSION_TTL_SECONDS),
      sessionRepository.touch(
        sessionId,
        new Date(Date.now() + SESSION_TTL_SECONDS * 1000)
      )
    ]);

    logger.info("Refresh token rotated", { userId, sessionId });

    return { tokens };
  }

  async logout(sessionId: string): Promise<void> {
    await this.revokeSession(sessionId);

    logger.info("User logged out", { sessionId });
  }

  async revokeSession(sessionId: string): Promise<void> {
    await redisService.delMany([
      sessionKeyOf(sessionId),
      refreshKeyOf(sessionId)
    ]);

    await sessionRepository.revokeById(sessionId);
  }

  private signTokens(
    userId: string,
    sessionId: string,
    jti: string
  ): AuthTokens {
    const accessToken = jwt.sign(
      {
        sub: userId,
        sid: sessionId
      },
      ConfigurationFactory.JWT_ACCESS_SECRET,
      {
        expiresIn: AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRY
      }
    );

    const refreshToken = jwt.sign(
      {
        sub: userId,
        sid: sessionId,
        jti
      },
      ConfigurationFactory.JWT_REFRESH_SECRET,
      {
        expiresIn: AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY
      }
    );

    return { accessToken, refreshToken };
  }

   private async startSession(
    userId: string,
    device: DeviceInfo
  ): Promise<AuthTokens> {
    // One active session per device: replace this device's old sessions.
    const previous = await sessionRepository.findActiveByUserAndDevice(
      userId,
      device.deviceId
    );

    for (const old of previous) {
      await this.revokeSession(old._id.toString());
    }

    const session = await sessionRepository.create({
      userId,
      deviceId: device.deviceId,
      deviceType: device.deviceType,
      timezone: device.timezone,
      lang: device.lang,
      expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000)
    });

    const sessionId = session._id.toString();

    try {
      const jti = randomUUID();
      const tokens = this.signTokens(userId, sessionId, jti);

      await redisService.set(
        sessionKeyOf(sessionId),
        userId,
        SESSION_TTL_SECONDS
      );

      await redisService.set(
        refreshKeyOf(sessionId),
        jti,
        SESSION_TTL_SECONDS
      );

      return tokens;
    } catch (error: unknown) {
      await sessionRepository.deleteById(sessionId);

      await redisService.delMany([
        sessionKeyOf(sessionId),
        refreshKeyOf(sessionId)
      ]);

      throw error;
    }
  }

    async logoutAll(userId: string): Promise<void> {
    const sessions = await sessionRepository.listActiveByUser(userId);

    const keys = sessions.flatMap((session) => {
      const id = session._id.toString();
      return [sessionKeyOf(id), refreshKeyOf(id)];
    });

    await redisService.delMany(keys);
    await sessionRepository.revokeAllByUser(userId);

    logger.info("User logged out from all devices", {
      userId,
      sessions: sessions.length
    });
  }

  async listSessions(
    userId: string,
    currentSessionId: string
  ): Promise<SessionInfo[]> {
    const sessions = await sessionRepository.listActiveByUser(userId);

    return sessions.map((session) => ({
      sessionId: session._id.toString(),
      deviceId: session.deviceId,
      deviceType: session.deviceType,
      timezone: session.timezone,
      lang: session.lang,
      loginAt: session.loginAt.toISOString(),
      lastUsedAt: session.lastUsedAt.toISOString(),
      isCurrent: session._id.toString() === currentSessionId
    }));
  }
}

export const authService = new AuthService();