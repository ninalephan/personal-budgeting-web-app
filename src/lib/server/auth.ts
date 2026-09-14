// lib/server/auth.ts
import { auth } from "@clerk/nextjs/server";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

export async function getCurrentUser() {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;

  const existing = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  });
  if (existing) return existing;

  const [created] = await db
    .insert(users)
    .values({
      clerkUserId: userId,
      email: sessionClaims?.email as string,
    })
    .returning();
  return created;
}