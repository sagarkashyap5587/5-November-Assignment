import mongoose, { Schema, type Model } from "mongoose";

export interface IGroupMember {
  userId: mongoose.Types.ObjectId;
  joinedAt: Date;
}

export interface IGroup {
  _id: mongoose.Types.ObjectId;
  name: string;
  createdBy: mongoose.Types.ObjectId;
  members: IGroupMember[];
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const memberSchema = new Schema<IGroupMember>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  },
);

const groupSchema = new Schema<IGroup>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    members: {
      type: [memberSchema],
      default: [],
    },

    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

groupSchema.index({ "members.userId": 1 });

export const Group: Model<IGroup> =
  mongoose.models.Group ?? mongoose.model<IGroup>("Group", groupSchema);