"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createCommentAction, resolveCommentAction } from "@/server/actions";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface Comment {
  id: string;
  bodyMd: string;
  resolvedAt: Date | null;
  createdAt: Date;
  author: { name: string | null; email: string };
}

export function CommentsPanel({
  recordId,
  comments,
}: {
  recordId: string;
  comments: Comment[];
}) {
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function submit() {
    if (!body.trim()) return;
    setPending(true);
    try {
      await createCommentAction({ recordId, bodyMd: body });
      setBody("");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  async function resolve(id: string) {
    await resolveCommentAction(id);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {comments.length === 0 ? (
          <div className="text-xs text-neutral-400">No comments yet.</div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="rounded-md border border-neutral-200 p-3 text-sm dark:border-neutral-800">
              <div className="mb-1 flex items-center gap-2 text-xs text-neutral-500">
                <span className="font-medium">{c.author.name ?? c.author.email}</span>
                <span>·</span>
                <span>{formatDate(c.createdAt)}</span>
                {c.resolvedAt ? <span className="ml-2 text-emerald-600">resolved</span> : null}
                {!c.resolvedAt ? (
                  <button
                    className="ml-auto text-xs text-neutral-500 hover:underline"
                    onClick={() => resolve(c.id)}
                  >
                    Resolve
                  </button>
                ) : null}
              </div>
              <div className="whitespace-pre-wrap">{c.bodyMd}</div>
            </div>
          ))
        )}
        <div className="space-y-2">
          <Textarea
            rows={3}
            placeholder="Add a comment…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <div className="flex justify-end">
            <Button onClick={submit} disabled={pending || !body.trim()}>
              {pending ? "Posting…" : "Comment"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
