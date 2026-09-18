import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/server/db";
import { transactions, transactionSplits } from "@/lib/server/db/schema";
import { getMembersForHousehold } from "@/lib/server/households/queries";

export type LedgerBalance = {
  userId: string;
  displayName: string | null;
  /** Positive: the rest of the household owes this person. Negative: they owe the household. */
  netBalance: number;
};

/**
 * Design doc §14 — derived every time from transaction payer + split
 * data, never persisted as a running balance. For each transaction, the
 * payer is owed back whatever their partner's split covers; a user's net
 * balance is simply what they've paid for the household minus what's
 * been attributed to them, summed across every non-ignored transaction.
 * By construction these net balances always sum to zero across the
 * household (every dollar paid is attributed to exactly one split).
 */
export async function getHouseholdLedger(householdId: string): Promise<LedgerBalance[]> {
  const members = await getMembersForHousehold(householdId);

  const paidRows = await db
    .select({
      userId: transactions.paidByUserId,
      paid: sql<number>`coalesce(sum(${transactions.amount}), 0)::int`,
    })
    .from(transactions)
    .where(and(eq(transactions.householdId, householdId), eq(transactions.isIgnored, false)))
    .groupBy(transactions.paidByUserId);

  const splitRows = await db
    .select({
      userId: transactionSplits.userId,
      attributed: sql<number>`coalesce(sum(${transactionSplits.amount}), 0)::int`,
    })
    .from(transactionSplits)
    .innerJoin(transactions, eq(transactionSplits.transactionId, transactions.id))
    .where(and(eq(transactions.householdId, householdId), eq(transactions.isIgnored, false)))
    .groupBy(transactionSplits.userId);

  const paidByUser = new Map(paidRows.map((row) => [row.userId, row.paid]));
  const attributedByUser = new Map(splitRows.map((row) => [row.userId, row.attributed]));

  return members.map((member) => ({
    userId: member.userId,
    displayName: member.user.displayName,
    netBalance: (paidByUser.get(member.userId) ?? 0) - (attributedByUser.get(member.userId) ?? 0),
  }));
}
