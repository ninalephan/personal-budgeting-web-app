import { pgTable, uuid, text, timestamp, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const households = pgTable("households", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const householdMembers = pgTable("household_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  role: text("role", { enum: ["owner", "member"] }).notNull(),
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueMembership: unique().on(table.householdId, table.userId),
}));

export const householdInvites = pgTable("household_invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id),
  email: text("email").notNull(),
  token: uuid("token").notNull().defaultRandom().unique(),
  invitedByUserId: uuid("invited_by_user_id").notNull().references(() => users.id),
  status: text("status", { enum: ["pending", "accepted"] }).notNull().default("pending"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Relations power the `db.query` join API used below.
export const householdMembersRelations = relations(householdMembers, ({ one }) => ({
  user: one(users, { fields: [householdMembers.userId], references: [users.id] }),
  household: one(households, { fields: [householdMembers.householdId], references: [households.id] }),
}));

export const householdInvitesRelations = relations(householdInvites, ({ one }) => ({
  household: one(households, { fields: [householdInvites.householdId], references: [households.id] }),
  invitedBy: one(users, { fields: [householdInvites.invitedByUserId], references: [users.id] }),
}));