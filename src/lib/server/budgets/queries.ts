import { and, desc, eq, lt } from "drizzle-orm";
import { db } from "@/lib/server/db";
import { budgets } from "@/lib/server/db/schema";

/** A household member's budget rows for a given month ("YYYY-MM-01"). Empty means they haven't set one up yet. */
export async function getBudgetForMonth(householdId: string, userId: string, month: string) {
  return db.query.budgets.findMany({
    where: and(
      eq(budgets.householdId, householdId),
      eq(budgets.userId, userId),
      eq(budgets.month, month)
    ),
  });
}

/**
 * The most recent month strictly before `month` that has any budget rows,
 * fully expanded. Used to carry a budget forward into a new month instead
 * of making the user recreate it — empty if they've never budgeted at all.
 */
export async function getLatestBudgetBeforeMonth(householdId: string, userId: string, month: string) {
  const latest = await db.query.budgets.findFirst({
    where: and(eq(budgets.householdId, householdId), eq(budgets.userId, userId), lt(budgets.month, month)),
    orderBy: [desc(budgets.month)],
  });
  if (!latest) return [];

  return db.query.budgets.findMany({
    where: and(
      eq(budgets.householdId, householdId),
      eq(budgets.userId, userId),
      eq(budgets.month, latest.month)
    ),
  });
}
