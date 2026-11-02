import { z } from "zod";

export const addMemberSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please provide a valid email")
    .transform((value) => value.toLowerCase()),
});

export type AddMemberDTO = z.infer<typeof addMemberSchema>;