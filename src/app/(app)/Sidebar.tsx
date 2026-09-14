"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, ArrowLeftRight, PiggyBank, Scale } from "lucide-react";

const NAV_ITEMS = [
  { href: "/households", label: "Household", icon: Users },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

// Rounds out the rail to match the design, ahead of those sections
// actually being built.
const COMING_SOON_ITEMS = [
  { label: "Transactions", icon: ArrowLeftRight },
  { label: "Budgets", icon: PiggyBank },
  { label: "Ledger", icon: Scale },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="rail">
      <div className="rail-brand">Balance</div>
      <div className="rail-nav">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} className={`rail-item ${active ? "active" : ""}`}>
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
        {COMING_SOON_ITEMS.map(({ label, icon: Icon }) => (
          <div key={label} className="rail-item disabled">
            <Icon size={16} />
            {label}
            <span className="soon-tag">Soon</span>
          </div>
        ))}
      </div>
    </nav>
  );
}
