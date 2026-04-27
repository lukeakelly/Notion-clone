import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ENTITIES } from "@/lib/entities";
import { PHASE_LABELS } from "@/lib/relations";
import { formatDate } from "@/lib/utils";
import type { RecordType } from "@prisma/client";

interface Props {
  record: {
    id: string;
    type: RecordType;
    title: string;
    summary: string | null;
    status: string;
    phase: string | null;
    priority: string | null;
    confidence: string | null;
    updatedAt: Date;
    owner: { name: string | null; email: string } | null;
    tags: { tag: { name: string } }[];
  };
}

export function RecordHeader({ record }: Props) {
  const entity = ENTITIES[record.type];
  const Icon = entity.icon;
  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <Icon className="h-3.5 w-3.5" />
        <Link href={`/${entity.slug}`} className="hover:underline">
          {entity.labelPlural}
        </Link>
        <span>·</span>
        <span>Updated {formatDate(record.updatedAt)}</span>
      </div>
      <h1 className="text-2xl font-semibold">{record.title}</h1>
      {record.summary ? (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{record.summary}</p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Badge>Status: {record.status.replaceAll("_", " ")}</Badge>
        {record.phase ? <Badge>Phase: {PHASE_LABELS[record.phase] ?? record.phase}</Badge> : null}
        {record.priority ? <Badge>{record.priority.toUpperCase()}</Badge> : null}
        {record.confidence ? <Badge>Confidence: {record.confidence}</Badge> : null}
        {record.owner ? (
          <Badge>Owner: {record.owner.name ?? record.owner.email}</Badge>
        ) : null}
        {record.tags.map((t) => (
          <Badge key={t.tag.name}>#{t.tag.name}</Badge>
        ))}
      </div>
    </div>
  );
}
