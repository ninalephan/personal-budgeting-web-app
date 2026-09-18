import { requireUser } from "@/lib/server/auth";
import { requireHousehold } from "@/lib/server/households/queries";
import { getCategories } from "@/lib/server/categories/queries";
import { ensureCurrentMonthBudget } from "@/lib/server/budgets/mutations";
import { BudgetForm } from "./BudgetForm";

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

  // Carries last month's amounts forward into this month if it doesn't
  // have its own rows yet — empty only means they've never budgeted.
  const budgetRows = await ensureCurrentMonthBudget(householdId, user.id);
  const isFirstTime = budgetRows.length === 0;
  const amountByCategory = new Map(budgetRows.map((r) => [r.categoryId, r.plannedAmount]));

  const categories = await getCategories(householdId);
  // Every group is shown even when empty so there's always a place to
  // add a first category to it.
  const groups = GROUP_ORDER.map((group) => ({
    group,
    label: GROUP_LABELS[group],
    categories: categories
      .filter((c) => c.group === group)
      .map((c) => ({ id: c.id, name: c.name, plannedAmount: amountByCategory.get(c.id) ?? null })),
  }));

  return (
    <div className="page">
      <h1>{isFirstTime ? "Set up this month's budget" : "Your monthly budget"}</h1>
      <p className="panel-hint">
        {isFirstTime
          ? "Plan how much you want to spend in each category this month. It carries forward automatically after this."
          : "This carries forward every month until you change it — update any amount below."}
      </p>
      <BudgetForm groups={groups} />
    </div>
  );
}
