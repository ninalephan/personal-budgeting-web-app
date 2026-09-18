import { and, eq } from "drizzle-orm";
import { db } from "@/lib/server/db";
import { categories } from "@/lib/server/db/schema";

export type CategoryGroupValue = "expenses" | "savings" | "debt" | "bills";

export class CategoryNotFoundError extends Error {
  constructor() {
    super("Category not found for this household.");
    this.name = "CategoryNotFoundError";
  }
}

/** Adds a category owned by this household — the only kind there is. */
export async function createCategory(householdId: string, name: string, group: CategoryGroupValue) {
  const [category] = await db.insert(categories).values({ householdId, name, group }).returning();
  return category;
}

/**
 * Renames a category — scoped to `householdId` so a household can never
 * rename another's category, even if it somehow got hold of its id.
 */
export async function renameCategory(householdId: string, categoryId: string, name: string) {
  const [updated] = await db
    .update(categories)
    .set({ name, updatedAt: new Date() })
    .where(and(eq(categories.id, categoryId), eq(categories.householdId, householdId)))
    .returning();
  if (!updated) {
    throw new CategoryNotFoundError();
  }
  return updated;
}
