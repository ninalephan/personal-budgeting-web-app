import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/lib/server/db";
import { transactions, transactionSplits } from "@/lib/server/db/schema";
import { getBudgetForMonth } from "./queries";
import { nextMonthStart } from "./month";

export type CategoryBudgetCalculation = {
  categoryId: string;
  plannedAmount: number;
  spent: number;
  remaining: number;
};

export type BudgetSummary = {
  totalPlanned: number;
  totalSpent: number;
  totalRemaining: number;
  categories: CategoryBudgetCalculation[];
};

/**
 * Design doc §13.1 + §15.3 — planned vs. actual spend per category for a
 * household member's month, and the totals rolled up across all of them
 * (the dashboard's "remaining budget" figure). `spent` is attributed by
 * transaction splits, not who physically paid (§15.2's distinction
 * applies here too — a category can be "spent" against by a user even on
 * a transaction their partner paid for).
 */
export async function getBudgetSummary(
  householdId: string,
  userId: string,
  month: string
): Promise<BudgetSummary> {
  const budgetRows = await getBudgetForMonth(householdId, userId, month);

  const spendRows = await db
    .select({
      categoryId: transactions.categoryId,
      spent: sql<number>`coalesce(sum(${transactionSplits.amount}), 0)::int`,
    })
    .from(transactionSplits)
    .innerJoin(transactions, eq(transactionSplits.transactionId, transactions.id))
    .where(
      and(
        eq(transactionSplits.userId, userId),
        eq(transactions.householdId, householdId),
        eq(transactions.isIgnored, false),
        gte(transactions.transactionDate, month),
        lt(transactions.transactionDate, nextMonthStart(month))
      )
    )
    .groupBy(transactions.categoryId);

  const spentByCategory = new Map(spendRows.map((row) => [row.categoryId, row.spent]));

  const categories = budgetRows.map((budget) => {
    const spent = spentByCategory.get(budget.categoryId) ?? 0;
    return {
      categoryId: budget.categoryId,
      plannedAmount: budget.plannedAmount,
      spent,
      remaining: budget.plannedAmount - spent,
    };
  });

  const totalPlanned = categories.reduce((sum, c) => sum + c.plannedAmount, 0);
  const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0);

  return {
    totalPlanned,
    totalSpent,
    totalRemaining: totalPlanned - totalSpent,
    categories,
  };
}
