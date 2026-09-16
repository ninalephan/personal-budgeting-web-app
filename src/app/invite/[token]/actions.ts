"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/server/auth";
import {
  acceptHouseholdInvite,
  AlreadyInHouseholdError,
  InviteNotFoundError,
} from "@/lib/server/households/mutations";
import { acceptInviteSchema } from "@/lib/validation/household";

export type AcceptInviteState = {
  error?: string;
};

export async function acceptInvite(
  _prevState: AcceptInviteState,
  formData: FormData
): Promise<AcceptInviteState> {
  const token = formData.get("token");
  if (typeof token !== "string" || !token) {
    throw new Error("Missing invite token.");
  }

  const parsed = acceptInviteSchema.safeParse({
    userName: formData.get("userName"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid name." };
  }

  const user = await requireUser(`/invite/${token}`);

  let household;
  try {
    household = await acceptHouseholdInvite(token, user.id, parsed.data.userName);
  } catch (err) {
    if (err instanceof AlreadyInHouseholdError) {
      redirect("/dashboard");
    }
    if (err instanceof InviteNotFoundError) {
      redirect(`/invite/${token}`);
    }
    throw err;
  }

  redirect(`/dashboard?joined=${encodeURIComponent(household.name)}`);
}
