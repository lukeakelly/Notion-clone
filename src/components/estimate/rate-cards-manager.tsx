"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createRateCard, updateRateCard, deleteRateCard } from "@/server/actions";
import { DEFAULT_ROLES } from "@/lib/constants";
import { Plus, Trash2, Star, CreditCard } from "lucide-react";

interface RateCardRole {
  id: string;
  role: string;
  standardRate: number;
  costRate: number | null;
  margin: number | null;
  location: string | null;
  seniority: string | null;
}

interface RateCard {
  id: string;
  name: string;
  description: string | null;
  currency: string;
  isDefault: boolean;
  roles: RateCardRole[];
}

export function RateCardsManager({
  initialRateCards,
}: {
  initialRateCards: RateCard[];
}) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({
    name: "",
    description: "",
    currency: "AUD",
    isDefault: false,
  });
  const [newRoles, setNewRoles] = useState<Array<{ role: string; standardRate: number; costRate: number; margin: number }>>(
    DEFAULT_ROLES.map((r) => ({ role: r, standardRate: 1400, costRate: 900, margin: 35 })),
  );

  const handleCreate = async () => {
    if (!newForm.name.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      await createRateCard({
        name: newForm.name,
        description: newForm.description || undefined,
        currency: newForm.currency,
        isDefault: newForm.isDefault,
        roles: newRoles,
      });
      setShowNew(false);
      setNewForm({ name: "", description: "", currency: "AUD", isDefault: false });
      toast.success("Rate card created");
      router.refresh();
    } catch {
      toast.error("Failed to create");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this rate card?")) return;
    try {
      await deleteRateCard(id);
      toast.success("Deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await updateRateCard(id, { isDefault: true });
      toast.success("Set as default");
      router.refresh();
    } catch {
      toast.error("Failed to update");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rate Cards</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage role rates for your estimates</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New Rate Card
        </button>
      </div>

      {/* New rate card form */}
      {showNew && (
        <div className="rounded-lg border border-blue-200 bg-white p-6 space-y-4">
          <h3 className="text-sm font-semibold">New Rate Card</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">Name</label>
              <input
                type="text"
                value={newForm.name}
                onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
                placeholder="e.g. Standard AUD"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">Currency</label>
              <select
                value={newForm.currency}
                onChange={(e) => setNewForm((f) => ({ ...f, currency: e.target.value }))}
                className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
              >
                <option value="AUD">AUD</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={newForm.isDefault}
                  onChange={(e) => setNewForm((f) => ({ ...f, isDefault: e.target.checked }))}
                  className="rounded border-neutral-300"
                />
                Set as default
              </label>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-xs font-medium text-neutral-600">Roles & Rates</h4>
            <div className="max-h-96 overflow-y-auto rounded border border-neutral-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="px-3 py-2 text-left font-medium text-neutral-600">Role</th>
                    <th className="px-3 py-2 text-right font-medium text-neutral-600">Day Rate</th>
                    <th className="px-3 py-2 text-right font-medium text-neutral-600">Cost Rate</th>
                    <th className="px-3 py-2 text-right font-medium text-neutral-600">Margin %</th>
                  </tr>
                </thead>
                <tbody>
                  {newRoles.map((role, idx) => (
                    <tr key={idx} className="border-b border-neutral-100">
                      <td className="px-3 py-1.5 text-sm">{role.role}</td>
                      <td className="px-3 py-1.5">
                        <input
                          type="number"
                          value={role.standardRate}
                          onChange={(e) => {
                            const updated = [...newRoles];
                            updated[idx] = { ...updated[idx], standardRate: Number(e.target.value) };
                            setNewRoles(updated);
                          }}
                          className="w-24 rounded border border-neutral-200 px-2 py-1 text-right text-sm"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="number"
                          value={role.costRate}
                          onChange={(e) => {
                            const updated = [...newRoles];
                            updated[idx] = { ...updated[idx], costRate: Number(e.target.value) };
                            setNewRoles(updated);
                          }}
                          className="w-24 rounded border border-neutral-200 px-2 py-1 text-right text-sm"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="number"
                          value={role.margin}
                          onChange={(e) => {
                            const updated = [...newRoles];
                            updated[idx] = { ...updated[idx], margin: Number(e.target.value) };
                            setNewRoles(updated);
                          }}
                          className="w-16 rounded border border-neutral-200 px-2 py-1 text-right text-sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setShowNew(false)} className="rounded-md border border-neutral-200 px-4 py-2 text-sm hover:bg-neutral-50">Cancel</button>
            <button onClick={handleCreate} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Create</button>
          </div>
        </div>
      )}

      {/* Existing rate cards */}
      {initialRateCards.length === 0 && !showNew ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-12 text-center">
          <CreditCard className="mx-auto h-10 w-10 text-neutral-400" />
          <h3 className="mt-3 text-sm font-medium">No rate cards yet</h3>
          <p className="mt-1 text-sm text-neutral-500">Create a rate card to assign rates to your estimates.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {initialRateCards.map((rc) => (
            <div key={rc.id} className="rounded-lg border border-neutral-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{rc.name}</h3>
                  <span className="text-sm text-neutral-500">({rc.currency})</span>
                  {rc.isDefault && (
                    <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      <Star className="h-3 w-3" />
                      Default
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {!rc.isDefault && (
                    <button onClick={() => handleSetDefault(rc.id)} className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs hover:bg-neutral-50">
                      Set Default
                    </button>
                  )}
                  <button onClick={() => handleDelete(rc.id)} className="rounded-md border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {rc.description && (
                <p className="mb-3 text-sm text-neutral-500">{rc.description}</p>
              )}
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="py-2 text-left font-medium text-neutral-500">Role</th>
                    <th className="py-2 text-right font-medium text-neutral-500">Day Rate</th>
                    <th className="py-2 text-right font-medium text-neutral-500">Cost Rate</th>
                    <th className="py-2 text-right font-medium text-neutral-500">Margin</th>
                    <th className="py-2 text-left font-medium text-neutral-500">Location</th>
                    <th className="py-2 text-left font-medium text-neutral-500">Seniority</th>
                  </tr>
                </thead>
                <tbody>
                  {rc.roles.map((role) => (
                    <tr key={role.id} className="border-b border-neutral-100 last:border-b-0">
                      <td className="py-1.5">{role.role}</td>
                      <td className="py-1.5 text-right font-mono">${role.standardRate.toLocaleString()}</td>
                      <td className="py-1.5 text-right font-mono text-neutral-500">{role.costRate != null ? `$${role.costRate.toLocaleString()}` : "-"}</td>
                      <td className="py-1.5 text-right">{role.margin != null ? `${role.margin}%` : "-"}</td>
                      <td className="py-1.5 text-neutral-500">{role.location ?? "-"}</td>
                      <td className="py-1.5 text-neutral-500">{role.seniority ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
