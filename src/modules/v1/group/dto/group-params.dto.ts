import { z } from "zod";

export const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Must be a valid id");

export const groupParamsSchema = z.object({
  groupId: objectIdSchema,
});

export const groupMemberParamsSchema = z.object({
  groupId: objectIdSchema,
  userId: objectIdSchema,
});