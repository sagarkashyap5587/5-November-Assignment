import mongoose, { Schema, type Model } from "mongoose";

export interface ISession {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  deviceId: string;
  deviceType: 1 | 2 | 3;
  timezone: string;
  lang: "en" | "hi";
  loginAt: Date;
  lastUsedAt: Date;
  revokedAt: Date | null;
  expiresAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    deviceId: {
      type: String,
      required: true,
    },

    deviceType: {
      type: Number,
      enum: [1, 2, 3],
      required: true,
    },

    timezone: {
      type: String,
      required: true,
    },

    lang: {
      type: String,
      enum: ["en", "hi"],
      required: true,
    },

    loginAt: {
      type: Date,
      default: Date.now,
    },

    lastUsedAt: {
      type: Date,
      default: Date.now,
    },

    revokedAt: {
      type: Date,
      default: null,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

sessionSchema.index({ userId: 1, deviceId: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session: Model<ISession> =
  mongoose.models.Session ?? mongoose.model<ISession>("Session", sessionSchema);
