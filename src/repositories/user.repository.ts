import mongoose from "mongoose";
import { User, type IUser } from "../schemas/user.schema.js";

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

class UserRepository {
  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email }).exec();
  }

  // passwordHash has `select: false`, so login must request it explicitly.
  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    return User.findOne({ email }).select("+passwordHash").exec();
  }

  async findById(userId: string): Promise<IUser | null> {
    return User.findById(userId).exec();
  }

    async findManyByIds(userIds: string[]): Promise<IUser[]> {
    if (userIds.length === 0) {
      return [];
    }

    return User.find({
      _id: { $in: userIds.map((id) => new mongoose.Types.ObjectId(id)) }
    }).exec();
  }
  
  async create(userData: {
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<IUser> {
    const user = await User.create(userData);
    return user.toObject();
  }

  async updateById(
    userId: string,
    data: { name?: string }
  ): Promise<IUser | null> {
    return User.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(userId),
        isActive: true
      },
      { $set: data },
      { new: true, runValidators: true }
    ).exec();
  }

  async search(params: {
    query: string;
    excludeUserId: string;
    skip: number;
    limit: number;
  }): Promise<{ users: IUser[]; total: number }> {
    const pattern = new RegExp(escapeRegex(params.query), "i");

    const filter = {
      isActive: true,
      _id: { $ne: new mongoose.Types.ObjectId(params.excludeUserId) },
      $or: [{ name: pattern }, { email: pattern }]
    };

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ name: 1, _id: 1 })
        .skip(params.skip)
        .limit(params.limit)
        .exec(),
      User.countDocuments(filter).exec()
    ]);

    return { users, total };
  }

  async deleteById(userId: string): Promise<void> {
    await User.findByIdAndDelete(userId).exec();
  }
}

export const userRepository = new UserRepository();