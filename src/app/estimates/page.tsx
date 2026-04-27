import Link from "next/link";
import { getEstimates } from "@/server/actions";
import { formatDate, cn } from "@/lib/utils";
import { STATUS_COLORS, ESTIMATE_TYPES, PROJECT_TYPES, CONFIDENCE_LEVELS } from "@/lib/constants";
import { Plus, Calculator } from "lucide-react";

function formatCurrency(value: number | null, currency: string = "AUD"): string {
  if (value == null) return "-";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function EstimatesPage() {
  const estimates = await getEstimates();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Estimates</h1>
          <p className="mt-1 text-sm text-neutral-500">
            All your software project estimates
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

      {estimates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-12 text-center">
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
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Project</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Client</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Type</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Confidence</th>
                <th className="px-4 py-3 text-right font-medium text-neutral-600">Low</th>
                <th className="px-4 py-3 text-right font-medium text-neutral-600">Likely</th>
                <th className="px-4 py-3 text-right font-medium text-neutral-600">High</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Items</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Updated</th>
              </tr>
            </thead>
            <tbody>
              {estimates.map((est) => {
                const estType = ESTIMATE_TYPES.find((t) => t.value === est.estimateType);
                const projType = PROJECT_TYPES.find((t) => t.value === est.projectType);
                const confLevel = CONFIDENCE_LEVELS.find((c) => c.value === est.confidenceLevel);
                return (
                  <tr key={est.id} className="border-b border-neutral-100 last:border-b-0">
                    <td className="px-4 py-3">
                      <Link href={`/estimates/${est.id}`} className="font-medium text-blue-600 hover:text-blue-700">
                        {est.projectName}
                      </Link>
                      {estType && <div className="text-xs text-neutral-500">{estType.label}</div>}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{est.clientName}</td>
                    <td className="px-4 py-3 text-xs text-neutral-500">{projType?.label ?? est.projectType}</td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_COLORS[est.status] ?? "bg-neutral-100 text-neutral-700")}>
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
                    <td className="px-4 py-3 text-right font-mono text-sm text-neutral-500">
                      {formatCurrency(est.totalLowCost, est.currency)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm">
                      {formatCurrency(est.totalLikelyCost, est.currency)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-neutral-500">
                      {formatCurrency(est.totalHighCost, est.currency)}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{est._count.scopeItems}</td>
                    <td className="px-4 py-3 text-xs text-neutral-500">{formatDate(est.updatedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
