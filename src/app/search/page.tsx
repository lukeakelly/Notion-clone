import Link from "next/link";
import { search } from "@/server/services/search";
import { ENTITIES } from "@/lib/entities";
import { Badge } from "@/components/ui/badge";
import { requireAuth } from "@/server/require-auth";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  await requireAuth();
  const q = searchParams.q?.trim() ?? "";
  const results = q ? await search(q) : [];

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-xl font-semibold">Search</h1>
      <form action="/search">
        <input
          name="q"
          defaultValue={q}
          autoFocus
          placeholder="Search titles, summaries, notes, tags…"
          className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm dark:border-neutral-800 dark:bg-neutral-950"
        />
      </form>
      {!q ? (
        <p className="text-sm text-neutral-500">Enter a query to search records.</p>
      ) : results.length === 0 ? (
        <p className="text-sm text-neutral-500">No results for &ldquo;{q}&rdquo;.</p>
      ) : (
        <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {results.map((r) => {
            const entity = ENTITIES[r.type];
            const Icon = entity.icon;
            return (
              <Link
                key={r.id}
                href={`/records/${r.id}`}
                className="block py-3 hover:bg-neutral-50 dark:hover:bg-neutral-900"
              >
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <Icon className="h-3 w-3" />
                  <span>{entity.label}</span>
                  <Badge>{r.status}</Badge>
                  {r.phase ? <Badge>{r.phase}</Badge> : null}
                  {r.tags.map((t) => (
                    <Badge key={t.tag.name}>#{t.tag.name}</Badge>
                  ))}
                </div>
                <div className="mt-0.5 font-medium">{r.title}</div>
                {r.summary ? (
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">{r.summary}</div>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
