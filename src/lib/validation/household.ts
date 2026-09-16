import { z } from "zod";

const emailSchema = z.email("Enter a valid email address.");

const userNameSchema = z
  .string()
  .trim()
  .min(1, "Enter your first name.")
  .max(100, "Keep it under 100 characters.");

export const createHouseholdSchema = z.object({
  userName: userNameSchema,
  name: z
    .string()
    .trim()
    .min(1, "Give your household a name.")
    .max(100, "Keep it under 100 characters."),
  inviteEmail: z.union([z.literal(""), emailSchema]).optional(),
});

export type CreateHouseholdInput = z.infer<typeof createHouseholdSchema>;

export const inviteToHouseholdSchema = z.object({
  email: emailSchema,
});

export type InviteToHouseholdInput = z.infer<typeof inviteToHouseholdSchema>;

export const acceptInviteSchema = z.object({
  userName: userNameSchema,
});

export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
