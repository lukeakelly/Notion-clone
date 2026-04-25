import Link from "next/link";
import { redirect } from "next/navigation";
import { getDashboardStats, getEstimates } from "@/server/actions";
import { formatDate } from "@/lib/utils";
import { STATUS_COLORS, ESTIMATE_TYPES, PROJECT_TYPES, CONFIDENCE_LEVELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  Calculator,
  FileText,
  Clock,
  CheckCircle,
  TrendingUp,
  Plus,
  ArrowRight,
} from "lucide-react";

function formatCurrency(value: number | null, currency: string = "AUD"): string {
  if (value == null) return "-";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function DashboardPage() {
  let stats, estimates;
  try {
    [stats, estimates] = await Promise.all([
      getDashboardStats(),
      getEstimates(),
    ]);
  } catch {
    redirect("/sign-in");
  }

  const recentEstimates = estimates.slice(0, 8);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Overview of your software project estimates
          </p>
        </div>
        <Link
          href="/estimates/new"
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New Estimate
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          icon={<Calculator className="h-5 w-5 text-blue-600" />}
          label="Total Estimates"
          value={stats.total}
        />
        <StatCard
          icon={<FileText className="h-5 w-5 text-amber-600" />}
          label="Drafts"
          value={stats.drafts}
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-indigo-600" />}
          label="In Review"
          value={stats.inReview}
        />
        <StatCard
          icon={<CheckCircle className="h-5 w-5 text-green-600" />}
          label="Approved"
          value={stats.approved}
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-purple-600" />}
          label="Pipeline Value"
          value={formatCurrency(stats.pipelineValue)}
        />
      </div>

      {/* Confidence distribution */}
      {stats.total > 0 && (
        <div className="rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <h3 className="mb-3 text-sm font-medium">Confidence Distribution</h3>
          <div className="flex gap-6">
            {CONFIDENCE_LEVELS.map((level) => {
              const count = stats.confidenceDistribution[level.value as keyof typeof stats.confidenceDistribution] ?? 0;
              return (
                <div key={level.value} className="flex items-center gap-2">
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", level.color)}>
                    {level.label}
                  </span>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent estimates */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Estimates</h2>
          {estimates.length > 0 && (
            <Link
              href="/estimates"
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {recentEstimates.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-12 text-center dark:border-neutral-700 dark:bg-neutral-900">
            <Calculator className="mx-auto h-10 w-10 text-neutral-400" />
            <h3 className="mt-3 text-sm font-medium">No estimates yet</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Create your first estimate to get started.
            </p>
            <Link
              href="/estimates/new"
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              New Estimate
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">Project</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">Client</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">Confidence</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-600">Likely Cost</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">Items</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">Updated</th>
                </tr>
              </thead>
              <tbody>
                {recentEstimates.map((est) => {
                  const estType = ESTIMATE_TYPES.find((t) => t.value === est.estimateType);
                  const projType = PROJECT_TYPES.find((t) => t.value === est.projectType);
                  const confLevel = CONFIDENCE_LEVELS.find((c) => c.value === est.confidenceLevel);
                  return (
                    <tr
                      key={est.id}
                      className="border-b border-neutral-100 last:border-b-0 dark:border-neutral-800"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/estimates/${est.id}`}
                          className="font-medium text-blue-600 hover:text-blue-700"
                        >
                          {est.projectName}
                        </Link>
                        {estType && (
                          <div className="text-xs text-neutral-500">{estType.label}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">{est.clientName}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-neutral-500">
                          {projType?.label ?? est.projectType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            STATUS_COLORS[est.status] ?? "bg-neutral-100 text-neutral-700",
                          )}
                        >
                          {est.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {confLevel ? (
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", confLevel.color)}>
                            {confLevel.label}
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm">
                        {formatCurrency(est.totalLikelyCost, est.currency)}
                      </td>
                      <td className="px-4 py-3 text-neutral-500">
                        {est._count.scopeItems}
                      </td>
                      <td className="px-4 py-3 text-xs text-neutral-500">
                        {formatDate(est.updatedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-xs text-neutral-500">{label}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
      </div>
    </div>
  );
}
