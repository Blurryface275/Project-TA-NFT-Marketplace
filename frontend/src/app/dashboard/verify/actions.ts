"use server";

import { getSession } from "@/lib/session";

export async function verifyTicketAction() {
  const session = await getSession();
  if (!session?.userId) {
    return { success: false, message: "Unauthorized" };
  }
  return { success: true };
}
