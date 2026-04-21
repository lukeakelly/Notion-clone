import Link from "next/link";
import { notFound } from "next/navigation";
import { entityBySlug } from "@/lib/entities";
import { listRecords } from "@/server/services/records";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EntityListPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { status?: string; phase?: string; q?: string; tag?: string };
}) {
  const entity = entityBySlug(params.slug);
  if (!entity) notFound();

  const records = await listRecords(entity.type, {
    status: searchParams.status,
    phase: searchParams.phase,
    search: searchParams.q,
    tag: searchParams.tag,
  });

  const Icon = entity.icon;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          <h1 className="text-xl font-semibold">{entity.labelPlural}</h1>
          <span className="text-sm text-neutral-500">({records.length})</span>
        </div>
        <Button asChild size="sm">
          <Link href={`/${entity.slug}/new`}>
            <Plus className="h-4 w-4" /> New {entity.label.toLowerCase()}
          </Link>
        </Button>
      </div>
      <p className="text-sm text-neutral-500">{entity.description}</p>

      <form className="flex flex-wrap items-center gap-2" action={`/${entity.slug}`}>
        <input
          name="q"
          defaultValue={searchParams.q ?? ""}
          placeholder="Filter by text…"
          className="h-8 rounded-md border border-neutral-200 bg-white px-3 text-sm dark:border-neutral-800 dark:bg-neutral-950"
        />
        <select
          name="status"
          defaultValue={searchParams.status ?? ""}
          className="h-8 rounded-md border border-neutral-200 bg-white px-2 text-sm dark:border-neutral-800 dark:bg-neutral-950"
        >
          <option value="">Any status</option>
          {entity.statuses.map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <select
          name="phase"
          defaultValue={searchParams.phase ?? ""}
          className="h-8 rounded-md border border-neutral-200 bg-white px-2 text-sm dark:border-neutral-800 dark:bg-neutral-950"
        >
          <option value="">Any phase</option>
          <option value="mvp">MVP</option>
          <option value="v1">v1</option>
          <option value="v1_5">v1.5</option>
          <option value="v2">v2</option>
          <option value="backlog">Backlog</option>
        </select>
        <input
          name="tag"
          defaultValue={searchParams.tag ?? ""}
          placeholder="tag"
          className="h-8 w-24 rounded-md border border-neutral-200 bg-white px-2 text-sm dark:border-neutral-800 dark:bg-neutral-950"
        />
        <Button type="submit" size="sm" variant="outline">
          Apply
        </Button>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Records</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="text-sm text-neutral-500">
              No records yet.{" "}
              <Link className="underline" href={`/${entity.slug}/new`}>
                Create the first {entity.label.toLowerCase()}
              </Link>
              .
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {records.map((r) => (
                <Link
                  key={r.id}
                  href={`/records/${r.id}`}
                  className="flex items-center gap-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900"
                >
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{r.title}</div>
                    {r.summary ? (
                      <div className="truncate text-xs text-neutral-500">{r.summary}</div>
                    ) : null}
                  </div>
                  <Badge>{r.status.replaceAll("_", " ")}</Badge>
                  {r.phase ? <Badge>{r.phase}</Badge> : null}
                  {r.priority ? <Badge>{r.priority.toUpperCase()}</Badge> : null}
                  {r.owner ? <Badge>{r.owner.name ?? r.owner.email}</Badge> : null}
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <span>↔ {r._count.outgoingLinks + r._count.incomingLinks}</span>
                    <span>💬 {r._count.comments}</span>
                    <span>{formatDate(r.updatedAt)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
