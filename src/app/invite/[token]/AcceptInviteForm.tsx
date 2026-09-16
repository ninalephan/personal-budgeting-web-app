"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { acceptInvite, type AcceptInviteState } from "./actions";

const initialState: AcceptInviteState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-brass" disabled={pending}>
      {pending ? "Joining…" : "Accept invite"}
    </button>
  );
}

export function AcceptInviteForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(acceptInvite, initialState);

  return (
    <form action={formAction} className="accept-invite-form">
      <input type="hidden" name="token" value={token} />
      <label htmlFor="userName">Your name</label>
      <input
        id="userName"
        name="userName"
        type="text"
        placeholder="Alex"
        maxLength={100}
        required
        autoFocus
      />
      {state.error && <p className="form-error">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
