import { requireUser } from "@/lib/server/auth";
import { requireNoHousehold, getInviteByToken } from "@/lib/server/households/queries";
import { AcceptInviteForm } from "./AcceptInviteForm";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  // redirect a user back to /invite/{token} if user is not logged in
  const user = await requireUser(`/invite/${token}`);
  await requireNoHousehold(user.id);

  const invite = await getInviteByToken(token);
  const isValid = !!invite && invite.status === "pending" && invite.expiresAt > new Date();

  return (
    <main className="invite-page">
      <style>{`
        .invite-page {
          min-height: calc(100vh - 65px);
          display: flex; align-items: center; justify-content: center;
          padding: 40px 24px;
        }
        .invite-card {
          width: 100%; max-width: 420px; text-align: center;
          border: 1px solid var(--line); border-radius: 10px;
          background: white; padding: 36px 32px;
        }
        .invite-card h1 {
          font-family: var(--font-fraunces), Georgia, serif;
          font-weight: 500; font-size: 24px; margin: 0 0 10px;
        }
        .invite-card p {
          color: var(--slate); font-size: 14px; line-height: 1.55; margin: 0 0 26px;
        }
        .btn-brass {
          background: var(--brass); color: var(--ink); border: none;
          padding: 11px 18px; border-radius: 8px; font-weight: 600; font-size: 14px;
          cursor: pointer; font-family: var(--font-inter), sans-serif;
        }
        .btn-brass:hover { filter: brightness(0.95); }
        .btn-brass:disabled { opacity: 0.6; cursor: default; }
        .accept-invite-form { display: flex; flex-direction: column; gap: 8px; text-align: left; }
        .accept-invite-form label { font-size: 12.5px; font-weight: 600; color: var(--ink); }
        .accept-invite-form input {
          border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px;
          font-size: 14px; font-family: var(--font-inter), sans-serif; margin-bottom: 8px;
        }
        .accept-invite-form input:focus { outline: 2px solid var(--brass); outline-offset: 1px; }
        .form-error { color: var(--rust, #B5502D); font-size: 12.5px; margin: -4px 0 6px; }
      `}</style>

      <div className="invite-card">
        {isValid ? (
          <>
            <h1>Join {invite.household.name}</h1>
            <p>
              You&apos;ve been invited to share budgets, transactions, and the
              ledger with this household.
            </p>
            <AcceptInviteForm token={token} />
          </>
        ) : (
          <>
            <h1>This invite isn&apos;t valid</h1>
            <p>
              It may have expired or already been used. Ask whoever invited
              you to send a new link.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
