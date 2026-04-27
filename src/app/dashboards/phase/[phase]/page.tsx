import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/server/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ENTITIES } from "@/lib/entities";
import { PHASE_LABELS, PHASES } from "@/lib/relations";
import { requireAuth } from "@/server/require-auth";
import type { Phase } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function PhaseDashboard({
  params,
}: {
  params: { phase: string };
}) {
  await requireAuth();
  if (!PHASES.includes(params.phase as (typeof PHASES)[number])) notFound();
  const phase = params.phase as Phase;

  const [features, assumptions, risks, experiments, decisions] = await Promise.all([
    prisma.record.findMany({
      where: { phase, type: { in: ["feature", "epic"] }, archivedAt: null },
      orderBy: [{ priority: "asc" }, { updatedAt: "desc" }],
    }),
    prisma.record.findMany({
      where: { phase, type: "assumption", archivedAt: null },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.record.findMany({
      where: { phase, type: "risk", archivedAt: null },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.record.findMany({
      where: { phase, type: "experiment", archivedAt: null },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.record.findMany({
      where: { phase, type: "decision", archivedAt: null },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <h1 className="text-2xl font-semibold">Phase: {PHASE_LABELS[phase]}</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Included work" records={features} />
        <Panel title="Assumptions" records={assumptions} />
        <Panel title="Risks" records={risks} />
        <Panel title="Experiments" records={experiments} />
        <Panel title="Decisions" records={decisions} />
      </div>
    </div>
  );
}

function Panel({
  title,
  records,
}: {
  title: string;
  records: { id: string; title: string; type: keyof typeof ENTITIES; status: string; priority: string | null }[];
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
                  {r.priority ? <Badge>{r.priority.toUpperCase()}</Badge> : null}
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
