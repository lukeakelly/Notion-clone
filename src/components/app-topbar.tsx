"use client";

import { signOut } from "next-auth/react";
import { LogOut, User } from "lucide-react";

export function AppTopbar({ userEmail }: { userEmail?: string | null }) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-6 dark:border-neutral-800 dark:bg-neutral-950">
      <div />
      <div className="flex items-center gap-3">
        {userEmail && (
          <span className="flex items-center gap-1.5 text-xs text-neutral-500">
            <User className="h-3.5 w-3.5" />
            {userEmail}
          </span>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/sign-in" })}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </header>
  );
}
