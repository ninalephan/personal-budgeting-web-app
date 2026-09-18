import { sql } from "drizzle-orm";
import { db } from "@/lib/server/db";
import { budgets } from "@/lib/server/db/schema";
import { currentMonthStart } from "./month";
import { getBudgetForMonth, getLatestBudgetBeforeMonth } from "./queries";

/**
 * Returns the current month's budget rows, creating them first by copying
 * the most recent prior month's amounts if the current month doesn't have
 * any yet — a budget is meant to persist month to month until edited, not
 * be recreated from scratch every month. Empty means they've never
 * budgeted at all, which is the only time the "set up a budget" prompt
 * should show.
 */
export async function ensureCurrentMonthBudget(householdId: string, userId: string) {
  const month = currentMonthStart();
  const current = await getBudgetForMonth(householdId, userId, month);
  if (current.length > 0) {
    return current;
  }

  const previous = await getLatestBudgetBeforeMonth(householdId, userId, month);
  if (previous.length === 0) {
    return [];
  }

  return db
    .insert(budgets)
    .values(
      previous.map((row) => ({
        householdId,
        userId,
        month,
        categoryId: row.categoryId,
        plannedAmount: row.plannedAmount,
      }))
    )
    .returning();
}

/**
 * Creates or updates the current month's planned amounts — this is the
 * only write path for editing a budget, whether it's being set up for the
 * first time or changed later.
 */
export async function saveMonthlyBudget(
  householdId: string,
  userId: string,
  entries: { categoryId: string; plannedAmount: number }[]
) {
  if (entries.length === 0) {
    return [];
  }

  const month = currentMonthStart();
  return db
    .insert(budgets)
    .values(
      entries.map((entry) => ({
        householdId,
        userId,
        month,
        categoryId: entry.categoryId,
        plannedAmount: entry.plannedAmount,
      }))
    )
    .onConflictDoUpdate({
      target: [budgets.householdId, budgets.userId, budgets.month, budgets.categoryId],
      set: { plannedAmount: sql`excluded.planned_amount`, updatedAt: new Date() },
    })
    .returning();
}
