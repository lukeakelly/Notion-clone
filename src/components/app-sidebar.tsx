import Link from "next/link";
import { MODULES, ENTITIES } from "@/lib/entities";
import { Home, Search, Rocket, Plus, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 md:flex">
      <div className="flex h-14 items-center gap-2 border-b border-neutral-200 px-4 dark:border-neutral-800">
        <Rocket className="h-5 w-5" />
        <span className="text-sm font-semibold">Product OS</span>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 text-sm">
        <SidebarGroup>
          <SidebarLink href="/" icon={<Home className="h-4 w-4" />} label="Home" />
          <SidebarLink href="/search" icon={<Search className="h-4 w-4" />} label="Search" />
          <SidebarLink
            href="/dashboards/founder"
            icon={<LayoutDashboard className="h-4 w-4" />}
            label="Founder dashboard"
          />
          <SidebarLink
            href="/dashboards/technical"
            icon={<LayoutDashboard className="h-4 w-4" />}
            label="Technical dashboard"
          />
        </SidebarGroup>
        {MODULES.map((mod) => (
          <SidebarGroup key={mod.key} title={mod.label}>
            {mod.entities.map((type) => {
              const e = ENTITIES[type];
              if (!e.mvp) return null;
              const Icon = e.icon;
              return (
                <SidebarLink
                  key={e.slug}
                  href={`/${e.slug}`}
                  icon={<Icon className="h-4 w-4" />}
                  label={e.labelPlural}
                />
              );
            })}
          </SidebarGroup>
        ))}
        <SidebarGroup title="Phases">
          <SidebarLink href="/dashboards/phase/mvp" label="MVP" />
          <SidebarLink href="/dashboards/phase/v1" label="v1" />
          <SidebarLink href="/dashboards/phase/v1_5" label="v1.5" />
          <SidebarLink href="/dashboards/phase/v2" label="v2" />
        </SidebarGroup>
      </nav>
      <div className="border-t border-neutral-200 p-3 dark:border-neutral-800">
        <Link
          href="/new"
          className="flex items-center justify-center gap-2 rounded-md bg-neutral-900 px-3 py-2 text-xs font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          <Plus className="h-4 w-4" /> New record
        </Link>
      </div>
    </aside>
  );
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
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800",
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
    </Link>
  );
}
