"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { summariseRecordAction } from "@/server/actions";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

interface AiOutput {
  id: string;
  action: string;
  content: string;
  model: string;
  createdAt: Date;
}

export function AiPanel({
  recordId,
  outputs,
  enabled,
}: {
  recordId: string;
  outputs: AiOutput[];
  enabled: boolean;
}) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function summarise() {
    setPending(true);
    try {
      await summariseRecordAction(recordId);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>AI</CardTitle>
        <Button size="sm" variant="outline" disabled={!enabled || pending} onClick={summarise} className="gap-1">
          <Sparkles className="h-3 w-3" />
          {pending ? "Summarising…" : "Summarise"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {!enabled ? (
          <p className="text-xs text-neutral-500">
            AI actions are disabled. Set <code>OPENAI_API_KEY</code> to enable.
          </p>
        ) : null}
        {outputs.length === 0 ? (
          <p className="text-xs text-neutral-400">No AI output yet.</p>
        ) : (
          outputs.map((o) => (
            <div key={o.id} className="rounded-md border border-amber-200 bg-amber-50/40 p-3 text-sm dark:border-amber-900/50 dark:bg-amber-900/10">
              <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-300">
                <Sparkles className="h-3 w-3" />
                <span>{o.action}</span>
                <span>·</span>
                <span>{o.model}</span>
                <span>·</span>
                <span>{formatDate(o.createdAt)}</span>
              </div>
              <div className="whitespace-pre-wrap text-sm">{o.content}</div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
