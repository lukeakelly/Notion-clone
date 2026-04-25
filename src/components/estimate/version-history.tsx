"use client";

import { formatDate } from "@/lib/utils";
import { History, Tag } from "lucide-react";

interface EstimateVersion {
  id: string;
  version: number;
  changeNote: string | null;
  createdAt: Date;
  snapshot: unknown;
}

export function VersionHistory({
  versions,
  currentVersion,
}: {
  versions: EstimateVersion[];
  currentVersion: number;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-700">
          Version History (Current: v{currentVersion})
        </h3>
      </div>

      {versions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center">
          <History className="mx-auto h-8 w-8 text-neutral-400" />
          <p className="mt-2 text-sm text-neutral-500">No version history yet.</p>
          <p className="text-xs text-neutral-400">Click &quot;Save Version&quot; to create a snapshot.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {versions.map((v) => {
            const snapshot = v.snapshot as Record<string, unknown> | null;
            const cost = snapshot?.totalLikelyCost as number | undefined;
            const days = snapshot?.totalLikelyDays as number | undefined;

            return (
              <div
                key={v.id}
                className="flex items-center gap-4 rounded-lg border border-neutral-200 bg-white p-4"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <Tag className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Version {v.version}</p>
                  {v.changeNote && (
                    <p className="text-xs text-neutral-500">{v.changeNote}</p>
                  )}
                  <p className="text-xs text-neutral-400">{formatDate(v.createdAt)}</p>
                </div>
                <div className="text-right">
                  {cost != null && (
                    <p className="text-sm font-mono font-medium">
                      {new Intl.NumberFormat("en-AU", {
                        style: "currency",
                        currency: "AUD",
                        maximumFractionDigits: 0,
                      }).format(cost)}
                    </p>
                  )}
                  {days != null && (
                    <p className="text-xs text-neutral-500">{days.toFixed(0)} days</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
