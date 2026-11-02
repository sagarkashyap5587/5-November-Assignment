import type { PaginationMeta } from "../../../../common/utils.js";
import type { GroupSortField } from "../../../../repositories/group.repository.js";

export interface GroupSummary {
  id: string;
  name: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMemberDetails {
  userId: string;
  name: string;
  email: string;
  joinedAt: string;
}

export interface GroupDetails {
  id: string;
  name: string;
  createdBy: string;
  members: GroupMemberDetails[];
  createdAt: string;
  updatedAt: string;
}

export interface ListGroupsInput {
  userId: string;
  skip: number;
  page: number;
  limit: number;
  sortBy: GroupSortField;
  order: "asc" | "desc";
}

export type ListGroupsResult = PaginationMeta & {
  items: GroupSummary[];
};