"use client";
import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RELATION_LABELS } from "@/lib/relations";
import { ENTITIES } from "@/lib/entities";
import { LinkPickerDialog } from "@/components/link-picker";
import { deleteLinkAction } from "@/server/actions";
import { Plus, Unlink } from "lucide-react";
import { useRouter } from "next/navigation";
import type { LinkRelation, RecordType } from "@prisma/client";

interface LinkView {
  id: string;
  relation: LinkRelation;
  note: string | null;
  to?: { id: string; title: string; type: RecordType; status: string };
  from?: { id: string; title: string; type: RecordType; status: string };
}

export function LinkedRecordsPanel({
  recordId,
  outgoing,
  incoming,
}: {
  recordId: string;
  outgoing: LinkView[];
  incoming: LinkView[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function onDelete(id: string) {
    await deleteLinkAction(id);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Linked records</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="gap-1">
          <Plus className="h-3 w-3" /> Link
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <Section title="Outgoing">
          {outgoing.length === 0 ? (
            <EmptyHint>No outgoing links yet.</EmptyHint>
          ) : (
            outgoing.map((l) => (
              <LinkRow
                key={l.id}
                text={`${RELATION_LABELS[l.relation].forward}`}
                target={l.to!}
                note={l.note}
                onDelete={() => onDelete(l.id)}
              />
            ))
          )}
        </Section>
        <Section title="Incoming">
          {incoming.length === 0 ? (
            <EmptyHint>No incoming links yet.</EmptyHint>
          ) : (
            incoming.map((l) => (
              <LinkRow
                key={l.id}
                text={`${RELATION_LABELS[l.relation].inverse}`}
                target={l.from!}
                note={l.note}
                onDelete={() => onDelete(l.id)}
              />
            ))
          )}
        </Section>
      </CardContent>
      <LinkPickerDialog open={open} onOpenChange={setOpen} fromId={recordId} />
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
        {title}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function LinkRow({
  text,
  target,
  note,
  onDelete,
}: {
  text: string;
  target: { id: string; title: string; type: RecordType; status: string };
  note: string | null;
  onDelete: () => void;
}) {
  const entity = ENTITIES[target.type];
  const Icon = entity.icon;
  return (
    <div className="flex items-center gap-2 rounded-md border border-neutral-200 px-2 py-1.5 text-xs dark:border-neutral-800">
      <span className="font-medium text-neutral-500">{text}</span>
      <Icon className="h-3.5 w-3.5 text-neutral-400" />
      <Link
        href={`/records/${target.id}`}
        className="truncate font-medium hover:underline"
      >
        {target.title}
      </Link>
      <span className="ml-auto text-neutral-400">{target.status}</span>
      <button
        onClick={onDelete}
        className="ml-1 rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
        title="Remove link"
      >
        <Unlink className="h-3 w-3" />
      </button>
      {note ? (
        <div className="basis-full pl-7 pt-1 text-neutral-500">{note}</div>
      ) : null}
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return <div className="text-xs text-neutral-400">{children}</div>;
}
