import { z } from "zod";

export const searchUsersSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please provide a valid email")
    .transform((value) => value.toLowerCase())
});

export type SearchUsersDTO = z.infer<typeof searchUsersSchema>;