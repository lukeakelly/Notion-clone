import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

interface ActivityItem {
  id: string;
  verb: string;
  field?: string | null;
  before?: unknown;
  after?: unknown;
  createdAt: Date;
  actor: { name: string | null; email: string };
}

export function ActivityPanel({ activity }: { activity: ActivityItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {activity.length === 0 ? (
          <div className="text-xs text-neutral-400">No activity yet.</div>
        ) : (
          activity.map((a) => (
            <div key={a.id} className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
              <span className="font-medium">{a.actor.name ?? a.actor.email}</span>
              <span>{describe(a)}</span>
              <span className="ml-auto">{formatDate(a.createdAt)}</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function describe(a: ActivityItem): string {
  switch (a.verb) {
    case "created":
      return "created this record";
    case "updated":
      return a.field ? `updated ${a.field}` : "updated this record";
    case "status_changed":
      return `changed status`;
    case "linked":
      return "created a link";
    case "unlinked":
      return "removed a link";
    case "commented":
      return "added a comment";
    default:
      return a.verb;
  }
}
