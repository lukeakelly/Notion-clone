"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Settings2,
  List,
  BarChart3,
  AlertTriangle,
  FileCheck,
  Download,
  History,
  ClipboardList,
  RefreshCw,
} from "lucide-react";
import {
  recalculateEstimate,
  saveVersion,
  updateEstimateStatus,
  deleteEstimate,
  duplicateEstimate,
} from "@/server/actions";
import { STATUS_COLORS, ESTIMATE_STATUSES, CONFIDENCE_LEVELS } from "@/lib/constants";
import { ScopeBuilder } from "./scope-builder";
import { EstimateSummary } from "./estimate-summary";
import { RisksPanel } from "./risks-panel";
import { AssumptionsPanel } from "./assumptions-panel";
import { OverheadSettings } from "./overhead-settings";
import { QuestionnairePanel } from "./questionnaire-panel";
import { VersionHistory } from "./version-history";
import { ExportPanel } from "./export-panel";

type EstimateData = NonNullable<Awaited<ReturnType<typeof import("@/server/actions").getEstimate>>>;
type RateCardData = Awaited<ReturnType<typeof import("@/server/actions").getRateCards>>;

const TABS = [
  { id: "scope", label: "Scope", icon: List },
  { id: "questionnaire", label: "Questionnaire", icon: ClipboardList },
  { id: "summary", label: "Summary", icon: BarChart3 },
  { id: "risks", label: "Risks", icon: AlertTriangle },
  { id: "assumptions", label: "Assumptions", icon: FileCheck },
  { id: "settings", label: "Settings", icon: Settings2 },
  { id: "export", label: "Export", icon: Download },
  { id: "history", label: "History", icon: History },
] as const;

export function EstimateWorkspace({
  estimate: initialEstimate,
  rateCards,
}: {
  estimate: EstimateData;
  rateCards: RateCardData;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("scope");
  const [recalculating, setRecalculating] = useState(false);
  const estimate = initialEstimate;

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await recalculateEstimate(estimate.id);
      toast.success("Estimate recalculated");
      router.refresh();
    } catch {
      toast.error("Failed to recalculate");
    } finally {
      setRecalculating(false);
    }
  };

  const handleSaveVersion = async () => {
    try {
      const newVersion = await saveVersion(estimate.id, `Version ${estimate.version} snapshot`);
      toast.success(`Version ${newVersion} saved`);
      router.refresh();
    } catch {
      toast.error("Failed to save version");
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await updateEstimateStatus(estimate.id, status);
      toast.success("Status updated");
      router.refresh();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this estimate?")) return;
    try {
      await deleteEstimate(estimate.id);
      toast.success("Estimate deleted");
      router.push("/");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleDuplicate = async () => {
    try {
      const newEstimate = await duplicateEstimate(estimate.id);
      toast.success("Estimate duplicated");
      router.push(`/estimates/${newEstimate.id}`);
    } catch {
      toast.error("Failed to duplicate");
    }
  };

  const confLevel = CONFIDENCE_LEVELS.find((c) => c.value === estimate.confidenceLevel);

  const formatCost = (value: number | null) => {
    if (value == null) return "-";
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: estimate.currency,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/estimates" className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{estimate.projectName}</h1>
              <span className="text-sm text-neutral-500">v{estimate.version}</span>
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_COLORS[estimate.status] ?? "bg-neutral-100 text-neutral-700")}>
                {estimate.status.replace(/_/g, " ")}
              </span>
              {confLevel && (
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", confLevel.color)}>
                  {confLevel.label} confidence
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-500">{estimate.clientName} &middot; {estimate.currency}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={estimate.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="rounded-md border border-neutral-200 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
          >
            {ESTIMATE_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", recalculating && "animate-spin")} />
            Recalculate
          </button>
          <button onClick={handleSaveVersion} className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50">
            Save Version
          </button>
          <button onClick={handleDuplicate} className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50">
            Duplicate
          </button>
          <button onClick={handleDelete} className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
            Delete
          </button>
        </div>
      </div>

      {/* Cost summary bar */}
      {estimate.totalLikelyCost != null && (
        <div className="grid grid-cols-3 gap-4 rounded-lg border border-neutral-200 bg-white p-4">
          <div className="text-center">
            <p className="text-xs text-neutral-500">Low Estimate</p>
            <p className="text-lg font-semibold text-neutral-600">{formatCost(estimate.totalLowCost)}</p>
            <p className="text-xs text-neutral-400">{estimate.totalLowDays?.toFixed(0)} days</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-neutral-500">Likely Estimate</p>
            <p className="text-2xl font-bold text-blue-600">{formatCost(estimate.totalLikelyCost)}</p>
            <p className="text-xs text-neutral-400">{estimate.totalLikelyDays?.toFixed(0)} days</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-neutral-500">High Estimate</p>
            <p className="text-lg font-semibold text-neutral-600">{formatCost(estimate.totalHighCost)}</p>
            <p className="text-xs text-neutral-400">{estimate.totalHighDays?.toFixed(0)} days</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-neutral-200">
        <nav className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700",
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.id === "scope" && (
                <span className="ml-1 rounded-full bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-600">
                  {estimate.scopeItems.length}
                </span>
              )}
              {tab.id === "risks" && estimate.risks.length > 0 && (
                <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">
                  {estimate.risks.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="min-h-[400px]">
        {activeTab === "scope" && (
          <ScopeBuilder estimateId={estimate.id} scopeItems={estimate.scopeItems} />
        )}
        {activeTab === "questionnaire" && (
          <QuestionnairePanel estimateId={estimate.id} data={estimate.questionnaireData} />
        )}
        {activeTab === "summary" && (
          <EstimateSummary estimate={estimate} />
        )}
        {activeTab === "risks" && (
          <RisksPanel estimateId={estimate.id} risks={estimate.risks} />
        )}
        {activeTab === "assumptions" && (
          <AssumptionsPanel estimateId={estimate.id} assumptions={estimate.assumptions} />
        )}
        {activeTab === "settings" && (
          <OverheadSettings estimate={estimate} rateCards={rateCards} />
        )}
        {activeTab === "export" && (
          <ExportPanel estimate={estimate} />
        )}
        {activeTab === "history" && (
          <VersionHistory versions={estimate.versions} currentVersion={estimate.version} />
        )}
      </div>
    </div>
  );
}
