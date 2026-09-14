"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/server/auth";
import {
  createHouseholdForUser,
  AlreadyInHouseholdError,
} from "@/lib/server/households/mutations";
import { createHouseholdSchema } from "@/lib/validation/household";

export type CreateHouseholdState = {
  error?: string;
};

export async function createHousehold(
  _prevState: CreateHouseholdState,
  formData: FormData
): Promise<CreateHouseholdState> {
  const user = await requireUser();

  const parsed = createHouseholdSchema.safeParse({
    userName: formData.get("userName"),
    name: formData.get("name"),
    inviteEmail: formData.get("inviteEmail"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid household name." };
  }

  let inviteToken: string | undefined;
  try {
    const result = await createHouseholdForUser(
      user.id,
      parsed.data.name,
      parsed.data.userName,
      parsed.data.inviteEmail || undefined
    );
    inviteToken = result.inviteToken;
  } catch (err) {
    if (err instanceof AlreadyInHouseholdError) {
      // Not actually an error from the user's point of view — they're
      // already set up, just send them where they were headed.
      redirect("/dashboard");
    }
    return { error: "Something went wrong creating your household. Try again." };
  }

  redirect(inviteToken ? `/households?invited=${inviteToken}` : "/dashboard");
}
