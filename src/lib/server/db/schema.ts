import { pgTable, uuid, text, timestamp, unique, boolean, date, integer, numeric, check } from "drizzle-orm/pg-core";
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

// Design doc §10 — the normalized source of truth for budgeting/ledger
// calculations, whether entered manually or (later, Phase 4) reconciled
// from a bank import. bank_transaction_id is a plain nullable identifier
// for now since the raw bank_transactions table doesn't exist yet.
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id),
  accountId: uuid("account_id").notNull().references(() => accounts.id),
  categoryId: uuid("category_id").notNull().references(() => categories.id),
  description: text("description").notNull(),
  amount: integer("amount").notNull(),
  transactionDate: date("transaction_date").notNull(),
  paidByUserId: uuid("paid_by_user_id").notNull().references(() => users.id),
  source: text("source", { enum: ["manual", "bank"] }).notNull(),
  bankTransactionId: text("bank_transaction_id"),
  isPending: boolean("is_pending").notNull().default(false),
  isIgnored: boolean("is_ignored").notNull().default(false),
  categorizationSource: text("categorization_source", {
    enum: ["user", "merchant_rule", "learned_rule", "provider", "default"],
  })
    .notNull()
    .default("user"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Design doc §21 — amount > 0; negative representation for
  // refunds/income is explicitly out of scope until a future design.
  amountPositive: check("transaction_amount_positive", sql`${table.amount} > 0`),
}));

// Design doc §11 — how a transaction's amount is divided between household
// members. Amounts are authoritative and must sum to the parent
// transaction's amount; that's a cross-row invariant enforced by the
// mutation that writes a transaction's splits together, not a single-row
// CHECK. Percentage is nullable — stored/derived for display only.
export const transactionSplits = pgTable("transaction_splits", {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionId: uuid("transaction_id").notNull().references(() => transactions.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  percentage: numeric("percentage", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueSplitPerUser: unique().on(table.transactionId, table.userId),
  amountNonNegative: check("split_amount_non_negative", sql`${table.amount} >= 0`),
}));

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

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  household: one(households, { fields: [transactions.householdId], references: [households.id] }),
  account: one(accounts, { fields: [transactions.accountId], references: [accounts.id] }),
  category: one(categories, { fields: [transactions.categoryId], references: [categories.id] }),
  paidBy: one(users, { fields: [transactions.paidByUserId], references: [users.id] }),
  splits: many(transactionSplits),
}));

export const transactionSplitsRelations = relations(transactionSplits, ({ one }) => ({
  transaction: one(transactions, { fields: [transactionSplits.transactionId], references: [transactions.id] }),
  user: one(users, { fields: [transactionSplits.userId], references: [users.id] }),
}));