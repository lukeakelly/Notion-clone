"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PHASE_LABELS, PHASES } from "@/lib/relations";
import { ENTITIES, type EntityMeta } from "@/lib/entities";
import {
  createRecordAction,
  updateRecordAction,
} from "@/server/actions";
import { toast } from "sonner";
import type { Record as RecordModel } from "@prisma/client";

type ExistingWithTags = RecordModel & {
  tags?: { tag: { name: string } }[];
};

interface Props {
  entity: EntityMeta;
  existing?: ExistingWithTags | null;
}

export function RecordForm({ entity, existing }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [summary, setSummary] = useState(existing?.summary ?? "");
  const [bodyMd, setBodyMd] = useState(existing?.bodyMd ?? "");
  const [status, setStatus] = useState(existing?.status ?? entity.defaultStatus);
  const [phase, setPhase] = useState<string | null>(existing?.phase ?? null);
  const [priority, setPriority] = useState<string | null>(existing?.priority ?? null);
  const [confidence, setConfidence] = useState<string | null>(existing?.confidence ?? null);
  const [tags, setTags] = useState<string>(
    existing?.tags?.map((t) => t.tag.name).join(", ") ?? "",
  );
  const dataInit = (existing?.data as Record<string, unknown>) ?? {};
  const [data, setData] = useState<Record<string, string | string[]>>(
    Object.fromEntries(
      (entity.dataFields ?? []).map((f) => {
        const v = dataInit[f.key];
        if (f.kind === "list") return [f.key, Array.isArray(v) ? v.join("\n") : ""];
        return [f.key, v == null ? "" : String(v)];
      }),
    ),
  );
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const dataPayload: Record<string, unknown> = {};
      for (const f of entity.dataFields ?? []) {
        const raw = data[f.key];
        if (typeof raw !== "string") {
          dataPayload[f.key] = raw;
          continue;
        }
        if (f.kind === "list") {
          dataPayload[f.key] = raw
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);
        } else if (f.kind === "number") {
          const n = Number(raw);
          dataPayload[f.key] = Number.isFinite(n) ? n : raw;
        } else {
          dataPayload[f.key] = raw;
        }
      }

      const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      if (existing) {
        const updated = await updateRecordAction({
          id: existing.id,
          title,
          summary,
          bodyMd,
          status,
          phase: (phase ?? null) as never,
          priority: (priority ?? null) as never,
          confidence: (confidence ?? null) as never,
          data: dataPayload,
          tags: tagList,
        });
        toast.success("Saved");
        router.push(`/records/${updated.id}`);
        router.refresh();
      } else {
        const created = await createRecordAction({
          type: entity.type,
          title,
          summary,
          bodyMd,
          status,
          phase: (phase ?? undefined) as never,
          priority: (priority ?? undefined) as never,
          confidence: (confidence ?? undefined) as never,
          data: dataPayload,
          tags: tagList,
        });
        toast.success("Created");
        router.push(`/records/${created.id}`);
        router.refresh();
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5 max-w-3xl">
      <Field label="Title">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
      </Field>
      <Field label="Summary">
        <Textarea
          value={summary ?? ""}
          onChange={(e) => setSummary(e.target.value)}
          rows={2}
        />
      </Field>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Field label="Status">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {entity.statuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replaceAll("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Phase">
          <Select value={phase ?? ""} onValueChange={(v) => setPhase(v || null)}>
            <SelectTrigger>
              <SelectValue placeholder="–" />
            </SelectTrigger>
            <SelectContent>
              {PHASES.map((p) => (
                <SelectItem key={p} value={p}>
                  {PHASE_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Priority">
          <Select value={priority ?? ""} onValueChange={(v) => setPriority(v || null)}>
            <SelectTrigger>
              <SelectValue placeholder="–" />
            </SelectTrigger>
            <SelectContent>
              {["p0", "p1", "p2", "p3"].map((p) => (
                <SelectItem key={p} value={p}>
                  {p.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Confidence">
          <Select
            value={confidence ?? ""}
            onValueChange={(v) => setConfidence(v || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="–" />
            </SelectTrigger>
            <SelectContent>
              {["low", "medium", "high"].map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="Tags (comma-separated)">
        <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="telephony, mvp" />
      </Field>

      {entity.dataFields && entity.dataFields.length > 0 ? (
        <div className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            {ENTITIES[entity.type].label} fields
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {entity.dataFields.map((f) => (
              <Field key={f.key} label={f.label}>
                {f.kind === "textarea" ? (
                  <Textarea
                    rows={3}
                    value={(data[f.key] as string) ?? ""}
                    onChange={(e) =>
                      setData({ ...data, [f.key]: e.target.value })
                    }
                  />
                ) : f.kind === "list" ? (
                  <Textarea
                    rows={4}
                    placeholder="One item per line"
                    value={(data[f.key] as string) ?? ""}
                    onChange={(e) =>
                      setData({ ...data, [f.key]: e.target.value })
                    }
                  />
                ) : f.kind === "enum" ? (
                  <Select
                    value={(data[f.key] as string) ?? ""}
                    onValueChange={(v) => setData({ ...data, [f.key]: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="–" />
                    </SelectTrigger>
                    <SelectContent>
                      {(f.options ?? []).map((o) => (
                        <SelectItem key={o} value={o}>
                          {o.replaceAll("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={(data[f.key] as string) ?? ""}
                    onChange={(e) =>
                      setData({ ...data, [f.key]: e.target.value })
                    }
                  />
                )}
              </Field>
            ))}
          </div>
        </div>
      ) : null}

      <Field label="Body (markdown)">
        <Textarea
          rows={10}
          value={bodyMd ?? ""}
          onChange={(e) => setBodyMd(e.target.value)}
          placeholder="Freeform notes…"
        />
      </Field>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !title.trim()}>
          {loading ? "Saving…" : existing ? "Save" : "Create"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
        {label}
      </span>
      {children}
    </label>
  );
}
