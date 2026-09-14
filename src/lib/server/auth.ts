// lib/server/auth.ts
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

export async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  });
  if (existing) return existing;

  const clerkUser = await currentUser();
  const userEmail = clerkUser?.primaryEmailAddress?.emailAddress;

  if (!userEmail) {
    throw new Error("Clerk user has no primary email address");
  }

  const [created] = await db
    .insert(users)
    .values({
      clerkUserId: userId,
      email: userEmail,
    })
    .returning();
  return created;
}

/**
 * Same as `getCurrentUser`, but redirects to sign-in instead of returning
 * null. Pass `returnTo` (a path) when the page being guarded needs the
 * visitor back afterwards — e.g. an invite link a signed-out visitor
 * followed — so sign-in/sign-up send them back there instead of the
 * default post-auth destination.
 */
export async function requireUser(returnTo?: string) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(returnTo ? `/sign-in?redirect_url=${encodeURIComponent(returnTo)}` : "/sign-in");
  }
  return user;
}