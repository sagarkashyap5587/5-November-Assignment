import { Session, type ISession } from "../schemas/session.schema.js";
import mongoose from "mongoose";

class SessionRepository {
  async create(sessionData: {
    userId: string;
    deviceId: string;
    deviceType: 1 | 2 | 3;
    timezone: string;
    lang: "en" | "hi";
    expiresAt: Date;
  }): Promise<ISession> {
    const session = await Session.create({
      ...sessionData,
      userId: new mongoose.Types.ObjectId(sessionData.userId),
      loginAt: new Date(),
      lastUsedAt: new Date(),
      revokedAt: null
    });

    return session.toObject();
  }

  async findActiveById(sessionId: string): Promise<ISession | null> {
    return Session.findOne({
      _id: new mongoose.Types.ObjectId(sessionId),
      revokedAt: null,
      expiresAt: { $gt: new Date() }
    }).exec();
  }

  async findActiveByUserAndDevice(
    userId: string,
    deviceId: string
  ): Promise<ISession[]> {
    return Session.find({
      userId: new mongoose.Types.ObjectId(userId),
      deviceId,
      revokedAt: null,
      expiresAt: { $gt: new Date() }
    })
      .lean<ISession[]>()
      .exec();
  }

  async listActiveByUser(userId: string): Promise<ISession[]> {
    return Session.find({
      userId: new mongoose.Types.ObjectId(userId),
      revokedAt: null,
      expiresAt: { $gt: new Date() }
    })
      .sort({ lastUsedAt: -1 })
      .lean<ISession[]>()
      .exec();
  }

  async touch(sessionId: string, expiresAt: Date): Promise<void> {
    await Session.updateOne(
      { _id: new mongoose.Types.ObjectId(sessionId) },
      { $set: { lastUsedAt: new Date(), expiresAt } }
    ).exec();
  }

  async revokeById(sessionId: string): Promise<void> {
    await Session.updateOne(
      {
        _id: new mongoose.Types.ObjectId(sessionId),
        revokedAt: null
      },
      { $set: { revokedAt: new Date() } }
    ).exec();
  }

  async revokeAllByUser(userId: string): Promise<void> {
    await Session.updateMany(
      {
        userId: new mongoose.Types.ObjectId(userId),
        revokedAt: null
      },
      { $set: { revokedAt: new Date() } }
    ).exec();
  }

  async deleteById(sessionId: string): Promise<void> {
    await Session.findByIdAndDelete(sessionId).exec();
  }
}

export const sessionRepository = new SessionRepository();