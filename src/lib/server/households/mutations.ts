import { db } from "@/lib/server/db";
import { households, householdMembers, householdInvites, users } from "@/lib/server/db/schema";
import { getHouseholdsForUser } from "./queries";
import { and, eq } from "drizzle-orm";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export class AlreadyInHouseholdError extends Error {
  constructor() {
    super("This user already belongs to a household.");
    this.name = "AlreadyInHouseholdError";
  }
}

export class InviteNotFoundError extends Error {
  constructor() {
    super("This invite is invalid, expired, or already used.");
    this.name = "InviteNotFoundError";
  }
}

function inviteValues(householdId: string, invitedByUserId: string, email: string) {
  return {
    householdId,
    email,
    invitedByUserId,
    expiresAt: new Date(Date.now() + INVITE_TTL_MS),
  };
}

/**
 * Creates a standalone pending invite for an existing household — used by
 * the Households tab to invite someone after the household already
 * exists (as opposed to the invite optionally created alongside the
 * household itself in `createHouseholdForUser`).
 */
export async function createInvite(householdId: string, invitedByUserId: string, email: string) {
  const [invite] = await db
    .insert(householdInvites)
    .values(inviteValues(householdId, invitedByUserId, email))
    .returning();
  return invite;
}

/**
 * Creates a household and makes `userId` its owner, in one transaction —
 * if either insert fails, neither is committed. Optionally also creates
 * a pending invite for `inviteEmail` so the owner can share a join link
 * with their partner right away.
 *
 * For the MVP, a user can belong to at most one household, so this
 * re-checks membership inside the same call rather than trusting the
 * caller to have checked already (the getting-started page checks too,
 * but this makes the guarantee hold even if this function is ever
 * called from somewhere else later).
 */
export async function createHouseholdForUser(
  userId: string,
  name: string,
  userName: string,
  inviteEmail?: string
) {
  const existing = await getHouseholdsForUser(userId);
  if (existing.length > 0) {
    throw new AlreadyInHouseholdError();
  }

  return db.transaction(async (tx) => {
    const [household] = await tx.insert(households).values({ name }).returning();

    await tx.insert(householdMembers).values({
      householdId: household.id,
      userId,
      role: "owner",
    });

    // Update the user's display name in the database
    await tx.update(users)
    .set({ displayName: userName })
    .where(eq(users.id, userId));

    let inviteToken: string | undefined;
    if (inviteEmail) {
      const [invite] = await tx
        .insert(householdInvites)
        .values(inviteValues(household.id, userId, inviteEmail))
        .returning();
      inviteToken = invite.token;
    }

    return { household, inviteToken };
  });
}

/**
 * Adds `userId` to the household behind a pending, unexpired invite
 * `token`, and marks the invite accepted. Also records the invitee's
 * display name — accepting an invite is their only path into the app,
 * so it's the only chance to collect it (they never see the
 * getting-started form). Returns the household on success.
 */
export async function acceptHouseholdInvite(token: string, userId: string, userName: string) {
  const existing = await getHouseholdsForUser(userId);
  if (existing.length > 0) {
    throw new AlreadyInHouseholdError();
  }

  return db.transaction(async (tx) => {
    const invite = await tx.query.householdInvites.findFirst({
      where: and(eq(householdInvites.token, token), eq(householdInvites.status, "pending")),
      with: { household: true },
    });
    if (!invite || invite.expiresAt < new Date()) {
      throw new InviteNotFoundError();
    }

    await tx.insert(householdMembers).values({
      householdId: invite.householdId,
      userId,
      role: "member",
    });

    await tx.update(users).set({ displayName: userName }).where(eq(users.id, userId));

    await tx
      .update(householdInvites)
      .set({ status: "accepted" })
      .where(eq(householdInvites.id, invite.id));

    return invite.household;
  });
}
