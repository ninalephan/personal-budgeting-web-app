import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/server/auth";
import { requireHousehold } from "@/lib/server/households/queries";
import { getCategories } from "@/lib/server/categories/queries";
import { ensureCurrentMonthBudget } from "@/lib/server/budgets/mutations";
import { formatCents } from "@/lib/money";
import { BudgetSummary } from "./BudgetSummary";

const GROUP_ORDER = ["bills", "expenses", "debt", "savings"] as const;
const GROUP_LABELS: Record<string, string> = {
  bills: "Bills",
  expenses: "Expenses",
  debt: "Debt",
  savings: "Savings",
};

export default async function BudgetsPage() {
  const user = await requireUser();
  const memberships = await requireHousehold(user.id);
  const householdId = memberships[0].householdId;

  // Carries last month's amounts forward automatically — empty only
  // means they've never set up a budget at all, so send them to do that.
  const budgetRows = await ensureCurrentMonthBudget(householdId, user.id);
  if (budgetRows.length === 0) {
    redirect("/budgets/edit");
  }

  const categories = await getCategories(householdId);
  const amountByCategory = new Map(budgetRows.map((r) => [r.categoryId, r.plannedAmount]));
  const total = budgetRows.reduce((sum, r) => sum + r.plannedAmount, 0);

  const groups = GROUP_ORDER.map((group) => ({
    group,
    label: GROUP_LABELS[group],
    categories: categories
      .filter((c) => c.group === group)
      .map((c) => ({ id: c.id, name: c.name, plannedAmount: amountByCategory.get(c.id) ?? 0 })),
  })).filter((g) => g.categories.length > 0);

  return (
    <div className="page">
      <div className="budget-summary-header">
        <h1>Your monthly budget</h1>
        <Link href="/budgets/edit" className="btn-primary">
          Edit budget
        </Link>
      </div>

      <div className="ribbon">
        <div className="ribbon-cell">
          <div className="ribbon-label">Total planned this month</div>
          <div className="ribbon-value">{formatCents(total)}</div>
        </div>
      </div>

      <BudgetSummary groups={groups} />
    </div>
  );
}
