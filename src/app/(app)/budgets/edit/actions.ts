"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/server/auth";
import { requireHousehold } from "@/lib/server/households/queries";
import { getCategories } from "@/lib/server/categories/queries";
import { createCategory, renameCategory, type CategoryGroupValue } from "@/lib/server/categories/mutations";
import { saveMonthlyBudget } from "@/lib/server/budgets/mutations";
import { budgetAmountSchema, categoryNameSchema } from "@/lib/validation/budget";

// Must match the groups the budget form actually renders (BudgetsPage's
// GROUP_ORDER) — new-category fields are named by group, not by id, since
// the category doesn't exist yet when the form is built.
const GROUPS: CategoryGroupValue[] = ["bills", "expenses", "debt", "savings"];

export type SaveBudgetState = {
  error?: string;
};

export async function saveBudget(
  _prevState: SaveBudgetState,
  formData: FormData
): Promise<SaveBudgetState> {
  const user = await requireUser();
  const memberships = await requireHousehold(user.id);
  const householdId = memberships[0].householdId;

  const categories = await getCategories(householdId);
  const entries: { categoryId: string; plannedAmount: number }[] = [];

  for (const category of categories) {
    const rawName = formData.get(`category_name_${category.id}`);
    if (typeof rawName === "string") {
      const parsedName = categoryNameSchema.safeParse(rawName);
      if (!parsedName.success) {
        return { error: parsedName.error.issues[0]?.message ?? "Invalid category name." };
      }
      if (parsedName.data !== category.name) {
        await renameCategory(householdId, category.id, parsedName.data);
      }
    }

    const parsedAmount = budgetAmountSchema.safeParse(formData.get(`amount_${category.id}`) || 0);
    if (!parsedAmount.success) {
      return { error: `${category.name}: ${parsedAmount.error.issues[0]?.message ?? "Invalid amount."}` };
    }
    entries.push({ categoryId: category.id, plannedAmount: Math.round(parsedAmount.data * 100) });
  }

  for (const group of GROUPS) {
    const names = formData.getAll(`new_category_name__${group}`);
    const amounts = formData.getAll(`new_category_amount__${group}`);

    for (let i = 0; i < names.length; i++) {
      const rawName = names[i];
      if (typeof rawName !== "string" || rawName.trim() === "") {
        continue;
      }

      const parsedName = categoryNameSchema.safeParse(rawName);
      if (!parsedName.success) {
        return { error: parsedName.error.issues[0]?.message ?? "Invalid category name." };
      }

      const parsedAmount = budgetAmountSchema.safeParse(amounts[i] || 0);
      if (!parsedAmount.success) {
        return {
          error: `${parsedName.data}: ${parsedAmount.error.issues[0]?.message ?? "Invalid amount."}`,
        };
      }

      const category = await createCategory(householdId, parsedName.data, group);
      entries.push({ categoryId: category.id, plannedAmount: Math.round(parsedAmount.data * 100) });
    }
  }

  await saveMonthlyBudget(householdId, user.id, entries);

  redirect("/budgets");
}
