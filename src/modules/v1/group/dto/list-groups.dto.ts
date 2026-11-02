import { z } from "zod";

export const listGroupsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  sortBy: z.enum(["name", "createdAt", "updatedAt"]).default("updatedAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type ListGroupsQueryDTO = z.infer<typeof listGroupsQuerySchema>;