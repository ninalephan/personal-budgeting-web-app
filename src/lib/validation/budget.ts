import { z } from "zod";

/** A single category's planned amount, entered in dollars (converted to cents before storage). */
export const budgetAmountSchema = z.coerce
  .number({ message: "Enter a valid amount." })
  .min(0, "Amounts can't be negative.")
  .max(1_000_000, "Keep it under $1,000,000.");

/** Name for a new, user-added category (e.g. "Netflix" under Bills). */
export const categoryNameSchema = z
  .string()
  .trim()
  .min(1, "Enter a category name.")
  .max(100, "Keep it under 100 characters.");
