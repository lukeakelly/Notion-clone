import Link from "next/link";
import { prisma } from "@/server/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ENTITIES } from "@/lib/entities";
import { PHASE_LABELS } from "@/lib/relations";
import { formatDate, riskRating } from "@/lib/utils";
import type { RecordType } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [
    topPriorities,
    overdueTasks,
    activeRisks,
    latestDecisions,
    mvpScope,
    activeExperiments,
    nextMilestones,
  ] = await Promise.all([
    prisma.record.findMany({
      where: {
        archivedAt: null,
        priority: { in: ["p0", "p1"] },
        status: { notIn: ["done", "dropped", "archived", "rejected", "superseded"] },
      },
      orderBy: [{ priority: "asc" }, { updatedAt: "desc" }],
      take: 10,
      include: { owner: true },
    }),
    prisma.record.findMany({
      where: {
        type: "task",
        archivedAt: null,
        status: { notIn: ["done", "dropped"] },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    prisma.record.findMany({
      where: { type: "risk", archivedAt: null, status: { in: ["open", "mitigating"] } },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    prisma.record.findMany({
      where: { type: "decision", archivedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.record.findMany({
      where: {
        phase: "mvp",
        type: { in: ["feature", "epic"] },
        archivedAt: null,
      },
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
    prisma.record.findMany({
      where: {
        type: "experiment",
        archivedAt: null,
        status: { in: ["planned", "running", "analysed"] },
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.record.findMany({
      where: { type: "milestone", archivedAt: null, status: { not: "ready" } },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Home</h1>
        <p className="text-sm text-neutral-500">
          What do we know, what have we decided, what are we building next, why.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardList
          title="Top priorities"
          empty="No P0/P1 items — go create some."
          items={topPriorities.map((r) => ({
            id: r.id,
            title: r.title,
            badge: r.priority?.toUpperCase(),
            type: r.type,
            meta: r.owner?.name ?? r.owner?.email ?? undefined,
          }))}
        />
        <DashboardList
          title="Overdue / in-progress tasks"
          items={overdueTasks.map((r) => ({
            id: r.id,
            title: r.title,
            badge: r.status,
            type: r.type,
          }))}
          empty="No open tasks."
        />
        <DashboardList
          title="Active risks"
          items={activeRisks.map((r) => {
            const data = r.data as { likelihood?: string; impact?: string };
            const rating = riskRating(data?.likelihood, data?.impact);
            return {
              id: r.id,
              title: r.title,
              badge: rating ? rating.level : r.status,
              type: r.type,
            };
          })}
          empty="No active risks."
        />
        <DashboardList
          title="Latest decisions"
          items={latestDecisions.map((r) => ({
            id: r.id,
            title: r.title,
            badge: r.status,
            type: r.type,
            meta: formatDate(r.updatedAt),
          }))}
          empty="No decisions yet."
        />
        <DashboardList
          title="MVP scope"
          items={mvpScope.map((r) => ({
            id: r.id,
            title: r.title,
            badge: PHASE_LABELS[r.phase ?? ""] ?? r.phase ?? "",
            type: r.type,
            meta: r.status,
          }))}
          empty="No items tagged to MVP yet."
        />
        <DashboardList
          title="Active experiments"
          items={activeExperiments.map((r) => ({
            id: r.id,
            title: r.title,
            badge: r.status,
            type: r.type,
          }))}
          empty="No active experiments."
        />
        <DashboardList
          title="Next milestones"
          items={nextMilestones.map((r) => ({
            id: r.id,
            title: r.title,
            badge: r.status,
            type: r.type,
            meta: (r.data as { targetDate?: string })?.targetDate ?? undefined,
          }))}
          empty="No milestones."
        />
      </div>
    </div>
  );
}

function DashboardList({
  title,
  items,
  empty,
}: {
  title: string;
  empty: string;
  items: { id: string; title: string; badge?: string | null; type: RecordType; meta?: string }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {items.length === 0 ? (
          <div className="text-xs text-neutral-400">{empty}</div>
        ) : (
          items.map((i) => {
            const entity = ENTITIES[i.type];
            const Icon = entity.icon;
            return (
              <Link
                href={`/records/${i.id}`}
                key={i.id}
                className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <Icon className="h-3.5 w-3.5 text-neutral-400" />
                <span className="truncate">{i.title}</span>
                {i.badge ? <Badge className="ml-auto">{i.badge}</Badge> : null}
                {i.meta ? <span className="text-xs text-neutral-400">{i.meta}</span> : null}
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
