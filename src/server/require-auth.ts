import { redirect } from "next/navigation";
import { auth } from "@/server/auth";

/**
 * Server-side guard for protected page components. Validates the session
 * JWT (not just the cookie's existence) and redirects to /sign-in if the
 * caller is unauthenticated. Always call this before any DB reads in a
 * server component — middleware does fast cookie filtering only.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }
  return session;
}
