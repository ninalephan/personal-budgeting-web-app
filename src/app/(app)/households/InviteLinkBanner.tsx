import { CopyInviteLinkButton } from "@/components/CopyInviteLinkButton";

export function InviteLinkBanner({ token, origin }: { token: string; origin: string }) {
  return (
    <div className="invite-banner">
      <span>
        Invite sent — share this link: <code>{origin}/invite/{token}</code>
      </span>
      <CopyInviteLinkButton token={token} />
    </div>
  );
}
