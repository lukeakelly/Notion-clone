"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { addScopeItem, updateScopeItem, deleteScopeItem } from "@/server/actions";
import {
  SCOPE_CATEGORIES,
  PRIORITIES,
  COMPLEXITIES,
  EFFORT_DRIVERS,
} from "@/lib/constants";
import { Plus, Trash2, Edit2, Save, X, GripVertical } from "lucide-react";

interface ScopeItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  priority: string;
  complexity: string;
  effortDriver: string | null;
  lowEffort: number | null;
  likelyEffort: number | null;
  highEffort: number | null;
  overridden: boolean;
  overrideNote: string | null;
  confidence: string | null;
}

export function ScopeBuilder({
  estimateId,
  scopeItems,
}: {
  estimateId: string;
  scopeItems: ScopeItem[];
}) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({
    name: "",
    description: "",
    category: "frontend",
    priority: "must",
    complexity: "medium",
    effortDriver: "screen",
  });

  const handleAdd = async () => {
    if (!addForm.name.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      await addScopeItem(estimateId, {
        name: addForm.name,
        description: addForm.description || undefined,
        category: addForm.category,
        priority: addForm.priority,
        complexity: addForm.complexity,
        effortDriver: addForm.effortDriver,
      });
      setAddForm({ name: "", description: "", category: "frontend", priority: "must", complexity: "medium", effortDriver: "screen" });
      setShowAdd(false);
      toast.success("Scope item added");
      router.refresh();
    } catch {
      toast.error("Failed to add item");
    }
  };

  const handleUpdate = async (id: string, data: Record<string, unknown>) => {
    try {
      await updateScopeItem(id, data);
      setEditingId(null);
      router.refresh();
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this scope item?")) return;
    try {
      await deleteScopeItem(id);
      toast.success("Deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-700">
          Scope Items ({scopeItems.length})
        </h3>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Item
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Feature name"
              value={addForm.name}
              onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
              className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              autoFocus
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={addForm.description}
              onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))}
              className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <select value={addForm.category} onChange={(e) => setAddForm((f) => ({ ...f, category: e.target.value }))} className="rounded-md border border-neutral-200 px-2 py-1.5 text-sm">
              {SCOPE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select value={addForm.priority} onChange={(e) => setAddForm((f) => ({ ...f, priority: e.target.value }))} className="rounded-md border border-neutral-200 px-2 py-1.5 text-sm">
              {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <select value={addForm.complexity} onChange={(e) => setAddForm((f) => ({ ...f, complexity: e.target.value }))} className="rounded-md border border-neutral-200 px-2 py-1.5 text-sm">
              {COMPLEXITIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select value={addForm.effortDriver} onChange={(e) => setAddForm((f) => ({ ...f, effortDriver: e.target.value }))} className="rounded-md border border-neutral-200 px-2 py-1.5 text-sm">
              {EFFORT_DRIVERS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAdd(false)} className="rounded-md px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100">Cancel</button>
            <button onClick={handleAdd} className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">Add</button>
          </div>
        </div>
      )}

      {/* Scope items table */}
      {scopeItems.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center">
          <p className="text-sm text-neutral-500">No scope items yet. Add items to build your estimate.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="w-8 px-2 py-2"></th>
                <th className="px-3 py-2 text-left font-medium text-neutral-600">Name</th>
                <th className="px-3 py-2 text-left font-medium text-neutral-600">Category</th>
                <th className="px-3 py-2 text-left font-medium text-neutral-600">Priority</th>
                <th className="px-3 py-2 text-left font-medium text-neutral-600">Complexity</th>
                <th className="px-3 py-2 text-left font-medium text-neutral-600">Driver</th>
                <th className="px-3 py-2 text-right font-medium text-neutral-600">Low</th>
                <th className="px-3 py-2 text-right font-medium text-neutral-600">Likely</th>
                <th className="px-3 py-2 text-right font-medium text-neutral-600">High</th>
                <th className="w-20 px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {scopeItems.map((item) => (
                <ScopeRow
                  key={item.id}
                  item={item}
                  isEditing={editingId === item.id}
                  onEdit={() => setEditingId(item.id)}
                  onCancelEdit={() => setEditingId(null)}
                  onUpdate={(data) => handleUpdate(item.id, data)}
                  onDelete={() => handleDelete(item.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const PRIORITY_COLORS: Record<string, string> = {
  must: "bg-red-100 text-red-700",
  should: "bg-orange-100 text-orange-700",
  could: "bg-blue-100 text-blue-700",
  wont: "bg-neutral-100 text-neutral-500",
};

const COMPLEXITY_COLORS: Record<string, string> = {
  low: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  very_high: "bg-red-100 text-red-700",
};

function ScopeRow({
  item,
  isEditing,
  onEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
}: {
  item: ScopeItem;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (data: Record<string, unknown>) => void;
  onDelete: () => void;
}) {
  const [form, setForm] = useState({
    name: item.name,
    description: item.description ?? "",
    category: item.category,
    priority: item.priority,
    complexity: item.complexity,
    effortDriver: item.effortDriver ?? "screen",
    lowEffort: item.lowEffort,
    likelyEffort: item.likelyEffort,
    highEffort: item.highEffort,
  });

  if (isEditing) {
    return (
      <tr className="border-b border-neutral-100 bg-blue-50/30">
        <td className="px-2 py-2"></td>
        <td className="px-3 py-2">
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded border border-neutral-200 px-2 py-1 text-sm" />
        </td>
        <td className="px-3 py-2">
          <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="rounded border border-neutral-200 px-1 py-1 text-xs">
            {SCOPE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </td>
        <td className="px-3 py-2">
          <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))} className="rounded border border-neutral-200 px-1 py-1 text-xs">
            {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </td>
        <td className="px-3 py-2">
          <select value={form.complexity} onChange={(e) => setForm((f) => ({ ...f, complexity: e.target.value }))} className="rounded border border-neutral-200 px-1 py-1 text-xs">
            {COMPLEXITIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </td>
        <td className="px-3 py-2">
          <select value={form.effortDriver} onChange={(e) => setForm((f) => ({ ...f, effortDriver: e.target.value }))} className="rounded border border-neutral-200 px-1 py-1 text-xs">
            {EFFORT_DRIVERS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </td>
        <td className="px-3 py-2">
          <input type="number" value={form.lowEffort ?? ""} onChange={(e) => setForm((f) => ({ ...f, lowEffort: e.target.value ? Number(e.target.value) : null }))} className="w-14 rounded border border-neutral-200 px-1 py-1 text-xs text-right" step="0.5" />
        </td>
        <td className="px-3 py-2">
          <input type="number" value={form.likelyEffort ?? ""} onChange={(e) => setForm((f) => ({ ...f, likelyEffort: e.target.value ? Number(e.target.value) : null }))} className="w-14 rounded border border-neutral-200 px-1 py-1 text-xs text-right" step="0.5" />
        </td>
        <td className="px-3 py-2">
          <input type="number" value={form.highEffort ?? ""} onChange={(e) => setForm((f) => ({ ...f, highEffort: e.target.value ? Number(e.target.value) : null }))} className="w-14 rounded border border-neutral-200 px-1 py-1 text-xs text-right" step="0.5" />
        </td>
        <td className="px-2 py-2">
          <div className="flex gap-1">
            <button
              onClick={() => {
                const overridden = form.lowEffort != null || form.likelyEffort != null || form.highEffort != null;
                onUpdate({ ...form, overridden, overrideNote: overridden ? "Manual override" : null });
              }}
              className="rounded p-1 text-green-600 hover:bg-green-50"
            >
              <Save className="h-3.5 w-3.5" />
            </button>
            <button onClick={onCancelEdit} className="rounded p-1 text-neutral-400 hover:bg-neutral-100">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  const cat = SCOPE_CATEGORIES.find((c) => c.value === item.category);
  const driver = EFFORT_DRIVERS.find((d) => d.value === item.effortDriver);

  return (
    <tr className={cn("border-b border-neutral-100 last:border-b-0", item.priority === "wont" && "opacity-50")}>
      <td className="px-2 py-2 text-neutral-300"><GripVertical className="h-3.5 w-3.5" /></td>
      <td className="px-3 py-2">
        <div className="font-medium">{item.name}</div>
        {item.description && <div className="text-xs text-neutral-500">{item.description}</div>}
        {item.overridden && <div className="text-xs text-amber-600">Manually overridden</div>}
      </td>
      <td className="px-3 py-2 text-xs">{cat?.label ?? item.category}</td>
      <td className="px-3 py-2">
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", PRIORITY_COLORS[item.priority] ?? "bg-neutral-100 text-neutral-600")}>
          {item.priority}
        </span>
      </td>
      <td className="px-3 py-2">
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", COMPLEXITY_COLORS[item.complexity] ?? "bg-neutral-100 text-neutral-600")}>
          {item.complexity.replace("_", " ")}
        </span>
      </td>
      <td className="px-3 py-2 text-xs text-neutral-500">{driver?.label ?? item.effortDriver ?? "-"}</td>
      <td className="px-3 py-2 text-right font-mono text-xs text-neutral-500">{item.lowEffort?.toFixed(1) ?? "-"}</td>
      <td className="px-3 py-2 text-right font-mono text-xs font-medium">{item.likelyEffort?.toFixed(1) ?? "-"}</td>
      <td className="px-3 py-2 text-right font-mono text-xs text-neutral-500">{item.highEffort?.toFixed(1) ?? "-"}</td>
      <td className="px-2 py-2">
        <div className="flex gap-1">
          <button onClick={onEdit} className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600">
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDelete} className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}
