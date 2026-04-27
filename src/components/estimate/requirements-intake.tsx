"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { bulkImportFromAI } from "@/server/actions";
import {
  Upload,
  FileText,
  Sparkles,
  Loader2,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X,
  ClipboardPaste,
} from "lucide-react";

interface ExtractionResult {
  scopeItems: Array<{
    name: string;
    description?: string;
    category: string;
    priority?: string;
    complexity?: string;
    effortDriver?: string;
  }>;
  risks: Array<{
    description: string;
    impact?: string;
    likelihood?: string;
    mitigation?: string;
  }>;
  assumptions: Array<{
    description: string;
  }>;
  summary?: string;
  missingInformation?: string[];
  suggestedProjectType?: string;
  suggestedConfidence?: string;
  confidenceReason?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  frontend: "Front End",
  backend: "Back End",
  integration: "Integration",
  data: "Data",
  ai: "AI / ML",
  devops: "DevOps",
  testing: "Testing",
  design: "Design",
  security: "Security",
};

const PRIORITY_LABELS: Record<string, string> = {
  must: "Must Have",
  should: "Should Have",
  could: "Could Have",
  wont: "Won't Have",
};

const COMPLEXITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  very_high: "Very High",
};

export function RequirementsIntake({ estimateId }: { estimateId: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"paste" | "upload">("paste");
  const [textContent, setTextContent] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    scopeItems: true,
    risks: true,
    assumptions: true,
    missingInfo: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);

    try {
      const text = await file.text();
      setTextContent(text);
      setMode("paste");
      toast.success(`Loaded ${file.name}`);
    } catch {
      setError("Failed to read file. Please try pasting the content instead.");
    }
  };

  const handleAnalyze = async () => {
    if (!textContent.trim()) {
      toast.error("Please paste or upload content to analyse");
      return;
    }

    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/estimates/${estimateId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: textContent }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Analysis failed");
      }

      const data: ExtractionResult = await res.json();
      setResult(data);
      toast.success(
        `Extracted ${data.scopeItems.length} features, ${data.risks.length} risks, ${data.assumptions.length} assumptions`,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      setError(message);
      toast.error(message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleImport = async () => {
    if (!result) return;

    setImporting(true);
    try {
      const counts = await bulkImportFromAI(estimateId, {
        scopeItems: result.scopeItems,
        risks: result.risks,
        assumptions: result.assumptions,
      });
      toast.success(
        `Imported ${counts.scopeItemsAdded} scope items, ${counts.risksAdded} risks, ${counts.assumptionsAdded} assumptions`,
      );
      setResult(null);
      setTextContent("");
      setFileName(null);
      router.refresh();
    } catch {
      toast.error("Failed to import extracted data");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-neutral-700">
              AI Requirements Extraction
            </h3>
            <p className="mt-0.5 text-xs text-neutral-500">
              Paste a BRD, discovery workshop output, RFP, or any project brief — AI will extract features, risks, and assumptions
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-md border border-neutral-200 p-0.5">
            <button
              onClick={() => setMode("paste")}
              className={cn(
                "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors",
                mode === "paste"
                  ? "bg-blue-600 text-white"
                  : "text-neutral-600 hover:bg-neutral-100",
              )}
            >
              <ClipboardPaste className="h-3.5 w-3.5" />
              Paste Text
            </button>
            <button
              onClick={() => setMode("upload")}
              className={cn(
                "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors",
                mode === "upload"
                  ? "bg-blue-600 text-white"
                  : "text-neutral-600 hover:bg-neutral-100",
              )}
            >
              <Upload className="h-3.5 w-3.5" />
              Upload File
            </button>
          </div>
        </div>

        {mode === "paste" ? (
          <div className="relative">
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Paste your BRD, workshop notes, RFP, user stories, or any project brief here..."
              className="h-64 w-full rounded-lg border border-neutral-200 p-4 text-sm leading-relaxed focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {textContent && (
              <button
                onClick={() => {
                  setTextContent("");
                  setFileName(null);
                  setResult(null);
                }}
                className="absolute right-2 top-2 rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <p className="mt-1 text-xs text-neutral-400">
              {textContent.length > 0
                ? `${textContent.length.toLocaleString()} characters`
                : "Supports any plain text — BRDs, meeting notes, emails, RFPs, user stories"}
              {fileName && ` · Loaded from ${fileName}`}
            </p>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 p-12 transition-colors hover:border-blue-400 hover:bg-blue-50/50"
          >
            <Upload className="h-8 w-8 text-neutral-400" />
            <div className="text-center">
              <p className="text-sm font-medium text-neutral-700">
                Click to upload a document
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                Supports .txt, .md, .csv, .json files
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.csv,.json,.rtf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}

        {/* Analyse button */}
        <button
          onClick={handleAnalyze}
          disabled={analyzing || !textContent.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-medium text-white transition-all hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
        >
          {analyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analysing with AI...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Analyse &amp; Extract Requirements
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <div>
            <p className="text-sm font-medium text-red-800">Analysis failed</p>
            <p className="mt-0.5 text-xs text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary */}
          {result.summary && (
            <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-800">AI Summary</p>
                  <p className="mt-1 text-sm text-blue-700">{result.summary}</p>
                  {result.suggestedConfidence && (
                    <p className="mt-2 text-xs text-blue-600">
                      Suggested confidence: <span className="font-medium">{result.suggestedConfidence}</span>
                      {result.confidenceReason && ` — ${result.confidenceReason}`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Scope Items */}
          <div className="rounded-lg border border-neutral-200 bg-white">
            <button
              onClick={() => toggleSection("scopeItems")}
              className="flex w-full items-center justify-between p-4"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">
                  Scope Items ({result.scopeItems.length})
                </span>
              </div>
              {expandedSections.scopeItems ? (
                <ChevronUp className="h-4 w-4 text-neutral-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-neutral-400" />
              )}
            </button>
            {expandedSections.scopeItems && result.scopeItems.length > 0 && (
              <div className="border-t border-neutral-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100 bg-neutral-50">
                      <th className="px-4 py-2 text-left font-medium text-neutral-600">Feature</th>
                      <th className="px-4 py-2 text-left font-medium text-neutral-600">Category</th>
                      <th className="px-4 py-2 text-left font-medium text-neutral-600">Priority</th>
                      <th className="px-4 py-2 text-left font-medium text-neutral-600">Complexity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.scopeItems.map((item, i) => (
                      <tr key={i} className="border-b border-neutral-100 last:border-0">
                        <td className="px-4 py-2">
                          <p className="font-medium text-neutral-800">{item.name}</p>
                          {item.description && (
                            <p className="mt-0.5 text-xs text-neutral-500">{item.description}</p>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
                            {CATEGORY_LABELS[item.category] || item.category}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <span className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            item.priority === "must" ? "bg-red-100 text-red-700" :
                            item.priority === "should" ? "bg-amber-100 text-amber-700" :
                            item.priority === "could" ? "bg-blue-100 text-blue-700" :
                            "bg-neutral-100 text-neutral-600",
                          )}>
                            {PRIORITY_LABELS[item.priority || "must"] || item.priority}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <span className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            item.complexity === "high" || item.complexity === "very_high"
                              ? "bg-orange-100 text-orange-700"
                              : item.complexity === "medium"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700",
                          )}>
                            {COMPLEXITY_LABELS[item.complexity || "medium"] || item.complexity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Risks */}
          <div className="rounded-lg border border-neutral-200 bg-white">
            <button
              onClick={() => toggleSection("risks")}
              className="flex w-full items-center justify-between p-4"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium">
                  Risks ({result.risks.length})
                </span>
              </div>
              {expandedSections.risks ? (
                <ChevronUp className="h-4 w-4 text-neutral-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-neutral-400" />
              )}
            </button>
            {expandedSections.risks && result.risks.length > 0 && (
              <div className="border-t border-neutral-200 divide-y divide-neutral-100">
                {result.risks.map((risk, i) => (
                  <div key={i} className="px-4 py-3">
                    <p className="text-sm text-neutral-800">{risk.description}</p>
                    <div className="mt-1.5 flex items-center gap-3">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        risk.impact === "high" ? "bg-red-100 text-red-700" :
                        risk.impact === "medium" ? "bg-amber-100 text-amber-700" :
                        "bg-green-100 text-green-700",
                      )}>
                        Impact: {risk.impact}
                      </span>
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        risk.likelihood === "high" ? "bg-red-100 text-red-700" :
                        risk.likelihood === "medium" ? "bg-amber-100 text-amber-700" :
                        "bg-green-100 text-green-700",
                      )}>
                        Likelihood: {risk.likelihood}
                      </span>
                    </div>
                    {risk.mitigation && (
                      <p className="mt-1.5 text-xs text-neutral-500">
                        Mitigation: {risk.mitigation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assumptions */}
          <div className="rounded-lg border border-neutral-200 bg-white">
            <button
              onClick={() => toggleSection("assumptions")}
              className="flex w-full items-center justify-between p-4"
            >
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">
                  Assumptions ({result.assumptions.length})
                </span>
              </div>
              {expandedSections.assumptions ? (
                <ChevronUp className="h-4 w-4 text-neutral-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-neutral-400" />
              )}
            </button>
            {expandedSections.assumptions && result.assumptions.length > 0 && (
              <div className="border-t border-neutral-200 divide-y divide-neutral-100">
                {result.assumptions.map((a, i) => (
                  <div key={i} className="px-4 py-2.5">
                    <p className="text-sm text-neutral-700">{a.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Missing Information */}
          {result.missingInformation && result.missingInformation.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/50">
              <button
                onClick={() => toggleSection("missingInfo")}
                className="flex w-full items-center justify-between p-4"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">
                    Missing Information ({result.missingInformation.length})
                  </span>
                </div>
                {expandedSections.missingInfo ? (
                  <ChevronUp className="h-4 w-4 text-amber-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-amber-400" />
                )}
              </button>
              {expandedSections.missingInfo && (
                <div className="border-t border-amber-200 px-4 py-3">
                  <ul className="space-y-1.5">
                    {result.missingInformation.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Import button */}
          <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50/50 p-4">
            <div>
              <p className="text-sm font-medium text-green-800">
                Ready to import {result.scopeItems.length} scope items, {result.risks.length} risks, and {result.assumptions.length} assumptions
              </p>
              <p className="mt-0.5 text-xs text-green-600">
                Items will be added to the existing estimate. You can edit or remove them afterward.
              </p>
            </div>
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Import All
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
