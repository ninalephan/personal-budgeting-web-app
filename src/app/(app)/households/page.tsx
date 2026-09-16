import { requireUser } from "@/lib/server/auth";
import {
  requireHousehold,
  getMembersForHousehold,
  getPendingInvitesForHousehold,
} from "@/lib/server/households/queries";
import { requestOrigin } from "@/lib/server/request";
import { CopyInviteLinkButton } from "@/components/CopyInviteLinkButton";
import { InviteForm } from "./InviteForm";
import { InviteLinkBanner } from "./InviteLinkBanner";

export default async function HouseholdsPage({
  searchParams,
}: {
  searchParams: Promise<{ invited?: string }>;
}) {
  const { invited } = await searchParams;
  const user = await requireUser();
  const memberships = await requireHousehold(user.id);
  const household = memberships[0].household;

  const [members, invites, origin] = await Promise.all([
    getMembersForHousehold(household.id),
    getPendingInvitesForHousehold(household.id),
    requestOrigin(),
  ]);

  return (
    <div className="page">
      <h1>{household.name}</h1>
      {/* If the user was just invited, show a banner with the invite link. */}
      {invited && <InviteLinkBanner token={invited} origin={origin} />}

      <div className="grid-2">
        <div className="panel">
          <h2>Members</h2>
          {members.map((m) => (
            <div className="acct-row" key={m.id}>
              <div className="acct-name">
                <span className="avatar" style={{ background: m.role === "owner" ? "var(--brass)" : "var(--teal)" }}>
                  {(m.user.displayName ?? m.user.email)[0]?.toUpperCase()}
                </span>
                {m.user.displayName ?? m.user.email}
              </div>
              <span className="tag">{m.role === "owner" ? "Owner" : "Member"}</span>
            </div>
          ))}
        </div>

        <div className="panel">
          <h2>Invite a partner</h2>
          <p className="panel-hint">
            This household currently supports two partners. Send an invite by
            email to add someone to shared accounts, budgets, and the ledger.
          </p>
          <InviteForm />

          {invites.length > 0 && (
            <div className="pending-invites">
              <h3>Pending invites</h3>
              {invites.map((invite) => (
                <div className="acct-row" key={invite.id}>
                  <div className="acct-name">
                    {invite.email}
                    <span className="badge pending">Pending</span>
                  </div>
                  <CopyInviteLinkButton token={invite.token} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
