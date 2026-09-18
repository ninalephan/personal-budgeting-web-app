import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/lib/server/db";
import { transactions, transactionSplits } from "@/lib/server/db/schema";
import { getAccountsForHousehold } from "@/lib/server/accounts/queries";
import { getMembersForHousehold } from "@/lib/server/households/queries";
import { nextMonthStart } from "@/lib/server/budgets/month";

/** Design doc §15.1 — total household spending for a month; non-ignored transactions only. */
export async function getHouseholdSpending(householdId: string, month: string): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${transactions.amount}), 0)::int` })
    .from(transactions)
    .where(
      and(
        eq(transactions.householdId, householdId),
        eq(transactions.isIgnored, false),
        gte(transactions.transactionDate, month),
        lt(transactions.transactionDate, nextMonthStart(month))
      )
    );
  return row?.total ?? 0;
}

export type PartnerSpending = {
  userId: string;
  displayName: string | null;
  spent: number;
};

/**
 * Design doc §15.2 — spending attributed by transaction split, not by
 * who physically paid, so this answers "how much of the household's
 * spending is this person's responsibility," never confusing that with
 * who swiped the card.
 */
export async function getPartnerSpending(householdId: string, month: string): Promise<PartnerSpending[]> {
  const members = await getMembersForHousehold(householdId);

  const rows = await db
    .select({
      userId: transactionSplits.userId,
      spent: sql<number>`coalesce(sum(${transactionSplits.amount}), 0)::int`,
    })
    .from(transactionSplits)
    .innerJoin(transactions, eq(transactionSplits.transactionId, transactions.id))
    .where(
      and(
        eq(transactions.householdId, householdId),
        eq(transactions.isIgnored, false),
        gte(transactions.transactionDate, month),
        lt(transactions.transactionDate, nextMonthStart(month))
      )
    )
    .groupBy(transactionSplits.userId);

  const spentByUser = new Map(rows.map((row) => [row.userId, row.spent]));

  return members.map((member) => ({
    userId: member.userId,
    displayName: member.user.displayName,
    spent: spentByUser.get(member.userId) ?? 0,
  }));
}

export type NetCashAvailable = {
  household: number;
  byUser: Record<string, number>;
};

/**
 * Design doc §15.5 / §8.2 — eligible balances only: checking accounts
 * count, credit-card balances never contribute positive cash, and
 * savings is deliberately excluded for now since the doc leaves its
 * treatment as an explicit, unresolved product policy rather than
 * defaulting it in either direction. Joint accounts (owner_user_id null)
 * count at the household level but not toward any individual's figure,
 * per §8.2's recommended policy.
 */
export async function getNetCashAvailable(householdId: string): Promise<NetCashAvailable> {
  const accounts = await getAccountsForHousehold(householdId);
  const eligible = accounts.filter((account) => account.type === "checking");

  const household = eligible.reduce((sum, account) => sum + account.balance, 0);

  const byUser: Record<string, number> = {};
  for (const account of eligible) {
    if (!account.ownerUserId) continue;
    byUser[account.ownerUserId] = (byUser[account.ownerUserId] ?? 0) + account.balance;
  }

  return { household, byUser };
}
