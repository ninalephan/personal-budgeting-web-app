import Link from "next/link";
import { requireUser } from "@/lib/server/auth";
import { requireHousehold } from "@/lib/server/households/queries";
import { ensureCurrentMonthBudget } from "@/lib/server/budgets/mutations";

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ joined?: string }>;
}) {
  const { joined } = await searchParams;
  const user = await requireUser();
  const memberships = await requireHousehold(user.id);
  const householdId = memberships[0].householdId;

  // Carries last month's budget forward automatically, so this is only
  // empty the very first time — after that there's always a budget to
  // show/edit, never a blank slate to "set up" again.
  const budget = await ensureCurrentMonthBudget(householdId, user.id);
  const hasBudget = budget.length > 0;

  return (
    <div className="page">
      {joined && (
        <div className="success-banner">
          You&apos;ve successfully joined {joined} Household!
        </div>
      )}
      <h1>Dashboard</h1>

      {!hasBudget && (
        <div className="panel budget-cta">
          <h2>Let&apos;s set up your monthly budget</h2>
          <p className="panel-hint">
            Plan how much you want to spend across categories this month.
          </p>
          <Link href="/budgets/edit" className="btn-primary">
            Create your monthly budget
          </Link>
        </div>
      )}
    </div>
  );
}
