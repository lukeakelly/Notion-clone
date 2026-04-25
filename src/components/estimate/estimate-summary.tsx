"use client";

import { cn } from "@/lib/utils";
import { SCOPE_CATEGORIES, DELIVERY_PHASES, CONFIDENCE_LEVELS } from "@/lib/constants";
import { estimateDuration } from "@/lib/estimation";

type EstimateData = {
  id: string;
  projectName: string;
  clientName: string;
  currency: string;
  totalLowDays: number | null;
  totalLikelyDays: number | null;
  totalHighDays: number | null;
  totalLowCost: number | null;
  totalLikelyCost: number | null;
  totalHighCost: number | null;
  confidenceLevel: string | null;
  scopeItems: Array<{
    id: string;
    name: string;
    category: string;
    priority: string;
    complexity: string;
    lowEffort: number | null;
    likelyEffort: number | null;
    highEffort: number | null;
  }>;
  roleEstimates: Array<{
    id: string;
    role: string;
    days: number;
    rate: number;
    cost: number;
    phase: string | null;
    workstream: string | null;
  }>;
  risks: Array<{ id: string; description: string; impact: string; likelihood: string }>;
  assumptions: Array<{ id: string; description: string }>;
};

export function EstimateSummary({ estimate }: { estimate: EstimateData }) {
  const formatCost = (value: number | null) => {
    if (value == null) return "-";
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: estimate.currency,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const confLevel = CONFIDENCE_LEVELS.find((c) => c.value === estimate.confidenceLevel);
  const activeItems = estimate.scopeItems.filter((i) => i.priority !== "wont");
  const uniqueRoles = Array.from(new Set(estimate.roleEstimates.map((r) => r.role)));
  const teamSize = Math.max(uniqueRoles.length, 1);

  const duration = estimate.totalLikelyDays
    ? estimateDuration(estimate.totalLikelyDays, Math.min(teamSize, 6))
    : null;

  // Category breakdown
  const categoryBreakdown = SCOPE_CATEGORIES.map((cat) => {
    const items = activeItems.filter((i) => i.category === cat.value);
    const totalLikely = items.reduce((s, i) => s + (i.likelyEffort ?? 0), 0);
    return { ...cat, items: items.length, days: totalLikely };
  }).filter((c) => c.items > 0);

  // Role breakdown aggregated
  const roleMap = new Map<string, { days: number; cost: number; rate: number }>();
  for (const re of estimate.roleEstimates) {
    const existing = roleMap.get(re.role);
    if (existing) {
      existing.days += re.days;
      existing.cost += re.cost;
    } else {
      roleMap.set(re.role, { days: re.days, cost: re.cost, rate: re.rate });
    }
  }
  const roleBreakdown = Array.from(roleMap.entries())
    .map(([role, data]) => ({ role, ...data }))
    .sort((a, b) => b.cost - a.cost);

  if (!estimate.totalLikelyCost) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center">
        <p className="text-sm text-neutral-500">
          Click &quot;Recalculate&quot; to generate the estimate summary.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold">Executive Summary</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="py-2 text-left font-medium text-neutral-500">Metric</th>
                  <th className="py-2 text-right font-medium text-neutral-500">Low</th>
                  <th className="py-2 text-right font-medium text-blue-600">Likely</th>
                  <th className="py-2 text-right font-medium text-neutral-500">High</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-neutral-100">
                  <td className="py-2 text-neutral-700">Effort (days)</td>
                  <td className="py-2 text-right font-mono">{estimate.totalLowDays?.toFixed(0)}</td>
                  <td className="py-2 text-right font-mono font-semibold text-blue-600">{estimate.totalLikelyDays?.toFixed(0)}</td>
                  <td className="py-2 text-right font-mono">{estimate.totalHighDays?.toFixed(0)}</td>
                </tr>
                <tr className="border-b border-neutral-100">
                  <td className="py-2 text-neutral-700">Cost</td>
                  <td className="py-2 text-right font-mono">{formatCost(estimate.totalLowCost)}</td>
                  <td className="py-2 text-right font-mono font-semibold text-blue-600">{formatCost(estimate.totalLikelyCost)}</td>
                  <td className="py-2 text-right font-mono">{formatCost(estimate.totalHighCost)}</td>
                </tr>
                {duration && (
                  <tr>
                    <td className="py-2 text-neutral-700">Duration</td>
                    <td className="py-2 text-right font-mono">{duration.lowWeeks} weeks</td>
                    <td className="py-2 text-right font-mono font-semibold text-blue-600">{duration.weeks} weeks</td>
                    <td className="py-2 text-right font-mono">{duration.highWeeks} weeks</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-xs text-neutral-500">Confidence</span>
              {confLevel && (
                <div className={cn("mt-1 inline-block rounded-full px-3 py-1 text-sm font-medium", confLevel.color)}>
                  {confLevel.label}
                </div>
              )}
            </div>
            <div>
              <span className="text-xs text-neutral-500">Team Size</span>
              <p className="text-sm font-medium">{uniqueRoles.length} roles</p>
            </div>
            <div>
              <span className="text-xs text-neutral-500">Scope Items</span>
              <p className="text-sm font-medium">{activeItems.length} active items</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h3 className="mb-4 text-sm font-semibold">Effort by Category</h3>
        <div className="space-y-2">
          {categoryBreakdown.map((cat) => {
            const maxDays = Math.max(...categoryBreakdown.map((c) => c.days));
            const pct = maxDays > 0 ? (cat.days / maxDays) * 100 : 0;
            return (
              <div key={cat.value} className="flex items-center gap-3">
                <span className="w-28 text-xs text-neutral-600">{cat.label}</span>
                <div className="flex-1">
                  <div className="h-5 w-full rounded-full bg-neutral-100">
                    <div
                      className="h-5 rounded-full bg-blue-500 flex items-center justify-end pr-2"
                      style={{ width: `${Math.max(pct, 8)}%` }}
                    >
                      <span className="text-xs font-medium text-white">{cat.days.toFixed(0)}d</span>
                    </div>
                  </div>
                </div>
                <span className="w-12 text-right text-xs text-neutral-500">{cat.items} items</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Role Breakdown */}
      {roleBreakdown.length > 0 && (
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold">Detailed Role Breakdown</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="py-2 text-left font-medium text-neutral-500">Role</th>
                <th className="py-2 text-right font-medium text-neutral-500">Days</th>
                <th className="py-2 text-right font-medium text-neutral-500">Day Rate</th>
                <th className="py-2 text-right font-medium text-neutral-500">Cost</th>
              </tr>
            </thead>
            <tbody>
              {roleBreakdown.map((r, i) => (
                <tr key={i} className="border-b border-neutral-100 last:border-b-0">
                  <td className="py-2 text-neutral-700">{r.role}</td>
                  <td className="py-2 text-right font-mono">{r.days.toFixed(1)}</td>
                  <td className="py-2 text-right font-mono text-neutral-500">{formatCost(r.rate)}</td>
                  <td className="py-2 text-right font-mono font-medium">{formatCost(r.cost)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-neutral-300 font-semibold">
                <td className="py-2">Total</td>
                <td className="py-2 text-right font-mono">{roleBreakdown.reduce((s, r) => s + r.days, 0).toFixed(1)}</td>
                <td className="py-2"></td>
                <td className="py-2 text-right font-mono text-blue-600">{formatCost(roleBreakdown.reduce((s, r) => s + r.cost, 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Delivery Roadmap */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h3 className="mb-4 text-sm font-semibold">Delivery Roadmap</h3>
        <div className="space-y-3">
          {DELIVERY_PHASES.map((phase) => (
            <div key={phase.value} className="flex items-center gap-4 rounded-md border border-neutral-100 p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                {phase.label.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{phase.label}</p>
                <p className="text-xs text-neutral-500">{phase.description}</p>
              </div>
              <span className="text-xs text-neutral-400">{phase.durationRange}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Key Risks & Assumptions */}
      <div className="grid grid-cols-2 gap-4">
        {estimate.risks.length > 0 && (
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <h3 className="mb-3 text-sm font-semibold">Key Risks</h3>
            <ul className="space-y-2">
              {estimate.risks.slice(0, 5).map((r) => (
                <li key={r.id} className="flex items-start gap-2 text-sm">
                  <span className={cn(
                    "mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full",
                    r.impact === "high" ? "bg-red-500" : r.impact === "medium" ? "bg-amber-500" : "bg-green-500",
                  )} />
                  {r.description}
                </li>
              ))}
            </ul>
          </div>
        )}
        {estimate.assumptions.length > 0 && (
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <h3 className="mb-3 text-sm font-semibold">Key Assumptions</h3>
            <ul className="space-y-2">
              {estimate.assumptions.slice(0, 5).map((a) => (
                <li key={a.id} className="text-sm text-neutral-700">&bull; {a.description}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
