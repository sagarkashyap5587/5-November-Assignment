import { z } from "zod";

// strictObject rejects unknown keys such as email or password.
export const updateProfileSchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(2, "Name must contain at least 2 characters")
    .max(50, "Name cannot exceed 50 characters")
});

export type UpdateProfileDTO = z.infer<typeof updateProfileSchema>;