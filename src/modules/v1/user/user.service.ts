import { AppError, ERROR_CODES } from "../../../common/errors.js";
import { userRepository } from "../../../repositories/user.repository.js";
import type { IUser } from "../../../schemas/user.schema.js";

import type {
  UserProfile,
  UserSummary
} from "./interface/user.interface.js";

const toProfile = (user: IUser): UserProfile => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  createdAt: user.createdAt.toISOString()
});

const userNotFound = (): AppError =>
  new AppError(404, ERROR_CODES.NOT_FOUND, "User not found");

class UserService {
  async getProfile(userId: string): Promise<UserProfile> {
    const user = await userRepository.findById(userId);

    if (!user || !user.isActive) {
      throw userNotFound();
    }

    return toProfile(user);
  }

  async updateProfile(
    userId: string,
    data: { name: string }
  ): Promise<UserProfile> {
    const user = await userRepository.updateById(userId, data);

    if (!user) {
      throw userNotFound();
    }

    return toProfile(user);
  }

  async findByEmail(email: string): Promise<UserSummary> {
    const user = await userRepository.findByEmail(email);

    if (!user || !user.isActive) {
      throw new AppError(
        404,
        ERROR_CODES.NOT_FOUND,
        "No user found with this email"
      );
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email
    };
  }
}

export const userService = new UserService();