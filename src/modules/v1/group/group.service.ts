import { AppError, ERROR_CODES } from "../../../common/errors.js";
import { getPaginationMeta } from "../../../common/utils.js";

import { groupRepository } from "../../../repositories/group.repository.js";
import { userRepository } from "../../../repositories/user.repository.js";
import type { IGroup } from "../../../schemas/group.schema.js";

import type {
  GroupDetails,
  GroupSummary,
  ListGroupsInput,
  ListGroupsResult,
} from "./interface/group.interface.js";

const groupNotFound = (): AppError =>
  new AppError(404, ERROR_CODES.NOT_FOUND, "Group not found");

const toSummary = (group: IGroup): GroupSummary => ({
  id: group._id.toString(),
  name: group.name,
  memberCount: group.members.length,
  createdAt: group.createdAt.toISOString(),
  updatedAt: group.updatedAt.toISOString(),
});

class GroupService {
  async createGroup(userId: string, name: string): Promise<GroupSummary> {
    const group = await groupRepository.create({
      name,
      createdBy: userId,
    });

    return toSummary(group);
  }

  async listGroups(input: ListGroupsInput): Promise<ListGroupsResult> {
    const { groups, total } = await groupRepository.listByMember({
      userId: input.userId,
      skip: input.skip,
      limit: input.limit,
      sortBy: input.sortBy,
      order: input.order,
    });

    // TODO (Step 11 - Balance Module): add `myBalance` for each group.
    return {
      items: groups.map(toSummary),
      ...getPaginationMeta(input.page, input.limit, total),
    };
  }

  async getGroup(groupId: string): Promise<GroupDetails> {
    const group = await groupRepository.findActiveById(groupId);

    if (!group) {
      throw groupNotFound();
    }

    const memberIds = group.members.map((member) =>
      member.userId.toString(),
    );

    const users = await userRepository.findManyByIds(memberIds);
    const usersById = new Map(
      users.map((user) => [user._id.toString(), user]),
    );

    return {
      id: group._id.toString(),
      name: group.name,
      createdBy: group.createdBy.toString(),
      members: group.members.map((member) => {
        const id = member.userId.toString();
        const user = usersById.get(id);

        return {
          userId: id,
          name: user?.name ?? "Unknown user",
          email: user?.email ?? "",
          joinedAt: member.joinedAt.toISOString(),
        };
      }),
      createdAt: group.createdAt.toISOString(),
      updatedAt: group.updatedAt.toISOString(),
    };
  }

  async renameGroup(groupId: string, name: string): Promise<GroupSummary> {
    const group = await groupRepository.rename(groupId, name);

    if (!group) {
      throw groupNotFound();
    }

    return toSummary(group);
  }

  async addMemberByEmail(
    groupId: string,
    email: string,
  ): Promise<GroupDetails> {
    const targetUser = await userRepository.findByEmail(email);

    if (!targetUser || !targetUser.isActive) {
      throw new AppError(
        404,
        ERROR_CODES.NOT_FOUND,
        "No user found with this email",
      );
    }

    const added = await groupRepository.addMember(
      groupId,
      targetUser._id.toString(),
    );

    if (!added) {
      const group = await groupRepository.findActiveById(groupId);

      if (!group) {
        throw groupNotFound();
      }

      throw new AppError(
        409,
        ERROR_CODES.ALREADY_MEMBER,
        "User is already a member of this group",
      );
    }

    // TODO (Step 13): publish `member.added` event + activity.
    return this.getGroup(groupId);
  }

  async removeMember(groupId: string, targetUserId: string): Promise<void> {
    const group = await groupRepository.findActiveById(groupId);

    if (!group) {
      throw groupNotFound();
    }

    const isTargetMember = group.members.some(
      (member) => member.userId.toString() === targetUserId,
    );

    if (!isTargetMember) {
      throw new AppError(
        404,
        ERROR_CODES.NOT_FOUND,
        "User is not a member of this group",
      );
    }

    const balance = await this.getMemberBalance(groupId, targetUserId);

    if (balance !== 0) {
      throw new AppError(
        409,
        ERROR_CODES.BALANCE_NOT_SETTLED,
        "Member balance must be settled before removal",
      );
    }

    const updated = await groupRepository.removeMember(groupId, targetUserId);

    if (!updated) {
      throw new AppError(
        404,
        ERROR_CODES.NOT_FOUND,
        "User is not a member of this group",
      );
    }

    if (updated.members.length === 0) {
      await groupRepository.archive(groupId);
    }
  }

  // PLACEHOLDER (Step 11 replaces this with the real balance calculation).
  // Until Step 10 adds expenses, every member's balance is genuinely 0.
  private async getMemberBalance(
    _groupId: string,
    _userId: string,
  ): Promise<number> {
    return 0;
  }
}

export const groupService = new GroupService();