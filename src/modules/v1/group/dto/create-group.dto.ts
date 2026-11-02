import { z } from "zod";

export const groupNameSchema = z
  .string()
  .trim()
  .min(2, "Group name must contain at least 2 characters")
  .max(100, "Group name cannot exceed 100 characters");

export const createGroupSchema = z.object({
  name: groupNameSchema,
});

export type CreateGroupDTO = z.infer<typeof createGroupSchema>;