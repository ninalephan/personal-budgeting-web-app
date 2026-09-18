"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { formatCents } from "@/lib/money";

const GROUP_COLORS: Record<string, string> = {
  bills: "var(--ink)",
  expenses: "var(--brass)",
  debt: "#B5502D",
  savings: "#2F5233",
};

type CategoryGroup = {
  group: string;
  label: string;
  categories: { id: string; name: string; plannedAmount: number }[];
};

export function BudgetSummary({ groups }: { groups: CategoryGroup[] }) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((g) => [g.group, true]))
  );

  return (
    <div className="budget-summary">
      {groups.map((g) => {
        const isOpen = !!openGroups[g.group];
        const groupTotal = g.categories.reduce((sum, c) => sum + c.plannedAmount, 0);
        return (
          <div className="group-block" key={g.group}>
            <button
              type="button"
              className="group-header"
              onClick={() => setOpenGroups((o) => ({ ...o, [g.group]: !o[g.group] }))}
            >
              {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              <span className="group-dot" style={{ background: GROUP_COLORS[g.group] }} />
              <span className="group-name">{g.label}</span>
              <span className="group-total">{formatCents(groupTotal)}</span>
            </button>
            {isOpen && (
              <div className="group-body">
                {g.categories.map((c) => (
                  <div className="cat-row" key={c.id}>
                    <div className="cat-name">{c.name}</div>
                    <div className="cat-amount">{formatCents(c.plannedAmount)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
