import { redirect } from "next/navigation";
import { requireUser } from "@/lib/server/auth";
import { getPendingInviteForEmail, requireNoHousehold } from "@/lib/server/households/queries";
import { CreateHouseholdForm } from "./CreateHouseholdForm";

export default async function GettingStartedPage() {
  const user = await requireUser();
  await requireNoHousehold(user.id);

  // They were invited to a household rather than starting their own —
  // send them to accept that instead of showing "create a household".
  const pendingInvite = await getPendingInviteForEmail(user.email);
  if (pendingInvite) {
    redirect(`/invite/${pendingInvite.token}`);
  }

  return (
    <main className="getting-started">
      <style>{`
        .getting-started {
          min-height: calc(100vh - 65px);
          display: flex; align-items: center; justify-content: center;
          padding: 40px 24px;
        }
        .gs-panel {
          width: 100%; max-width: 420px;
          border: 1px solid var(--line); border-radius: 10px;
          background: white; padding: 36px 32px;
        }
        .gs-panel h1 {
          font-family: var(--font-fraunces), Georgia, serif;
          font-weight: 500; font-size: 24px; margin: 0 0 10px;
        }
        .gs-panel p {
          color: var(--slate); font-size: 14px; line-height: 1.55; margin: 0 0 26px;
        }
        .household-form { display: flex; flex-direction: column; gap: 8px; }
        .household-form label { font-size: 12.5px; font-weight: 600; color: var(--ink); }
        .household-form input {
          border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px;
          font-size: 14px; font-family: var(--font-inter), sans-serif; margin-bottom: 8px;
        }
        .household-form input:focus { outline: 2px solid var(--brass); outline-offset: 1px; }
        .form-error { color: var(--rust); font-size: 12.5px; margin: -4px 0 6px; }
        .btn-brass {
          background: var(--brass); color: var(--ink); border: none;
          padding: 11px 18px; border-radius: 8px; font-weight: 600; font-size: 14px;
          cursor: pointer; font-family: var(--font-inter), sans-serif;
        }
        .btn-brass:hover { filter: brightness(0.95); }
        .btn-brass:disabled { opacity: 0.6; cursor: default; }
      `}</style>

      <div className="gs-panel">
        <h1>Let&apos;s set up your household.</h1>
        <p>
          This is the shared space you and your partner will use for
          budgets, transactions, and the ledger. You can invite them once
          it&apos;s created.
        </p>
        <CreateHouseholdForm />
      </div>
    </main>
  );
}
