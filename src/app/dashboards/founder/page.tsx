import Link from "next/link";
import { prisma } from "@/server/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ENTITIES } from "@/lib/entities";

export const dynamic = "force-dynamic";

export default async function FounderDashboard() {
  const [openDecisions, insights, unvalidated, commercial, gtmTasks, roadmap] = await Promise.all([
    prisma.record.findMany({
      where: { type: "decision", status: { in: ["proposed", "under_review"] }, archivedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    prisma.record.findMany({
      where: {
        type: { in: ["researchItem", "meetingSummary"] },
        archivedAt: null,
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.record.findMany({
      where: { type: "assumption", status: { in: ["unvalidated", "validating"] }, archivedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    prisma.record.findMany({
      where: {
        type: { in: ["pricingModel", "package"] },
        status: { in: ["draft", "under_review"] },
        archivedAt: null,
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.record.findMany({
      where: { type: "task", archivedAt: null, status: { notIn: ["done", "dropped"] } },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    prisma.record.findMany({
      where: { type: "feature", archivedAt: null },
      orderBy: [{ phase: "asc" }, { priority: "asc" }],
      take: 16,
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <h1 className="text-2xl font-semibold">Founder dashboard</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Strategic decisions awaiting resolution" records={openDecisions} />
        <Panel title="Recent insights" records={insights} />
        <Panel title="Unresolved assumptions" records={unvalidated} />
        <Panel title="Commercial model items" records={commercial} />
        <Panel title="Open tasks" records={gtmTasks} />
        <Panel title="Roadmap snapshot" records={roadmap} />
      </div>
    </div>
  );
}

function Panel({
  title,
  records,
}: {
  title: string;
  records: { id: string; title: string; type: keyof typeof ENTITIES; status: string; phase: string | null }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <div className="text-xs text-neutral-400">Nothing here.</div>
        ) : (
          <div className="space-y-1">
            {records.map((r) => {
              const e = ENTITIES[r.type];
              const Icon = e.icon;
              return (
                <Link
                  href={`/records/${r.id}`}
                  key={r.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <Icon className="h-3.5 w-3.5 text-neutral-400" />
                  <span className="truncate">{r.title}</span>
                  <Badge className="ml-auto">{r.status}</Badge>
                  {r.phase ? <Badge>{r.phase}</Badge> : null}
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
