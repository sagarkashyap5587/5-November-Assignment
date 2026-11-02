import type { PaginationMeta } from "../../../../common/utils.js";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
}

export interface SearchUsersInput {
  query: string;
  currentUserId: string;
  skip: number;
  limit: number;
  page: number;
}

export interface SearchUsersResult {
  users: UserSummary[];
  pagination: PaginationMeta;
}