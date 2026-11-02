import { z } from "zod";
import { groupNameSchema } from "./create-group.dto.js";

export const updateGroupSchema = z.object({
  name: groupNameSchema,
});

export type UpdateGroupDTO = z.infer<typeof updateGroupSchema>;