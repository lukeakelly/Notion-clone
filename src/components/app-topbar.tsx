"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { QuickCaptureDialog } from "@/components/quick-capture";
import { Plus, Search } from "lucide-react";

export function AppTopbar({ userEmail }: { userEmail?: string | null }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-neutral-200 bg-white/90 px-4 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
      <Link href="/search" className="flex flex-1 items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-500 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800">
        <Search className="h-4 w-4" />
        <span>Search records, decisions, evidence…</span>
      </Link>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" /> Quick capture
        <kbd className="ml-1 hidden rounded border border-neutral-200 bg-neutral-50 px-1 text-[10px] text-neutral-500 md:inline">c</kbd>
      </Button>
      <Link href="/api/auth/signout" className="text-xs text-neutral-500 hover:underline">
        {userEmail ?? "Sign out"}
      </Link>
      <QuickCaptureDialog open={open} onOpenChange={setOpen} />
    </header>
  );
}
