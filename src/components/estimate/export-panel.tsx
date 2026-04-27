"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileSpreadsheet, FileText, Download } from "lucide-react";

type EstimateData = {
  id: string;
  projectName: string;
  clientName: string;
  currency: string;
  estimateType: string;
  confidenceLevel: string | null;
  totalLowDays: number | null;
  totalLikelyDays: number | null;
  totalHighDays: number | null;
  totalLowCost: number | null;
  totalLikelyCost: number | null;
  totalHighCost: number | null;
  scopeItems: Array<{
    name: string;
    category: string;
    priority: string;
    complexity: string;
    lowEffort: number | null;
    likelyEffort: number | null;
    highEffort: number | null;
  }>;
  roleEstimates: Array<{
    role: string;
    days: number;
    rate: number;
    cost: number;
    phase: string | null;
    workstream: string | null;
  }>;
  risks: Array<{ description: string; impact: string; likelihood: string; mitigation: string | null }>;
  assumptions: Array<{ description: string }>;
};

export function ExportPanel({ estimate }: { estimate: EstimateData }) {
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExportExcel = async () => {
    setExporting("excel");
    try {
      const response = await fetch(`/api/estimates/${estimate.id}/export?format=excel`);
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${estimate.projectName.replace(/\s+/g, "_")}_Estimate.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Excel exported");
    } catch {
      toast.error("Failed to export Excel");
    } finally {
      setExporting(null);
    }
  };

  const handleExportWord = async () => {
    setExporting("word");
    try {
      const response = await fetch(`/api/estimates/${estimate.id}/export?format=word`);
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${estimate.projectName.replace(/\s+/g, "_")}_Estimate.docx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Word document exported");
    } catch {
      toast.error("Failed to export Word");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-medium text-neutral-700">Export Estimate</h3>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={handleExportExcel}
          disabled={exporting !== null}
          className="flex flex-col items-center gap-3 rounded-lg border border-neutral-200 bg-white p-8 transition-colors hover:border-green-300 hover:bg-green-50/50 disabled:opacity-50"
        >
          <FileSpreadsheet className="h-10 w-10 text-green-600" />
          <div className="text-center">
            <p className="text-sm font-medium">Export to Excel</p>
            <p className="text-xs text-neutral-500">
              Detailed cost model with scope, roles, risks
            </p>
          </div>
          <span className="flex items-center gap-1 text-xs text-green-600">
            <Download className="h-3 w-3" />
            {exporting === "excel" ? "Exporting..." : "Download .xlsx"}
          </span>
        </button>

        <button
          onClick={handleExportWord}
          disabled={exporting !== null}
          className="flex flex-col items-center gap-3 rounded-lg border border-neutral-200 bg-white p-8 transition-colors hover:border-blue-300 hover:bg-blue-50/50 disabled:opacity-50"
        >
          <FileText className="h-10 w-10 text-blue-600" />
          <div className="text-center">
            <p className="text-sm font-medium">Export to Word</p>
            <p className="text-xs text-neutral-500">
              Executive summary for client proposals
            </p>
          </div>
          <span className="flex items-center gap-1 text-xs text-blue-600">
            <Download className="h-3 w-3" />
            {exporting === "word" ? "Exporting..." : "Download .docx"}
          </span>
        </button>
      </div>

      {!estimate.totalLikelyCost && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            Recalculate the estimate before exporting to ensure all figures are up to date.
          </p>
        </div>
      )}
    </div>
  );
}
