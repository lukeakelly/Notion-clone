"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addAssumption, updateAssumption, deleteAssumption } from "@/server/actions";
import { DEFAULT_ASSUMPTIONS } from "@/lib/estimation";
import { Plus, Trash2, Edit2, Save, X, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Assumption {
  id: string;
  description: string;
  relatedScopeItem: string | null;
  status: string;
}

export function AssumptionsPanel({
  estimateId,
  assumptions,
}: {
  estimateId: string;
  assumptions: Assumption[];
}) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newDescription, setNewDescription] = useState("");

  const handleAdd = async () => {
    if (!newDescription.trim()) {
      toast.error("Description is required");
      return;
    }
    try {
      await addAssumption(estimateId, { description: newDescription });
      setNewDescription("");
      setShowAdd(false);
      toast.success("Assumption added");
      router.refresh();
    } catch {
      toast.error("Failed to add");
    }
  };

  const handleAddDefaults = async () => {
    try {
      for (const desc of DEFAULT_ASSUMPTIONS) {
        const exists = assumptions.some((a) => a.description === desc);
        if (!exists) {
          await addAssumption(estimateId, { description: desc });
        }
      }
      toast.success("Default assumptions added");
      router.refresh();
    } catch {
      toast.error("Failed to add defaults");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAssumption(id);
      toast.success("Deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleUpdate = async (id: string, description: string) => {
    try {
      await updateAssumption(id, { description });
      setEditingId(null);
      router.refresh();
    } catch {
      toast.error("Failed to update");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-700">Assumptions ({assumptions.length})</h3>
        <div className="flex gap-2">
          <button
            onClick={handleAddDefaults}
            className="flex items-center gap-1.5 rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50"
          >
            <Wand2 className="h-3.5 w-3.5" />
            Add Defaults
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Assumption
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-3">
          <textarea
            placeholder="Assumption description"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            rows={2}
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAdd(false)} className="rounded-md px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100">Cancel</button>
            <button onClick={handleAdd} className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">Add</button>
          </div>
        </div>
      )}

      {assumptions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center">
          <p className="text-sm text-neutral-500">No assumptions yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {assumptions.map((a) => (
            <AssumptionRow
              key={a.id}
              assumption={a}
              isEditing={editingId === a.id}
              onEdit={() => setEditingId(a.id)}
              onCancelEdit={() => setEditingId(null)}
              onUpdate={(desc) => handleUpdate(a.id, desc)}
              onDelete={() => handleDelete(a.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AssumptionRow({
  assumption,
  isEditing,
  onEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
}: {
  assumption: Assumption;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (desc: string) => void;
  onDelete: () => void;
}) {
  const [desc, setDesc] = useState(assumption.description);

  if (isEditing) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50/30 p-3">
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="flex-1 rounded border border-neutral-200 px-2 py-1 text-sm" rows={2} />
        <button onClick={() => onUpdate(desc)} className="rounded p-1 text-green-600 hover:bg-green-50"><Save className="h-3.5 w-3.5" /></button>
        <button onClick={onCancelEdit} className="rounded p-1 text-neutral-400 hover:bg-neutral-100"><X className="h-3.5 w-3.5" /></button>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-white p-3">
      <span className={cn(
        "mt-1 inline-block h-2 w-2 shrink-0 rounded-full",
        assumption.status === "active" ? "bg-blue-500" : assumption.status === "validated" ? "bg-green-500" : "bg-red-500",
      )} />
      <p className="flex-1 text-sm">{assumption.description}</p>
      <div className="flex gap-1">
        <button onClick={onEdit} className="rounded p-1 text-neutral-400 hover:bg-neutral-100"><Edit2 className="h-3.5 w-3.5" /></button>
        <button onClick={onDelete} className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  );
}
