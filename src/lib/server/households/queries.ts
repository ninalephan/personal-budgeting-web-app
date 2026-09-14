import { and, eq, gt } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/server/db";
import { householdInvites, householdMembers } from "@/lib/server/db/schema";

/**
 * All households a given (internal) user belongs to, with the household
 * row eager-loaded. For the MVP this should be at most one — see
 * createHouseholdForUser, which is the place that enforces that today.
 */
export async function getHouseholdsForUser(userId: string) {
  return db.query.householdMembers.findMany({
    where: eq(householdMembers.userId, userId),
    with: { household: true },
  });
}

/**
 * Guards pages that only make sense once a user has a household —
 * redirects to /getting-started otherwise.
 */
export async function requireHousehold(userId: string) {
  const households = await getHouseholdsForUser(userId);
  if (households.length === 0) {
    redirect("/getting-started");
  }
  return households;
}

/**
 * Guards pages that only make sense before a user has a household (e.g.
 * getting-started itself) — redirects to /dashboard otherwise.
 */
export async function requireNoHousehold(userId: string) {
  const households = await getHouseholdsForUser(userId);
  if (households.length > 0) {
    redirect("/dashboard");
  }
}

/** All members of a household, with each member's user row eager-loaded. */
export async function getMembersForHousehold(householdId: string) {
  return db.query.householdMembers.findMany({
    where: eq(householdMembers.householdId, householdId),
    with: { user: true },
    orderBy: (members, { asc }) => [asc(members.joinedAt)],
  });
}

/** Invites for a household that haven't been accepted (or replaced) yet. */
export async function getPendingInvitesForHousehold(householdId: string) {
  return db.query.householdInvites.findMany({
    where: and(eq(householdInvites.householdId, householdId), eq(householdInvites.status, "pending")),
    orderBy: (invites, { desc }) => [desc(invites.createdAt)],
  });
}

/**
 * The most recent still-valid pending invite for an email address, if any.
 * Used to route a freshly signed-up invitee to their invite instead of
 * getting-started's "create a household" form.
 */
export async function getPendingInviteForEmail(email: string) {
  return db.query.householdInvites.findFirst({
    where: and(
      eq(householdInvites.email, email),
      eq(householdInvites.status, "pending"),
      gt(householdInvites.expiresAt, new Date())
    ),
    orderBy: (invites, { desc }) => [desc(invites.createdAt)],
  });
}

/** An invite by its token, with the household it's for eager-loaded. */
export async function getInviteByToken(token: string) {
  return db.query.householdInvites.findFirst({
    where: eq(householdInvites.token, token),
    with: { household: true },
  });
}
