"use client";
import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RELATIONS } from "@/lib/relations";
import type { LinkRelation, RecordType } from "@prisma/client";
import { createLinkAction, findRecordsForPicker } from "@/server/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ENTITIES } from "@/lib/entities";

const TYPE_OPTIONS = Object.values(ENTITIES)
  .slice()
  .sort((a, b) => a.label.localeCompare(b.label));

interface PickerRecord {
  id: string;
  title: string;
  type: RecordType;
  status: string;
}

export function LinkPickerDialog({
  open,
  onOpenChange,
  fromId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  fromId: string;
}) {
  const [q, setQ] = useState("");
  const [relation, setRelation] = useState<LinkRelation>("linked_to");
  const [typeFilter, setTypeFilter] = useState<RecordType | "">("");
  const [results, setResults] = useState<PickerRecord[]>([]);
  const [selected, setSelected] = useState<PickerRecord | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function runSearch(text: string, nextType: RecordType | "" = typeFilter) {
    setQ(text);
    startTransition(async () => {
      const rs = await findRecordsForPicker(text, fromId, nextType || undefined);
      setResults(rs as PickerRecord[]);
    });
  }

  async function submit() {
    if (!selected) return;
    try {
      await createLinkAction({
        fromId,
        toId: selected.id,
        relation,
      });
      toast.success("Link created");
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link record</DialogTitle>
          <DialogDescription>
            Create a typed link between this record and another.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Relation</Label>
            <Select value={relation} onValueChange={(v) => setRelation(v as LinkRelation)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RELATIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Target record</Label>
            <div className="flex gap-2">
              <Input
                autoFocus
                placeholder="Search by title, summary, or type…"
                value={q}
                onChange={(e) => runSearch(e.target.value)}
                onFocus={() => runSearch(q)}
                className="flex-1"
              />
              <Select
                value={typeFilter || "__all"}
                onValueChange={(v) => {
                  const next = v === "__all" ? "" : (v as RecordType);
                  setTypeFilter(next);
                  runSearch(q, next);
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Any type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">Any type</SelectItem>
                  {TYPE_OPTIONS.map((e) => (
                    <SelectItem key={e.type} value={e.type}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="mt-2 max-h-64 overflow-y-auto rounded-md border border-neutral-200 dark:border-neutral-800">
              {results.length === 0 && !isPending ? (
                <div className="p-3 text-xs text-neutral-500">No matches.</div>
              ) : null}
              {results.map((r) => {
                const entity = ENTITIES[r.type];
                const isSelected = selected?.id === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                      isSelected ? "bg-neutral-100 dark:bg-neutral-800" : ""
                    }`}
                  >
                    <span className="text-[10px] uppercase text-neutral-400">
                      {entity.label}
                    </span>
                    <span className="truncate">{r.title}</span>
                    <span className="ml-auto text-[10px] text-neutral-400">{r.status}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!selected} onClick={submit}>
            Create link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
