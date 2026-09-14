# Shared Budget Web Application Design Doc

## 1. Overview

The current budgeting app using Google Sheets is extremely manual and
time consuming. We will migrate to an automated full-stack web
application to track spending and budgets within a household.

The application is more than a simple expense tracker: it is a
**household financial ledger with budgeting on top**. The core domain is
a shared `Household` containing users, accounts, transactions,
categories, budgets, and a derived partner ledger.

The application should support both manually entered transactions and
transactions imported from connected bank accounts. Bank connectivity is
an input into the application's financial model, not a separate source
of truth.

------------------------------------------------------------------------

## 2. Goals of the App

### 2.1 MVP

-   Create monthly budgets split by categories:
    -   Income
    -   Expenses
    -   Savings
    -   Debt
    -   Bills
-   Support partners' budgets and transactions within a single
    household.
-   Track and categorize transactions from different accounts, including
    checking accounts and credit cards.
-   Track spending against budgets.
-   Split transactions between individuals in a household.
-   Keep a running ledger of expenses between partners for
    reconciliation.
-   Provide a dashboard of account balances and cash on hand.
-   Maintain a reliable archive of historical transactions and budgets.
-   Establish the data model needed for bank integration from day one.

### 2.2 Near-MVP / Phase 2

-   Connect bank accounts through Plaid.
-   Import historical and new bank transactions.
-   Synchronize transaction changes and pending-to-posted updates.
-   Import account balances.
-   Automatically categorize imported transactions using deterministic
    rules.
-   Allow users to review and correct imported transaction
    categorization.

### 2.3 Future Goals

-   Bill tracking and payment.
-   Savings and investment tracking.
-   More advanced categorization/learning.
-   Additional financial institutions/providers if needed.

------------------------------------------------------------------------

## 3. Product Requirements

### 3.1 Users

A person can:

-   Create an account.
-   Log in and out.
-   Reset their password.
-   Create or join a household.
-   Add manual transactions.
-   Review bank-imported transactions.
-   Create, update, and view budgets.
-   View reports and dashboards.
-   Edit transactions.
-   Ignore transactions from the relevant budget, ledger, balance, and
    dashboard calculations.

### 3.2 Household

A household is the shared financial space containing:

-   Two partners/users.
-   Accounts.
-   Bank connections.
-   Transactions.
-   Categories.
-   Budgets.
-   Shared financial data.
-   Derived partner ledger information.

The application should enforce a strong household boundary: an
authenticated user may only access household data for households in
which they are a member.

------------------------------------------------------------------------

## 4. Core Domain Model

The main relationship is:

``` text
Household
├── Users
├── Accounts
│   └── optional Bank Account
├── Bank Connections
│   └── Bank Accounts
├── Transactions
│   └── Transaction Splits
├── Categories
├── Budgets
└── Partner Ledger (derived)
```

### 4.1 Key ownership concepts

The application intentionally separates several concepts that might
otherwise be confused:

  -----------------------------------------------------------------------
  Field                               Meaning
  ----------------------------------- -----------------------------------
  `budgets.user_id`                   Whose budget this is

  `accounts.owner_user_id`            Who owns the account

  `transactions.account_id`           Which account the transaction
                                      occurred in

  `transactions.paid_by_user_id`      Who physically paid

  `transaction_splits.user_id`        Whose budget is charged

  `transaction_splits.amount`         How much of the transaction is
                                      charged to that person's budget
  -----------------------------------------------------------------------

This separation is important because the account owner, payer, and
person responsible for a share of the expense are not always the same
person.

For example, a transaction on a joint account could be paid from a
shared account while being split 50/50 between the partners.

------------------------------------------------------------------------

## 5. UI / Product Design

The application should follow the current Figma direction.

### 5.1 Global navigation

Primary navigation:

-   Household
-   Dashboard
-   Transactions
-   Budgets
-   Ledger

The dashboard and other relevant pages should support a view selector:

-   Household
-   Partner A
-   Partner B

The default view should be the logged-in user's view where appropriate,
while still allowing the household-level view.

### 5.2 Dashboard

The dashboard should include:

-   Net Cash Available
-   Household Spending
-   Remaining Budget
-   Household Spending by Category
-   Partner Spending
-   Account Balances
-   Recent Transactions

The account balance section should distinguish individual accounts from
joint accounts.

### 5.3 Transactions

The transactions page should include:

-   Filters:
    -   All
    -   Partner A
    -   Partner B
    -   Category
-   Add Transaction
-   Date
-   Description
-   Category
-   Paid By
-   Split
-   Amount
-   Edit/delete actions
-   Ignored status where applicable
-   Source/status indicators for bank-imported transactions

Example split display:

``` text
Partner A 50% / Partner B 50%
Partner A 100% / Partner B 0%
```

Bank-imported transactions should be reviewable and editable in the same
transaction experience as manual transactions.

### 5.4 Budgets

Budget summary:

-   Total Budget
-   Total Spent
-   Remaining

Budget categories should be grouped under:

-   Bills
-   Expenses
-   Debt
-   Savings
-   Income where applicable

Each budget row should show:

-   Category
-   Planned budget
-   Actual spent
-   Remaining

### 5.5 Ledger

The ledger should show the current derived balance between partners.

Example:

``` text
Jordan owes Alex $1,263.35
```

The page should include:

-   Current balance
-   Number of active transactions contributing to the balance
-   Mark as Settled
-   Transaction date
-   Description
-   Category
-   Paid By
-   Total
-   Partner A Share
-   Partner B Share
-   Balance Effect

The ledger balance should be calculated from transactions and splits
rather than maintained as an independent source of truth.

------------------------------------------------------------------------

## 6. Technology Architecture

The application is a single Next.js project. There is no separately
hosted backend service — server-side logic lives in the same codebase
as Route Handlers and Server Actions, and the browser calls it directly
using shared TypeScript types rather than a separately versioned API
client.

### 6.1 Frontend

-   Next.js (App Router)
-   TypeScript
-   React
-   Server Actions / Route Handlers, called directly using shared
    TypeScript types (no separate client generation step)

Responsibilities:

-   Authentication UI
-   Household UI
-   Dashboard
-   Transaction management
-   Budget management
-   Ledger
-   Account management
-   Plaid Link integration
-   Bank connection status and sync UI

### 6.2 Server-side logic

-   Next.js Route Handlers and Server Actions
-   TypeScript
-   Drizzle ORM
-   drizzle-kit (migrations)
-   Zod (request/response validation)
-   PostgreSQL

Suggested domain organization (within the same Next.js project):

``` text
app/
├── api/
│   ├── households/
│   ├── accounts/
│   ├── transactions/
│   ├── budgets/
│   ├── ledger/
│   ├── dashboard/
│   └── banking/
│       └── plaid/
lib/
├── server/
│   ├── auth/
│   ├── households/
│   ├── users/
│   ├── accounts/
│   ├── transactions/
│   ├── budgets/
│   ├── categories/
│   ├── ledger/
│   ├── dashboard/
│   ├── banking/
│   │   └── plaid/
│   └── db/
└── validation/
tests/
```

### 6.3 Architectural principle

The application domain should not depend directly on Plaid concepts.

Plaid owns the connection to the bank.

The application owns the financial model.

This allows the application to:

-   Support manual accounts and transactions.
-   Change banking providers later.
-   Keep normalized financial data independent of the provider.
-   Preserve raw bank data for troubleshooting and reconciliation.
-   Use the same budget, ledger, and dashboard calculations for manual
    and imported transactions.

------------------------------------------------------------------------

## 7. Database Design

Use PostgreSQL with Drizzle ORM and drizzle-kit for migrations.

Financial amounts should use integer minor units (for example, cents)
stored as a `bigint`/`integer` column, or PostgreSQL `NUMERIC` with a
fixed scale. Do not use JavaScript's native `number` type (floating
point) for financial calculations.

### 7.1 Users

``` text
users
-----
id
email
password_hash / auth_provider_id
name
created_at
updated_at
```

Authentication implementation may use Auth.js, Clerk, Supabase Auth, or
another suitable provider. The domain should remain independent of the
authentication provider.

### 7.2 Households

``` text
households
----------
id
name
created_at
updated_at
```

### 7.3 Household members

``` text
household_members
-----------------
id
household_id
user_id
role
created_at
```

Constraints:

-   Unique `(household_id, user_id)`.
-   MVP household membership is limited to the intended two-partner
    model.

### 7.4 Household invitations

``` text
household_invitations
---------------------
id
household_id
invited_email
invited_by_user_id
token_hash
status
expires_at
created_at
accepted_at
```

Do not store a raw invitation token if it can be avoided; store a secure
hash and send the actual token only through the invitation flow.

------------------------------------------------------------------------

## 8. Accounts

Accounts are first-class financial objects.

Examples:

-   Alex checking
-   Alex credit card
-   Jordan checking
-   Jordan credit card
-   Joint savings

### 8.1 Application accounts

``` text
accounts
--------
id
household_id
owner_user_id nullable
name
type
balance
currency
is_joint
is_active
created_at
updated_at
```

`owner_user_id` identifies the person who owns an individual account. It
may be nullable for a joint account.

`is_joint` explicitly represents shared ownership.

The application-level account is the account used by the rest of the
domain.

### 8.2 Account balance policy

For the MVP, define net cash available explicitly rather than assuming
that every account balance is equivalent to spendable cash.

At minimum:

-   Checking/depository accounts can contribute to cash available.
-   Credit-card balances should not be treated as positive cash.
-   Savings treatment should be configurable or explicitly defined.
-   Joint accounts need a clear household ownership rule.

The initial recommended policy is to calculate cash availability from
eligible account balances belonging to the selected view, with joint
accounts included at the household level and excluded from an individual
view unless the product explicitly assigns them.

This policy should be implemented as a domain calculation, not as UI
logic.

------------------------------------------------------------------------

## 9. Banking Integration

### 9.1 Plaid as the bank connectivity layer

Plaid should be used as the initial bank connectivity provider.

The flow is:

``` text
Next.js (client)
   │
   │ request link token
   ▼
Next.js Route Handler
   │
   │ create Link token with Plaid
   ▼
Plaid
   │
   │ Link UI
   ▼
User selects/authenticates bank
   │
   │ public_token
   ▼
Next.js (client)
   │
   │ send public_token to server
   ▼
Next.js Route Handler
   │
   │ exchange public_token
   ▼
Plaid
   │
   │ access_token + item_id
   ▼
Next.js Route Handler
   │
   ├── fetch accounts
   ├── sync transactions
   └── fetch balances
   ▼
Application database
```

The frontend should never receive or store a long-lived Plaid access
token.

### 9.2 Plaid connection flow

1.  User clicks **Connect Bank**.
2.  The client calls a Next.js Route Handler for a Plaid Link token.
3.  The Route Handler creates the Link token with Plaid.
4.  Next.js opens Plaid Link in the browser.
5.  User selects and authenticates with their financial institution.
6.  Plaid returns a temporary `public_token`.
7.  The client sends the `public_token` to a Next.js Route Handler.
8.  The Route Handler exchanges it with Plaid for an `access_token` and
    `item_id`.
9.  The server stores the provider credentials securely.
10. The server retrieves the connected accounts.
11. Application creates/maps `accounts` and `bank_accounts`.
12. Initial transaction synchronization runs.
13. Imported transactions flow through the normal categorization and
    transaction pipeline.

### 9.3 Bank connections

``` text
bank_connections
----------------
id
household_id
owner_user_id
provider
plaid_item_id
plaid_access_token_encrypted
status
last_synced_at
created_at
updated_at
```

`owner_user_id` identifies the household member who authorized the bank
connection.

Never store the user's bank username/password.

Plaid access tokens should remain server-side and be encrypted at rest.

### 9.4 Bank accounts

Keep Plaid-specific bank account information separate from
application-level accounts.

``` text
bank_accounts
-------------
id
bank_connection_id
account_id
plaid_account_id
name
official_name
type
subtype
mask
current_balance
available_balance
last_balance_update
created_at
updated_at
```

This creates a mapping:

``` text
Plaid Bank Account
        │
        ▼
Application Account
        │
        ▼
Transactions / Budgets / Ledger / Dashboard
```

### 9.5 Raw bank transactions

Preserve provider data separately from normalized application
transactions.

``` text
bank_transactions
-----------------
id
bank_connection_id
plaid_transaction_id
plaid_pending_transaction_id nullable
plaid_account_id
merchant_name
description
amount
transaction_date
is_pending
normalized_transaction_id nullable
raw_data
created_at
updated_at
```

A `bank_transactions` row represents a provider record, not necessarily
a unique real-world purchase. A single logical purchase may have multiple
provider records over its lifecycle, such as a pending authorization and
its later posted transaction.

`plaid_pending_transaction_id` should store the provider relationship when
a posted transaction explicitly identifies the pending transaction it
replaces. `normalized_transaction_id` links the provider record to the
application-level transaction. This lets the application preserve both
the pending and posted raw records for audit/debugging while maintaining
one logical transaction for budgets, the ledger, and the dashboard.

Do not overwrite or delete the original pending raw record when a posted
record arrives. Preserve the provider history and update the normalized
transaction to reference the current posted state.

------------------------------------------------------------------------

## 10. Core Transactions

``` text
transactions
------------
id
household_id
account_id
category_id
description
amount
transaction_date
paid_by_user_id
source
bank_transaction_id nullable
is_pending
is_ignored
categorization_source
created_at
updated_at
```

Suggested `source` values:

``` text
MANUAL
BANK
```

Suggested `categorization_source` values:

``` text
USER
MERCHANT_RULE
LEARNED_RULE
PROVIDER
DEFAULT
```

### 10.1 Transaction source of truth

The normalized `transactions` table is the application's source of truth
for budgeting and ledger calculations.

For a bank transaction:

``` text
Plaid
  ↓
bank_transactions
  ↓
dedupe / match
  ↓
categorization
  ↓
transactions
  ↓
budgets / ledger / dashboard
```

For a manual transaction:

``` text
User
  ↓
transactions
  ↓
budgets / ledger / dashboard
```

### 10.2 Pending and posted transactions

Pending and posted bank records are distinct provider records but may
represent the same application-level transaction. The synchronization
process must reconcile them into one normalized `transactions` row rather
than creating a duplicate.

The application must **not match pending and posted records by amount**.
Credit-card transactions can legitimately change amount between pending
and posted, such as when a restaurant authorization excludes a tip and
the final posted transaction includes it. Merchant name, description,
and transaction date can also change.

The preferred reconciliation order is:

1.  Use the provider's explicit pending-to-posted relationship, such as
    Plaid's `pending_transaction_id`, when available.
2.  If no explicit relationship exists, match only when the provider
    account/connection and transaction identity provide a sufficiently
    strong relationship to an unresolved pending record.
3.  Use heuristic matching only as a fallback, considering account,
    merchant, transaction direction, nearby dates, pending status, and
    reasonable amount differences.
4.  If the application cannot establish a sufficiently reliable match,
    do not auto-merge; create or retain a reviewable transaction instead.

When a pending record becomes posted, the normalized transaction keeps its
application identity and user-owned fields, while provider-owned fields
are updated from the posted record.

**User-owned fields that should survive reconciliation:**

-   Category
-   Payer (`paid_by_user_id`)
-   Transaction splits
-   Ignore status
-   Manual description edits

**Provider-owned fields that should be updated:**

-   Amount
-   Posted/transaction date
-   Pending/posted status
-   Provider transaction identifiers
-   Provider merchant/description fields where the application has not
    overridden them

Example:

``` text
Pending restaurant authorization: $80.00
Posted restaurant transaction:    $96.00

One application transaction:
    amount = $96.00
    status = POSTED

If the transaction is split 50/50:
    Alex   = $48.00
    Jordan = $48.00
```

The user's category, payer, split configuration, and ignore status should
not be lost merely because the provider replaced a pending record with a
posted record. The split amounts must be revalidated or recalculated when
the authoritative transaction amount changes.

Provider lifecycle events should support:

-   New
-   Modified
-   Removed
-   Pending
-   Posted

If a pending authorization disappears without a corresponding posted
transaction, the raw provider record should remain in the archive. The
normalized transaction should be removed from active calculations or
marked as canceled/voided according to the final transaction-state policy,
rather than silently creating a second transaction later.

Provider changes must be reconciled before downstream calculations are
performed.

### 10.3 Ignored transactions

Ignored transactions remain in the archive.

They are excluded from the relevant:

-   Budget calculations
-   Partner ledger calculations
-   Dashboard spending calculations
-   Cash calculations where the product definition requires exclusion

The original record should not be deleted merely because it is ignored.

------------------------------------------------------------------------

## 11. Transaction Splitting

``` text
transaction_splits
------------------
id
transaction_id
user_id
amount
percentage nullable
created_at
updated_at
```

The split amounts must sum exactly to the transaction amount.

Example:

``` text
Transaction: $100

Alex:   $50
Jordan: $50
```

or:

``` text
Transaction: $100

Alex:   $100
Jordan: $0
```

The split model should use explicit amounts as the authoritative value.
Percentages can be stored or calculated for display.

Validation:

``` text
sum(transaction_splits.amount) == transaction.amount
```

All calculations should use integer minor units or exact decimal
arithmetic.

------------------------------------------------------------------------

## 12. Categories

Categories should support the existing budget groups:

``` text
categories
----------
id
household_id nullable
name
group
is_active
created_at
updated_at
```

Suggested category groups:

``` text
INCOME
EXPENSES
SAVINGS
DEBT
BILLS
```

Examples:

``` text
Expenses
├── Groceries
├── Dining Out
├── Transport
├── Healthcare
├── Entertainment
├── Shopping
└── Other
```

Categories may be household-specific so the application can support
customization later.

------------------------------------------------------------------------

## 13. Budgets

A budget belongs to a household and a specific user.

``` text
budgets
-------
id
household_id
user_id
month
category_id
planned_amount
created_at
updated_at
```

Recommended uniqueness:

``` text
UNIQUE (household_id, user_id, month, category_id)
```

This makes it possible for:

-   Alex to have an individual monthly budget.
-   Jordan to have an individual monthly budget.
-   The household to view both.
-   Spending to be attributed based on transaction splits.

### 13.1 Budget calculations

For a user/category/month:

``` text
spent = sum(transaction_split.amount)
        for non-ignored transactions
        matching user + category + month
```

Then:

``` text
remaining = planned_amount - spent
```

The API should return both planned and actual values.

------------------------------------------------------------------------

## 14. Partner Ledger

The partner ledger is derived from transaction payer and split
information.

Do not initially persist a running ledger balance as the source of
truth.

For each qualifying transaction:

``` text
paid_by_user_id
transaction_splits
```

determine who effectively paid more than their share.

For a two-person household:

-   If Alex pays \$100 and Alex's share is \$50 while Jordan's share is
    \$50, Jordan owes Alex \$50.
-   If Jordan pays \$100 and Alex's share is \$75 while Jordan's share
    is \$25, Alex owes Jordan \$75.

The current household ledger is the net sum of these effects.

### 14.1 Settlement records

If settlement history is needed, add a separate table:

``` text
settlements
----------
id
household_id
from_user_id
to_user_id
amount
settled_at
note
created_at
```

Settlements are records of money actually exchanged. They should not
replace transaction-derived ledger calculations.

------------------------------------------------------------------------

## 15. Dashboard Calculations

The dashboard should derive its data from the normalized domain model.

### 15.1 Household spending

``` text
sum(transaction.amount)
```

subject to:

-   Date/month filter
-   Household
-   Non-ignored transactions
-   Relevant transaction categories

### 15.2 Partner spending

Partner spending should be based on each user's transaction splits
rather than simply `paid_by_user_id`.

This means the dashboard can answer:

> How much of the household's spending is attributed to each partner?

without confusing responsibility with who physically paid.

### 15.3 Remaining budget

``` text
remaining = planned budget - attributed spending
```

### 15.4 Account balances

Account balances come from application accounts.

For bank-connected accounts, balances are refreshed from the provider
and stored locally.

### 15.5 Net cash available

Define this as a domain calculation over eligible account balances.

Do not mix:

-   Budget ownership
-   Account ownership
-   Transaction payer
-   Expense responsibility

into a single `user_id` field.

The exact joint-account treatment should remain an explicit product
policy.

------------------------------------------------------------------------

## 16. Automatic Transaction Categorization

Start with deterministic categorization rather than AI.

Suggested priority:

``` text
1. User-defined merchant rule
2. Learned/user preference
3. Merchant mapping
4. Provider category
5. Default / Uncategorized
```

Examples:

``` text
Whole Foods → Groceries
Uber → Transport
Netflix → Entertainment
```

The system should record how a category was chosen using
`categorization_source`.

Users must be able to override the automatic category.

Future versions can learn from user corrections.

------------------------------------------------------------------------

## 17. Bank Synchronization

### 17.1 Initial sync

After connecting an institution:

1.  Retrieve accounts.
2.  Map bank accounts to application accounts.
3.  Retrieve historical transactions.
4.  Store raw bank transactions.
5.  Deduplicate.
6.  Normalize into application transactions.
7.  Categorize.
8.  Calculate downstream budget/ledger/dashboard data.

### 17.2 Ongoing sync

Use Plaid's transaction synchronization model.

The application should:

-   Store a synchronization cursor for each connection.
-   Listen for Plaid transaction update webhooks.
-   Run `/transactions/sync` when updates are available.
-   Apply additions, modifications, and removals.
-   Handle pending-to-posted transitions.
-   Update the local cursor only after the synchronization batch is
    successfully processed.

Suggested additional connection fields:

``` text
bank_connections
----------------
...
transaction_sync_cursor
last_sync_started_at
last_sync_completed_at
last_sync_error
```

### 17.3 Webhooks

Expose:

``` text
POST /webhooks/plaid
```

The webhook should be treated as a signal to synchronize rather than as
the transaction payload itself.

The backend should:

1.  Validate/authenticate the webhook as required by the provider.
2.  Identify the affected bank connection/item.
3.  Queue or trigger synchronization.
4.  Run the incremental sync.
5.  Update local records.
6.  Recalculate affected downstream data.

Synchronization should be idempotent.

------------------------------------------------------------------------

## 18. API Design

### 18.1 Authentication

``` text
POST /auth/register
POST /auth/login
POST /auth/logout
POST /auth/password-reset
```

### 18.2 Household

``` text
POST /households
GET  /households
GET  /households/{id}
POST /households/{id}/invitations
POST /household-invitations/{token}/accept
GET  /households/{id}/members
```

### 18.3 Accounts

``` text
GET    /accounts
GET    /accounts/{id}
POST   /accounts/manual
PATCH  /accounts/{id}
DELETE /accounts/{id}
```

### 18.4 Banking

``` text
POST   /bank-connections/link-token
POST   /bank-connections/exchange
GET    /bank-connections
GET    /bank-connections/{id}
DELETE /bank-connections/{id}
POST   /bank-connections/{id}/sync

POST   /webhooks/plaid
```

### 18.5 Transactions

``` text
GET    /transactions
GET    /transactions/{id}
POST   /transactions
PATCH  /transactions/{id}
DELETE /transactions/{id}
POST   /transactions/{id}/ignore
POST   /transactions/{id}/unignore
```

Filters should support:

-   Month/date range
-   User
-   Category
-   Account
-   Source
-   Pending status
-   Ignored status

### 18.6 Budgets

``` text
GET   /budgets
GET   /budgets/{month}
POST  /budgets
PATCH /budgets/{id}
```

### 18.7 Dashboard

``` text
GET /dashboard
```

The dashboard endpoint can accept a view selector such as:

``` text
?view=household
?view=me
?view=partner
```

Authorization must still be enforced on the backend.

### 18.8 Ledger

``` text
GET  /ledger
GET  /ledger/transactions
POST /ledger/settlements
GET  /ledger/settlements
```

------------------------------------------------------------------------

## 19. Authorization

Every household-scoped API request must verify:

``` text
authenticated user
        ↓
household membership
        ↓
requested resource belongs to household
```

Never trust a household ID or user ID supplied by the frontend.

For partner-specific views, the backend should verify that the selected
user is a member of the same household.

------------------------------------------------------------------------

## 20. Security

### Authentication

Use a mature authentication solution rather than implementing password
storage and session handling from scratch unless there is a strong
reason.

### Bank credentials

Never store:

-   Bank usernames
-   Bank passwords
-   MFA secrets

Plaid/provider access tokens are sensitive credentials and must remain
server-side, encrypted at rest, and inaccessible to the browser.

### Sensitive data

Protect:

-   Access tokens
-   Invitation tokens
-   Personal financial data
-   Account identifiers
-   Raw provider transaction payloads

### Database

Use:

-   Parameterized queries/ORM
-   Strict household authorization
-   Database constraints
-   Encryption for secrets
-   Secure backups
-   Audit logging where appropriate

------------------------------------------------------------------------

## 21. Validation Rules

Important financial invariants:

### Transaction

``` text
amount > 0
```

unless a future design explicitly supports negative transaction
representation for refunds/income.

### Split

``` text
sum(split.amount) == transaction.amount
```

### Budget

``` text
planned_amount >= 0
```

### Household

A user cannot access another household's records.

### Bank mapping

A bank transaction must belong to the bank connection/account that
imported it.

### Deduplication and pending-to-posted reconciliation

A provider transaction identifier should identify one provider record, but
multiple provider records may belong to the same logical application
transaction. Therefore, provider-record uniqueness and normalized
transaction uniqueness are separate concerns.

The application should preserve each provider record while ensuring that a
pending-to-posted lifecycle produces only one active normalized
transaction. Amount equality is not a required condition for a match.

The explicit provider relationship should be authoritative when available.
Heuristic matching must never merge transactions solely because merchant,
date, and amount happen to look similar.

------------------------------------------------------------------------

## 22. Error Handling

Use consistent API error responses.

Examples:

``` text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Validation Error
500 Internal Server Error
```

Banking-specific errors should distinguish:

-   Connection failure
-   Institution unavailable
-   Re-authentication required
-   Sync failure
-   Invalid account mapping
-   Provider transaction changes

The frontend should present actionable messages rather than raw provider
errors.

------------------------------------------------------------------------

## 23. Testing Strategy

Financial calculations should receive especially strong unit and
integration test coverage. Vitest is a good fit for this project —
unit tests for pure calculation functions (splits, budgets, ledger),
and integration tests that exercise Route Handlers against a real
Postgres instance (a fresh container in CI, per §25).

### 23.1 Core financial tests

Test:

-   50/50 transaction split
-   100/0 split
-   Uneven splits
-   Split validation
-   Budget remaining
-   Partner spending
-   Ledger balance
-   Settlements
-   Ignored transactions
-   Month boundaries
-   Refunds/negative amounts if supported
-   Joint accounts
-   Credit card balances

### 23.2 Banking tests

Test:

-   Plaid Link token creation
-   Public token exchange
-   Connection persistence
-   Account import
-   Transaction import
-   Historical sync
-   Incremental sync
-   Deduplication
-   Pending-to-posted matching using an explicit provider relationship
-   Pending-to-posted matching where the posted amount differs from the
    pending amount (for example, restaurant tips)
-   Preservation of user-owned category/payer/splits/ignore state during
    reconciliation
-   Added transactions
-   Modified transactions
-   Removed transactions
-   Webhook handling
-   Sync cursor behavior
-   Failed/retried syncs
-   Categorization rules

### 23.3 Authorization tests

Verify that:

-   A user can access their household.
-   A user cannot access another household.
-   A partner can see shared household data.
-   User-specific budget views are properly scoped.
-   Bank connections cannot be accessed by unauthorized users.

------------------------------------------------------------------------

## 24. Observability

Track:

-   API errors
-   Authentication failures
-   Bank connection failures
-   Sync duration
-   Sync failures
-   Number of transactions imported
-   Number of transaction updates/removals
-   Categorization failures
-   Webhook processing failures
-   Database errors

Never log access tokens or other sensitive credentials.

Useful bank connection fields:

``` text
last_sync_started_at
last_sync_completed_at
last_sync_error
sync_status
```

The UI can expose a human-readable:

``` text
Last synced: 5 minutes ago
```

------------------------------------------------------------------------

## 25. Deployment

Recommended initial architecture:

``` text
Next.js (app + Route Handlers)
   ↓
Vercel

PostgreSQL
   ↓
Managed database (Neon)

Plaid
   ↓
Bank connectivity
```

Background jobs should be available for:

-   Bank synchronization
-   Webhook-triggered sync
-   Retryable provider work
-   Future recurring transactions

On Vercel, these run as scheduled Route Handlers (Vercel Cron) invoked
on an interval, plus a webhook Route Handler for provider-triggered
syncs. If sync volume or duration ever outgrows serverless function
limits, this is the one piece that may warrant pulling out into a
separate long-running worker — everything else in this architecture is
built to make that extraction possible without changing the domain
model.

The application should not depend on the user's browser remaining open
for a bank sync to complete.

------------------------------------------------------------------------

## 26. Suggested Service Boundaries

Server-side logic (`lib/server/`) can be organized around domain
services:

``` text
TransactionService
BudgetService
LedgerService
DashboardService
AccountService

BankConnectionService
BankSyncService
BankTransactionNormalizer
BankTransactionReconciliationService
TransactionDeduplicationService
TransactionCategorizationService
```

### Bank sync pipeline

``` text
Provider
   ↓
BankSyncService
   ↓
Raw Bank Transaction(s)
   ↓
Reconciliation / Deduplication
   │
   ├── pending → posted lifecycle
   └── new / modified / removed
   ↓
Normalization
   ↓
Categorization
   ↓
Core Transaction
   ↓
Budget / Ledger / Dashboard
```

This separation makes the banking layer replaceable without rewriting
the budgeting application.

------------------------------------------------------------------------

## 27. Recommended Repository Structure

A single Next.js project, rather than separate frontend/backend
projects:

``` text
project/
├── app/
│   ├── (marketing)/
│   ├── (app)/
│   │   ├── dashboard/
│   │   ├── transactions/
│   │   ├── budgets/
│   │   ├── ledger/
│   │   └── accounts/
│   └── api/
│       ├── households/
│       ├── accounts/
│       ├── transactions/
│       ├── budgets/
│       ├── ledger/
│       ├── dashboard/
│       ├── banking/
│       │   └── plaid/
│       └── webhooks/
│           └── plaid/
│
├── components/
│
├── lib/
│   ├── server/
│   │   ├── auth/
│   │   ├── households/
│   │   ├── users/
│   │   ├── accounts/
│   │   ├── transactions/
│   │   ├── categories/
│   │   ├── budgets/
│   │   ├── ledger/
│   │   ├── dashboard/
│   │   ├── banking/
│   │   │   └── plaid/
│   │   └── db/
│   ├── validation/
│   └── types/
│
├── drizzle/
│   └── migrations/
│
├── tests/
│
└── docs/
    └── design.md
```

------------------------------------------------------------------------

## 28. MVP Implementation Plan

### Phase 1 --- Foundation

-   Set up Next.js/TypeScript (App Router).
-   Set up PostgreSQL (Neon).
-   Add Drizzle ORM.
-   Add drizzle-kit migrations.
-   Implement authentication.
-   Implement household creation/invitation.
-   Establish household authorization.

### Phase 2 --- Core Financial Model

-   Accounts.
-   Categories.
-   Manual transactions.
-   Transaction splits.
-   Ignored transactions.
-   Monthly budgets.
-   Budget calculations.
-   Ledger calculations.
-   Dashboard calculations.

### Phase 3 --- UI

-   Dashboard.
-   Transactions page.
-   Budgets page.
-   Ledger page.
-   Account management.
-   Household/member management.

### Phase 4 --- Plaid Integration

-   Plaid Link.
-   Link token endpoint.
-   Public token exchange.
-   Secure access-token storage.
-   Account import.
-   Initial transaction import.
-   Raw bank transaction storage.
-   Normalization.
-   Deduplication.
-   Pending/posted handling.
-   Incremental sync.
-   Webhook processing.
-   Balance synchronization.

### Phase 5 --- Categorization

-   User-defined merchant rules.
-   Provider/category fallback.
-   Categorization source tracking.
-   User correction flow.

### Phase 6 --- Hardening

-   Financial calculation test suite.
-   Banking integration tests.
-   Authorization tests.
-   Error handling.
-   Observability.
-   Backups.
-   Production deployment.

------------------------------------------------------------------------

## 29. Key Design Decisions

1.  **The household is the primary authorization and data boundary.**
2.  **Accounts are first-class objects.**
3.  **Budgets are user-scoped.**
4.  **Transactions belong to an account and household.**
5.  **`paid_by_user_id` identifies who physically paid.**
6.  **Transaction splits identify whose budget is charged.**
7.  **The partner ledger is derived from transactions and splits.**
8.  **Ignored transactions remain archived but are excluded from
    applicable calculations.**
9.  **Bank transactions are imported into the same core transaction
    model used by manual transactions.**
10. **Plaid is a connectivity layer, not the application's source of
    truth.**
11. **Raw provider transactions are preserved separately for
    audit/debugging and reconciliation.**
12. **Pending and posted provider records are preserved separately but
    reconciled into one logical application transaction when they represent
    the same purchase.**
13. **Pending-to-posted reconciliation must not depend on amount equality;
    the posted amount is authoritative and may differ from the pending
    amount.**
14. **User-owned transaction fields survive provider lifecycle changes,
    while provider-owned fields are refreshed from the authoritative posted
    record.**
15. **Financial values use exact arithmetic, never floating point.**
16. **Automatic categorization starts deterministic and explainable.**
17. **Bank credentials are never stored by the application.**
18. **The application should be provider-agnostic even though Plaid is
    the first provider.**

------------------------------------------------------------------------

## 30. Open Product Decisions

These should be finalized before or during implementation:

### Joint account treatment

-   Should joint balances count in each partner's individual "Net Cash
    Available"?
-   Should joint-account transactions require manual payer selection?
-   How should joint savings affect household vs individual views?

### Income

-   Are income transactions included in the same transaction table?
-   Should income increase budget availability?
-   How should transfers between accounts be represented?

### Transfers

A future transfer model may be needed so moving money between two
household accounts does not appear as spending.

### Credit cards

Define whether the dashboard shows:

-   Current balance
-   Available credit
-   Amount owed
-   Cash impact

and how credit card payments are represented without double-counting
spending.

### Refunds

Define whether refunds are:

-   Negative transactions
-   Separate transaction types
-   Adjustments to the original transaction

### Recurring transactions

Determine whether recurring transactions belong in the initial MVP or a
later phase.

### Settlement behavior

Determine whether "Mark as Settled" should:

-   Only create a settlement record, or
-   Also create an actual transaction representing the payment.

The recommended model is to record the settlement separately and keep
transaction-derived ledger history intact.

------------------------------------------------------------------------

## 31. Final Architecture Summary

The final system should look like:

``` text
                         ┌──────────────────────────┐
                         │         Next.js          │
                         │  UI + Route Handlers /   │
                         │      Server Actions       │
                         └────────────┬─────────────┘
                                      │
                ┌─────────────────────┼─────────────────────┐
                │                     │                     │
        ┌───────▼───────┐     ┌──────▼──────┐       ┌───────▼───────┐
        │ PostgreSQL    │     │ Scheduled /  │       │    Plaid      │
        │ (Drizzle ORM) │     │ Webhook Sync │       │ Bank Layer    │
        └───────────────┘     └─────────────┘       └───────┬───────┘
                                                              │
                                                        Bank Accounts
                                                        & Transactions

Plaid
  ↓
bank_connections / bank_accounts
  ↓
bank_transactions
  ↓
dedupe + normalize + categorize
  ↓
transactions
  ↓
transaction_splits
  ↓
budgets / ledger / dashboard
```

The central architectural rule is:

> **Plaid owns the connection to the bank. The application owns the
> financial model.**

That lets the product start with manual budgeting and transactions, add
reliable bank synchronization, and continue using one consistent
financial model for budgets, partner reconciliation, account balances,
and dashboards.
