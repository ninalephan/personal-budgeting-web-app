"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveBudget, type SaveBudgetState } from "./actions";

const initialState: SaveBudgetState = {};

type CategoryGroup = {
  group: string;
  label: string;
  categories: { id: string; name: string; plannedAmount: number | null }[];
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Saving…" : "Save budget"}
    </button>
  );
}

export function BudgetForm({ groups }: { groups: CategoryGroup[] }) {
  const [state, formAction] = useActionState(saveBudget, initialState);
  // How many blank "add a category" rows to render per group — starts at
  // one so there's always a slot, and grows as the user asks for more.
  const [newRowCounts, setNewRowCounts] = useState<Record<string, number>>({});

  return (
    <form action={formAction} className="budget-setup-form">
      {groups.map((g) => {
        const newRows = newRowCounts[g.group] ?? 1;
        return (
          <fieldset className="budget-group" key={g.group}>
            <legend>{g.label}</legend>
            {g.categories.map((c) => (
              <div className="budget-row" key={c.id}>
                <input
                  type="text"
                  name={`category_name_${c.id}`}
                  defaultValue={c.name}
                  maxLength={100}
                  className="budget-category-name-input"
                />
                <div className="budget-amount-input">
                  <span>$</span>
                  <input
                    id={`amount_${c.id}`}
                    name={`amount_${c.id}`}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    inputMode="decimal"
                    defaultValue={c.plannedAmount !== null ? (c.plannedAmount / 100).toFixed(2) : undefined}
                  />
                </div>
              </div>
            ))}

            {Array.from({ length: newRows }).map((_, i) => (
              <div className="budget-row" key={`new-${i}`}>
                <input
                  type="text"
                  name={`new_category_name__${g.group}`}
                  placeholder="Add a category…"
                  maxLength={100}
                  className="budget-new-category-name"
                />
                <div className="budget-amount-input">
                  <span>$</span>
                  <input
                    type="number"
                    name={`new_category_amount__${g.group}`}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    inputMode="decimal"
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              className="btn-secondary budget-add-row"
              onClick={() => setNewRowCounts((prev) => ({ ...prev, [g.group]: newRows + 1 }))}
            >
              + Add another category
            </button>
          </fieldset>
        );
      })}
      {state.error && <p className="form-error">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
