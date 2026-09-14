"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/server/auth";
import { requireHousehold } from "@/lib/server/households/queries";
import { createInvite } from "@/lib/server/households/mutations";
import { requestOrigin } from "@/lib/server/request";
import { inviteToHouseholdSchema } from "@/lib/validation/household";

export type InviteState = {
  error?: string;
  token?: string;
  origin?: string;
};

export async function inviteToHousehold(
  _prevState: InviteState,
  formData: FormData
): Promise<InviteState> {
  const user = await requireUser();
  const memberships = await requireHousehold(user.id);
  const householdId = memberships[0].householdId;

  const parsed = inviteToHouseholdSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid email." };
  }

  const invite = await createInvite(householdId, user.id, parsed.data.email);
  revalidatePath("/households");
  return { token: invite.token, origin: await requestOrigin() };
}
