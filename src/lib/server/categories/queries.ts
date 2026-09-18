import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/server/db";
import { categories } from "@/lib/server/db/schema";

/** A household's active categories — there are no shared defaults, so this is entirely what they've added themselves. */
export async function getCategories(householdId: string) {
  return db.query.categories.findMany({
    where: and(eq(categories.householdId, householdId), eq(categories.isActive, true)),
    orderBy: [asc(categories.group), asc(categories.name)],
  });
}
