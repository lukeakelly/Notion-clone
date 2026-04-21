import { notFound } from "next/navigation";
import Link from "next/link";
import { getRecord } from "@/server/services/records";
import { ENTITIES } from "@/lib/entities";
import { RecordHeader } from "@/components/record/record-header";
import { RecordBody } from "@/components/record/record-body";
import { DataFieldsPanel } from "@/components/record/data-fields-panel";
import { LinkedRecordsPanel } from "@/components/record/linked-records";
import { ActivityPanel } from "@/components/record/activity-panel";
import { CommentsPanel } from "@/components/record/comments-panel";
import { AiPanel } from "@/components/record/ai-panel";
import { aiEnabled } from "@/server/services/ai";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RecordPage({ params }: { params: { id: string } }) {
  const record = await getRecord(params.id);
  if (!record) notFound();
  const entity = ENTITIES[record.type];

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <RecordHeader record={record} />
          <Button asChild size="sm" variant="outline">
            <Link href={`/records/${record.id}/edit`}>
              <Pencil className="h-3 w-3" /> Edit
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="links">Links</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="ai">AI</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <DataFieldsPanel entity={entity} data={(record.data ?? {}) as Record<string, unknown>} />
            <RecordBody bodyMd={record.bodyMd} />
          </TabsContent>
          <TabsContent value="links">
            <LinkedRecordsPanel
              recordId={record.id}
              outgoing={record.outgoingLinks.map((l) => ({
                id: l.id,
                relation: l.relation,
                note: l.note,
                to: { id: l.to.id, title: l.to.title, type: l.to.type, status: l.to.status },
              }))}
              incoming={record.incomingLinks.map((l) => ({
                id: l.id,
                relation: l.relation,
                note: l.note,
                from: { id: l.from.id, title: l.from.title, type: l.from.type, status: l.from.status },
              }))}
            />
          </TabsContent>
          <TabsContent value="activity">
            <ActivityPanel activity={record.activity} />
          </TabsContent>
          <TabsContent value="comments">
            <CommentsPanel recordId={record.id} comments={record.comments} />
          </TabsContent>
          <TabsContent value="ai">
            <AiPanel recordId={record.id} outputs={record.aiOutputs} enabled={aiEnabled()} />
          </TabsContent>
        </Tabs>
      </div>

      <aside className="space-y-4">
        <ContextRail record={record} />
      </aside>
    </div>
  );
}

function ContextRail({ record }: { record: Awaited<ReturnType<typeof getRecord>> }) {
  if (!record) return null;
  const why = record.outgoingLinks.filter((l) =>
    ["supports", "addresses", "informed_by", "derived_from", "belongs_to"].includes(l.relation),
  );
  const depends = record.incomingLinks.filter((l) =>
    ["depends_on", "blocks", "affects"].includes(l.relation),
  );
  const evidence = record.incomingLinks.filter((l) =>
    ["validates", "invalidates", "informed_by", "derived_from"].includes(l.relation),
  );

  return (
    <div className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4 text-sm dark:border-neutral-800 dark:bg-neutral-950">
      <RailSection title="Why it exists" emptyText="No supporting links.">
        {why.map((l) => (
          <RailLink key={l.id} id={l.to.id} title={l.to.title} label={l.relation} />
        ))}
      </RailSection>
      <RailSection title="What depends on it" emptyText="Nothing depends on this.">
        {depends.map((l) => (
          <RailLink key={l.id} id={l.from.id} title={l.from.title} label={l.relation} />
        ))}
      </RailSection>
      <RailSection title="Evidence" emptyText="No evidence linked.">
        {evidence.map((l) => (
          <RailLink key={l.id} id={l.from.id} title={l.from.title} label={l.relation} />
        ))}
      </RailSection>
    </div>
  );
}

function RailSection({
  title,
  emptyText,
  children,
}: {
  title: string;
  emptyText: string;
  children: React.ReactNode;
}) {
  const arr = Array.isArray(children) ? children : [children];
  const hasContent = arr.some((c) => c != null && c !== false);
  return (
    <div>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
        {title}
      </div>
      <div className="space-y-1">
        {hasContent ? children : <div className="text-xs text-neutral-400">{emptyText}</div>}
      </div>
    </div>
  );
}

function RailLink({ id, title, label }: { id: string; title: string; label: string }) {
  return (
    <Link
      href={`/records/${id}`}
      className="block rounded-md px-2 py-1 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800"
    >
      <div className="text-[10px] uppercase tracking-wider text-neutral-400">{label}</div>
      <div className="truncate font-medium">{title}</div>
    </Link>
  );
}
