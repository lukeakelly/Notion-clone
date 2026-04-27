import Link from "next/link";
import { prisma } from "@/server/db";
import { requireAuth } from "@/server/require-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ENTITIES } from "@/lib/entities";
import { riskRating } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TechnicalDashboard() {
  await requireAuth();
  const [archDecisions, experiments, blocked, environments, highRisks] = await Promise.all([
    prisma.record.findMany({
      where: {
        type: "decision",
        archivedAt: null,
        data: { path: ["domain"], equals: "architecture" },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    prisma.record.findMany({
      where: { type: "experiment", archivedAt: null, status: { in: ["planned", "running", "analysed"] } },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    prisma.record.findMany({
      where: { type: "feature", archivedAt: null, status: "blocked" },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    prisma.record.findMany({
      where: { type: "environment", archivedAt: null },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.record.findMany({
      where: { type: "risk", archivedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
  ]);

  const criticalRisks = highRisks.filter((r) => {
    const d = r.data as { likelihood?: string; impact?: string };
    const rating = riskRating(d?.likelihood, d?.impact);
    return rating && (rating.level === "high" || rating.level === "critical");
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <h1 className="text-2xl font-semibold">Technical dashboard</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Recent architecture / technical decisions" records={archDecisions} />
        <Panel title="Active technical experiments" records={experiments} />
        <Panel title="Blocked features" records={blocked} />
        <Panel title="Environments" records={environments} />
        <Panel title="High-severity technical risks" records={criticalRisks} />
      </div>
    </div>
  );
}

function Panel({ title, records }: {
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
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
