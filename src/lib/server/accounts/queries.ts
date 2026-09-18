import { and, eq } from "drizzle-orm";
import { db } from "@/lib/server/db";
import { accounts } from "@/lib/server/db/schema";

/** A household's active accounts (design doc §8) — the raw balances themselves need no calculation, per §15.4. */
export async function getAccountsForHousehold(householdId: string) {
  return db.query.accounts.findMany({
    where: and(eq(accounts.householdId, householdId), eq(accounts.isActive, true)),
  });
}
