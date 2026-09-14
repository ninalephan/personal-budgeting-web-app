"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { inviteToHousehold, type InviteState } from "./actions";
import { InviteLinkBanner } from "./InviteLinkBanner";

const initialState: InviteState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Sending…" : "Invite partner"}
    </button>
  );
}

export function InviteForm() {
  const [state, formAction] = useActionState(inviteToHousehold, initialState);

  return (
    <div>
      <form action={formAction} className="invite-form">
        <input
          name="email"
          type="email"
          placeholder="partner@example.com"
          maxLength={255}
          required
        />
        <SubmitButton />
      </form>
      {state.error && <p className="form-error">{state.error}</p>}
      {state.token && state.origin && <InviteLinkBanner token={state.token} origin={state.origin} />}
    </div>
  );
}
