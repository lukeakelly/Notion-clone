"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateEstimate } from "@/server/actions";

type EstimateData = {
  id: string;
  requirementsClarity: string;
  designMaturity: string;
  integrationFamiliarity: string;
  regulatoryComplexity: string;
  securityComplexity: string;
  performanceNeeds: string;
  techStackFamiliarity: string;
  pmPercent: number;
  baPercent: number;
  archPercent: number;
  qaPercent: number;
  devopsPercent: number;
  securityPercent: number;
  docPercent: number;
  contingencyPercent: number;
  includesFrontEnd: boolean;
  includesBackEnd: boolean;
  includesFullStack: boolean;
  includesApiIntegration: boolean;
  includesDataLayer: boolean;
  includesAuth: boolean;
  includesAdminConsole: boolean;
  includesReporting: boolean;
  includesWorkflowEngine: boolean;
  includesAiCapability: boolean;
  includesThirdParty: boolean;
  includesDevOps: boolean;
  includesMaintenance: boolean;
  rateCardId: string | null;
};

type RateCardList = Array<{
  id: string;
  name: string;
  currency: string;
  isDefault: boolean;
  roles: Array<{ id: string; role: string; standardRate: number }>;
}>;

const COMPLEXITY_OPTIONS = {
  requirementsClarity: [
    { value: "clear", label: "Clear (1.0x)" },
    { value: "partial", label: "Partial (1.2x)" },
    { value: "poor", label: "Poorly defined (1.5x)" },
  ],
  designMaturity: [
    { value: "existing", label: "Existing design system (0.8x)" },
    { value: "wireframes", label: "Wireframes available (1.0x)" },
    { value: "none", label: "No UX designs (1.3x)" },
  ],
  integrationFamiliarity: [
    { value: "known", label: "Known APIs (1.0x)" },
    { value: "partial", label: "Partially known (1.2x)" },
    { value: "unknown", label: "Unknown (1.5x)" },
  ],
  regulatoryComplexity: [
    { value: "standard", label: "Standard (1.0x)" },
    { value: "regulated", label: "Regulated (1.3x)" },
    { value: "highly_regulated", label: "Highly regulated (1.5x)" },
  ],
  securityComplexity: [
    { value: "standard", label: "Standard (1.0x)" },
    { value: "elevated", label: "Elevated (1.2x)" },
    { value: "complex", label: "Complex (1.4x)" },
  ],
  performanceNeeds: [
    { value: "standard", label: "Standard (1.0x)" },
    { value: "high", label: "High volume (1.2x)" },
    { value: "critical", label: "Critical / real-time (1.3x)" },
  ],
  techStackFamiliarity: [
    { value: "known", label: "Known stack (1.0x)" },
    { value: "partial", label: "Partially known (1.2x)" },
    { value: "new", label: "New technology (1.4x)" },
  ],
};

const SCOPE_FLAGS = [
  { key: "includesFrontEnd", label: "Front End" },
  { key: "includesBackEnd", label: "Back End" },
  { key: "includesFullStack", label: "Full Stack" },
  { key: "includesApiIntegration", label: "API / Integration" },
  { key: "includesDataLayer", label: "Data Layer" },
  { key: "includesAuth", label: "Authentication / Security" },
  { key: "includesAdminConsole", label: "Admin Console" },
  { key: "includesReporting", label: "Reporting" },
  { key: "includesWorkflowEngine", label: "Workflow Engine" },
  { key: "includesAiCapability", label: "AI / LLM Capability" },
  { key: "includesThirdParty", label: "Third-Party Integrations" },
  { key: "includesDevOps", label: "DevOps & Hosting" },
  { key: "includesMaintenance", label: "Support & Maintenance" },
] as const;

export function OverheadSettings({
  estimate,
  rateCards,
}: {
  estimate: EstimateData;
  rateCards: RateCardList;
}) {
  const router = useRouter();

  const handleSave = async (data: Record<string, unknown>) => {
    try {
      await updateEstimate(estimate.id, data);
      toast.success("Settings saved");
      router.refresh();
    } catch {
      toast.error("Failed to save");
    }
  };

  return (
    <div className="space-y-6">
      {/* Scope Selection */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h3 className="mb-4 text-sm font-semibold">Scope Selection</h3>
        <p className="mb-3 text-xs text-neutral-500">Select what the project includes:</p>
        <div className="grid grid-cols-3 gap-3">
          {SCOPE_FLAGS.map((flag) => (
            <label key={flag.key} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={estimate[flag.key as keyof EstimateData] as boolean}
                onChange={(e) => handleSave({ [flag.key]: e.target.checked })}
                className="rounded border-neutral-300"
              />
              {flag.label}
            </label>
          ))}
        </div>
      </div>

      {/* Complexity Multipliers */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h3 className="mb-4 text-sm font-semibold">Complexity Multipliers</h3>
        <p className="mb-3 text-xs text-neutral-500">These affect the base effort calculation for all scope items:</p>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(COMPLEXITY_OPTIONS).map(([key, options]) => (
            <div key={key}>
              <label className="mb-1 block text-xs font-medium text-neutral-600">
                {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
              </label>
              <select
                value={estimate[key as keyof EstimateData] as string}
                onChange={(e) => handleSave({ [key]: e.target.value })}
                className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm"
              >
                {options.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Overheads */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h3 className="mb-4 text-sm font-semibold">Delivery Overheads</h3>
        <p className="mb-3 text-xs text-neutral-500">Percentage of build effort added for each category:</p>
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: "pmPercent", label: "Project Management", default: "10-15%" },
            { key: "baPercent", label: "Business Analysis", default: "10-20%" },
            { key: "archPercent", label: "Solution Architecture", default: "5-15%" },
            { key: "qaPercent", label: "QA / Testing", default: "20-30%" },
            { key: "devopsPercent", label: "DevOps", default: "5-15%" },
            { key: "securityPercent", label: "Security Review", default: "5-10%" },
            { key: "docPercent", label: "Documentation", default: "5-10%" },
            { key: "contingencyPercent", label: "Contingency", default: "10-30%" },
          ].map((overhead) => (
            <div key={overhead.key} className="flex items-center gap-3">
              <label className="w-40 text-xs text-neutral-600">{overhead.label}</label>
              <input
                type="number"
                value={estimate[overhead.key as keyof EstimateData] as number}
                onChange={(e) => handleSave({ [overhead.key]: Number(e.target.value) })}
                className="w-20 rounded-md border border-neutral-200 px-2 py-1.5 text-sm text-right"
                min={0}
                max={100}
                step={0.5}
              />
              <span className="text-xs text-neutral-400">% ({overhead.default})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rate Card */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h3 className="mb-4 text-sm font-semibold">Rate Card</h3>
        <select
          value={estimate.rateCardId ?? ""}
          onChange={(e) => handleSave({ rateCardId: e.target.value || null })}
          className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
        >
          <option value="">No rate card selected</option>
          {rateCards.map((rc) => (
            <option key={rc.id} value={rc.id}>
              {rc.name} ({rc.currency}){rc.isDefault ? " - Default" : ""}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
