"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { addRisk, updateRisk, deleteRisk } from "@/server/actions";
import { DEFAULT_COMMON_RISKS } from "@/lib/estimation";
import { Plus, Trash2, Edit2, Save, X, Wand2 } from "lucide-react";

interface Risk {
  id: string;
  description: string;
  impact: string;
  likelihood: string;
  mitigation: string | null;
  owner: string | null;
}

const IMPACT_COLORS: Record<string, string> = {
  low: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
};

export function RisksPanel({
  estimateId,
  risks,
}: {
  estimateId: string;
  risks: Risk[];
}) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({
    description: "",
    impact: "medium",
    likelihood: "medium",
    mitigation: "",
  });

  const handleAdd = async () => {
    if (!addForm.description.trim()) {
      toast.error("Description is required");
      return;
    }
    try {
      await addRisk(estimateId, {
        description: addForm.description,
        impact: addForm.impact,
        likelihood: addForm.likelihood,
        mitigation: addForm.mitigation || undefined,
      });
      setAddForm({ description: "", impact: "medium", likelihood: "medium", mitigation: "" });
      setShowAdd(false);
      toast.success("Risk added");
      router.refresh();
    } catch {
      toast.error("Failed to add risk");
    }
  };

  const handleAddCommon = async () => {
    try {
      for (const risk of DEFAULT_COMMON_RISKS) {
        const exists = risks.some((r) => r.description === risk.description);
        if (!exists) {
          await addRisk(estimateId, risk);
        }
      }
      toast.success("Common risks added");
      router.refresh();
    } catch {
      toast.error("Failed to add common risks");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRisk(id);
      toast.success("Risk deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleUpdate = async (id: string, data: Record<string, unknown>) => {
    try {
      await updateRisk(id, data);
      setEditingId(null);
      router.refresh();
    } catch {
      toast.error("Failed to update");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-700">Risks ({risks.length})</h3>
        <div className="flex gap-2">
          <button
            onClick={handleAddCommon}
            className="flex items-center gap-1.5 rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50"
          >
            <Wand2 className="h-3.5 w-3.5" />
            Add Common Risks
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Risk
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-3">
          <textarea
            placeholder="Risk description"
            value={addForm.description}
            onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            rows={2}
          />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-neutral-500">Impact</label>
              <select value={addForm.impact} onChange={(e) => setAddForm((f) => ({ ...f, impact: e.target.value }))} className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-neutral-500">Likelihood</label>
              <select value={addForm.likelihood} onChange={(e) => setAddForm((f) => ({ ...f, likelihood: e.target.value }))} className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-neutral-500">Mitigation</label>
              <input
                type="text"
                placeholder="Mitigation strategy"
                value={addForm.mitigation}
                onChange={(e) => setAddForm((f) => ({ ...f, mitigation: e.target.value }))}
                className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAdd(false)} className="rounded-md px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100">Cancel</button>
            <button onClick={handleAdd} className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">Add</button>
          </div>
        </div>
      )}

      {risks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center">
          <p className="text-sm text-neutral-500">No risks identified yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {risks.map((risk) => (
            <RiskRow
              key={risk.id}
              risk={risk}
              isEditing={editingId === risk.id}
              onEdit={() => setEditingId(risk.id)}
              onCancelEdit={() => setEditingId(null)}
              onUpdate={(data) => handleUpdate(risk.id, data)}
              onDelete={() => handleDelete(risk.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RiskRow({
  risk,
  isEditing,
  onEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
}: {
  risk: Risk;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (data: Record<string, unknown>) => void;
  onDelete: () => void;
}) {
  const [form, setForm] = useState({
    description: risk.description,
    impact: risk.impact,
    likelihood: risk.likelihood,
    mitigation: risk.mitigation ?? "",
  });

  if (isEditing) {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50/30 p-4 space-y-2">
        <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full rounded border border-neutral-200 px-2 py-1 text-sm" rows={2} />
        <div className="grid grid-cols-3 gap-2">
          <select value={form.impact} onChange={(e) => setForm((f) => ({ ...f, impact: e.target.value }))} className="rounded border border-neutral-200 px-2 py-1 text-xs">
            <option value="low">Low Impact</option>
            <option value="medium">Medium Impact</option>
            <option value="high">High Impact</option>
          </select>
          <select value={form.likelihood} onChange={(e) => setForm((f) => ({ ...f, likelihood: e.target.value }))} className="rounded border border-neutral-200 px-2 py-1 text-xs">
            <option value="low">Low Likelihood</option>
            <option value="medium">Medium Likelihood</option>
            <option value="high">High Likelihood</option>
          </select>
          <input value={form.mitigation} onChange={(e) => setForm((f) => ({ ...f, mitigation: e.target.value }))} placeholder="Mitigation" className="rounded border border-neutral-200 px-2 py-1 text-xs" />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancelEdit} className="rounded p-1 text-neutral-400 hover:bg-neutral-100"><X className="h-3.5 w-3.5" /></button>
          <button onClick={() => onUpdate(form)} className="rounded p-1 text-green-600 hover:bg-green-50"><Save className="h-3.5 w-3.5" /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-white p-4">
      <span className={cn("mt-0.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full", risk.impact === "high" ? "bg-red-500" : risk.impact === "medium" ? "bg-amber-500" : "bg-green-500")} />
      <div className="flex-1">
        <p className="text-sm">{risk.description}</p>
        <div className="mt-1 flex gap-2">
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", IMPACT_COLORS[risk.impact])}>
            {risk.impact} impact
          </span>
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", IMPACT_COLORS[risk.likelihood])}>
            {risk.likelihood} likelihood
          </span>
          {risk.mitigation && (
            <span className="text-xs text-neutral-500">Mitigation: {risk.mitigation}</span>
          )}
        </div>
      </div>
      <div className="flex gap-1">
        <button onClick={onEdit} className="rounded p-1 text-neutral-400 hover:bg-neutral-100"><Edit2 className="h-3.5 w-3.5" /></button>
        <button onClick={onDelete} className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  );
}
