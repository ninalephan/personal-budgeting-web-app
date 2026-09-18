import { pgTable, uuid, text, timestamp, unique, boolean, date, integer, check } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

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

// Design doc §12 — every category belongs to a household; there are no
// shared/global defaults, so each household builds its own list from
// scratch and can rename or add to it freely without affecting anyone else.
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id),
  name: text("name").notNull(),
  group: text("group", { enum: ["expenses", "savings", "debt", "bills"] }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Design doc §13 — one row per household/user/month/category so each
// partner plans their own amount; spend and remaining are derived from
// transaction_splits (not built yet), never stored here.
export const budgets = pgTable("budgets", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  month: date("month").notNull(),
  categoryId: uuid("category_id").notNull().references(() => categories.id),
  plannedAmount: integer("planned_amount").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueBudget: unique().on(table.householdId, table.userId, table.month, table.categoryId),
  plannedAmountNonNegative: check("planned_amount_non_negative", sql`${table.plannedAmount} >= 0`),
}));

// Design doc §8 — a first-class financial object transactions attach to.
// owner_user_id is nullable for a joint account (is_joint = true); an
// individual account (Alex's checking, Jordan's credit card, ...) sets it.
export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id),
  ownerUserId: uuid("owner_user_id").references(() => users.id),
  name: text("name").notNull(),
  type: text("type", { enum: ["checking", "savings", "credit"] }).notNull(),
  balance: integer("balance").notNull().default(0),
  currency: text("currency").notNull().default("USD"),
  isJoint: boolean("is_joint").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
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

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  household: one(households, { fields: [categories.householdId], references: [households.id] }),
  budgets: many(budgets),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  household: one(households, { fields: [budgets.householdId], references: [households.id] }),
  user: one(users, { fields: [budgets.userId], references: [users.id] }),
  category: one(categories, { fields: [budgets.categoryId], references: [categories.id] }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  household: one(households, { fields: [accounts.householdId], references: [households.id] }),
  owner: one(users, { fields: [accounts.ownerUserId], references: [users.id] }),
}));