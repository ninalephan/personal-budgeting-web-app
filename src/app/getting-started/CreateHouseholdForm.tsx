"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createHousehold, type CreateHouseholdState } from "./actions";

const initialState: CreateHouseholdState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-brass" disabled={pending}>
      {pending ? "Creating…" : "Create household"}
    </button>
  );
}

export function CreateHouseholdForm() {
  const [state, formAction] = useActionState(createHousehold, initialState);

  return (
    <form action={formAction} className="household-form">
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
      <label htmlFor="name">Household name</label>
      <input
        id="name"
        name="name"
        type="text"
        placeholder="Alex & Jordan"
        maxLength={100}
        required
      />
      <label htmlFor="inviteEmail">Invite your partner (optional)</label>
      <input
        id="inviteEmail"
        name="inviteEmail"
        type="email"
        placeholder="jordan@example.com"
        maxLength={255}
      />
      {state.error && <p className="form-error">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
