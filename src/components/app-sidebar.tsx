import Link from "next/link";
import { Home, Sparkles, LayoutDashboard, Calculator, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-blue-100 bg-white md:flex">
      <div className="flex h-14 items-center gap-2 border-b border-blue-100 px-4">
        <div className="rounded-lg bg-blue-600 p-1.5 text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold text-slate-950">Simplyai Estimator</span>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 text-sm">
        <SidebarGroup>
          <SidebarLink href="/" icon={<Home className="h-4 w-4" />} label="Estimator home" />
          <SidebarLink href="/" icon={<LayoutDashboard className="h-4 w-4" />} label="Client dashboards" />
          <SidebarLink href="/" icon={<Calculator className="h-4 w-4" />} label="Project estimates" />
          <SidebarLink href="/" icon={<Settings className="h-4 w-4" />} label="Global settings" />
        </SidebarGroup>
        <SidebarGroup title="Database-ready model">
          <SidebarStatic label="Users" />
          <SidebarStatic label="Clients" />
          <SidebarStatic label="Projects" />
          <SidebarStatic label="Processes" />
          <SidebarStatic label="Estimates" />
          <SidebarStatic label="Audit history" />
        </SidebarGroup>
      </nav>
      <div className="border-t border-blue-100 p-3 text-xs text-slate-500">
        <Link
          href="/"
          className="block rounded-md bg-blue-50 px-3 py-2 text-center font-medium text-blue-700 hover:bg-blue-100"
        >
          Future Firebase/Supabase persistence
        </Link>
      </div>
    </aside>
  );
}

function SidebarStatic({ label }: { label: string }) {
  return <div className="rounded-md px-2 py-1.5 text-slate-500">{label}</div>;
}

function SidebarGroup({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      {title ? (
        <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
          {title}
        </div>
      ) : null}
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function SidebarLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon?: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-slate-700 hover:bg-blue-50 hover:text-blue-700",
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
    </Link>
  );
}
