"use client";
import Link from "next/link";
import { Search } from "lucide-react";

export function AppTopbar({ userEmail }: { userEmail?: string | null }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-blue-100 bg-white/90 px-4 backdrop-blur">
      <Link href="/" className="flex flex-1 items-center gap-2 rounded-md border border-blue-100 bg-blue-50/70 px-3 py-1.5 text-sm text-slate-500 hover:bg-blue-50">
        <Search className="h-4 w-4" />
        <span>Search clients, projects and estimates…</span>
      </Link>
      <Link href="/api/auth/signout" className="text-xs text-slate-500 hover:underline">
        {userEmail ?? "Sign out"}
      </Link>
    </header>
  );
}
