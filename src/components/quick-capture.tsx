"use client";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ALL_ENTITIES } from "@/lib/entities";
import { quickCaptureAction } from "@/server/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { RecordType } from "@prisma/client";

const QUICK_TYPES: RecordType[] = [
  "idea",
  "problem",
  "feature",
  "decision",
  "assumption",
  "risk",
  "experiment",
  "task",
  "researchItem",
  "meetingSummary",
];

export function QuickCaptureDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [type, setType] = useState<RecordType>("idea");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "c" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
        )
          return;
        e.preventDefault();
        onOpenChange(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpenChange]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const record = await quickCaptureAction({
        title: title.trim(),
        summary: summary.trim() || undefined,
        type,
      });
      onOpenChange(false);
      setTitle("");
      setSummary("");
      setType("idea");
      toast.success(`Captured as ${type}`);
      router.push(`/records/${record.id}`);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quick capture</DialogTitle>
          <DialogDescription>
            Capture an idea, problem, feature or decision in one line.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label>Title</Label>
            <Input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Test Twilio vs. Plivo for inbound latency"
            />
          </div>
          <div className="space-y-1">
            <Label>Summary (optional)</Label>
            <Textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="One-line context"
            />
          </div>
          <div className="space-y-1">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as RecordType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUICK_TYPES.map((t) => {
                  const e = ALL_ENTITIES.find((x) => x.type === t);
                  return (
                    <SelectItem key={t} value={t}>
                      {e?.label ?? t}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? "Saving…" : "Capture"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
