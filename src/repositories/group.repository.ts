import mongoose from "mongoose";
import { Group, type IGroup } from "../schemas/group.schema.js";

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

const toObjectId = (id: string): mongoose.Types.ObjectId | null =>
  OBJECT_ID_PATTERN.test(id) ? new mongoose.Types.ObjectId(id) : null;

export type GroupSortField = "name" | "createdAt" | "updatedAt";

class GroupRepository {
  async create(data: {
    name: string;
    createdBy: string;
  }): Promise<IGroup> {
    const creatorId = new mongoose.Types.ObjectId(data.createdBy);

    const group = await Group.create({
      name: data.name,
      createdBy: creatorId,
      members: [{ userId: creatorId, joinedAt: new Date() }],
    });

    return group.toObject();
  }

  async findActiveById(groupId: string): Promise<IGroup | null> {
    const id = toObjectId(groupId);

    if (!id) {
      return null;
    }

    return Group.findOne({ _id: id, isArchived: false })
      .lean<IGroup>()
      .exec();
  }

  async isMember(groupId: string, userId: string): Promise<boolean> {
    const id = toObjectId(groupId);
    const memberId = toObjectId(userId);

    if (!id || !memberId) {
      return false;
    }

    const count = await Group.countDocuments({
      _id: id,
      isArchived: false,
      "members.userId": memberId,
    }).exec();

    return count > 0;
  }

  async listByMember(params: {
    userId: string;
    skip: number;
    limit: number;
    sortBy: GroupSortField;
    order: "asc" | "desc";
  }): Promise<{ groups: IGroup[]; total: number }> {
    const filter = {
      isArchived: false,
      "members.userId": new mongoose.Types.ObjectId(params.userId),
    };

    const sort: Record<string, 1 | -1> = {};
    sort[params.sortBy] = params.order === "asc" ? 1 : -1;
    sort._id = 1;

    const [groups, total] = await Promise.all([
      Group.find(filter)
        .sort(sort)
        .skip(params.skip)
        .limit(params.limit)
        .lean<IGroup[]>()
        .exec(),
      Group.countDocuments(filter).exec(),
    ]);

    return { groups, total };
  }

  async rename(groupId: string, name: string): Promise<IGroup | null> {
    const id = toObjectId(groupId);

    if (!id) {
      return null;
    }

    return Group.findOneAndUpdate(
      { _id: id, isArchived: false },
      { $set: { name } },
      { new: true },
    )
      .lean<IGroup>()
      .exec();
  }

  // Atomic: succeeds only when the user is not already a member.
  async addMember(groupId: string, userId: string): Promise<boolean> {
    const id = toObjectId(groupId);
    const memberId = toObjectId(userId);

    if (!id || !memberId) {
      return false;
    }

    const result = await Group.updateOne(
      {
        _id: id,
        isArchived: false,
        "members.userId": { $ne: memberId },
      },
      {
        $push: { members: { userId: memberId, joinedAt: new Date() } },
      },
    ).exec();

    return result.modifiedCount === 1;
  }

  // Returns the updated group, or null when group/member was not found.
  async removeMember(
    groupId: string,
    userId: string,
  ): Promise<IGroup | null> {
    const id = toObjectId(groupId);
    const memberId = toObjectId(userId);

    if (!id || !memberId) {
      return null;
    }

    return Group.findOneAndUpdate(
      {
        _id: id,
        isArchived: false,
        "members.userId": memberId,
      },
      {
        $pull: { members: { userId: memberId } },
      },
      { new: true },
    )
      .lean<IGroup>()
      .exec();
  }

  async archive(groupId: string): Promise<void> {
    const id = toObjectId(groupId);

    if (!id) {
      return;
    }

    await Group.updateOne({ _id: id }, { $set: { isArchived: true } }).exec();
  }
}

export const groupRepository = new GroupRepository();