"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createEstimate } from "@/server/actions";
import { toast } from "sonner";
import {
  PROJECT_TYPES,
  ESTIMATE_TYPES,
  INDUSTRIES,
  CURRENCIES,
  DELIVERY_MODELS,
  METHODOLOGIES,
} from "@/lib/constants";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface RateCardOption {
  id: string;
  name: string;
  currency: string;
  isDefault: boolean;
}

export default function NewEstimatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [rateCards, setRateCards] = useState<RateCardOption[]>([]);

  const [form, setForm] = useState({
    projectName: "",
    clientName: "",
    industry: "",
    projectType: "web_application",
    estimateType: "rom",
    currency: "AUD",
    targetDate: "",
    deliveryModel: "onshore",
    methodology: "agile",
    rateCardId: "",
  });

  useEffect(() => {
    fetch("/api/rate-cards")
      .then((r) => r.json())
      .then((cards: RateCardOption[]) => {
        setRateCards(cards);
        const defaultCard = cards.find((c: RateCardOption) => c.isDefault);
        if (defaultCard) setForm((f) => ({ ...f, rateCardId: defaultCard.id }));
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.projectName || !form.clientName || !form.projectType) {
      toast.error("Please fill in required fields");
      return;
    }
    setLoading(true);
    try {
      const estimate = await createEstimate({
        ...form,
        industry: form.industry || undefined,
        targetDate: form.targetDate || undefined,
        rateCardId: form.rateCardId || undefined,
      });
      toast.success("Estimate created");
      router.push(`/estimates/${estimate.id}`);
    } catch {
      toast.error("Failed to create estimate");
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Estimate</h1>
          <p className="text-sm text-neutral-500">Set up the project profile for your estimate</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-neutral-200 bg-white p-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Project Name" required>
            <input
              type="text"
              value={form.projectName}
              onChange={(e) => updateField("projectName", e.target.value)}
              placeholder="e.g. Client Portal MVP"
              className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </FormField>

          <FormField label="Client / Internal Owner" required>
            <input
              type="text"
              value={form.clientName}
              onChange={(e) => updateField("clientName", e.target.value)}
              placeholder="e.g. Acme Corp"
              className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Project Type" required>
            <select
              value={form.projectType}
              onChange={(e) => updateField("projectType", e.target.value)}
              className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {PROJECT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Estimate Type" required>
            <select
              value={form.estimateType}
              onChange={(e) => updateField("estimateType", e.target.value)}
              className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {ESTIMATE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField label="Industry">
            <select
              value={form.industry}
              onChange={(e) => updateField("industry", e.target.value)}
              className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select industry</option>
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Currency">
            <select
              value={form.currency}
              onChange={(e) => updateField("currency", e.target.value)}
              className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Target Go-Live Date">
            <input
              type="date"
              value={form.targetDate}
              onChange={(e) => updateField("targetDate", e.target.value)}
              className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField label="Delivery Model">
            <select
              value={form.deliveryModel}
              onChange={(e) => updateField("deliveryModel", e.target.value)}
              className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {DELIVERY_MODELS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Methodology">
            <select
              value={form.methodology}
              onChange={(e) => updateField("methodology", e.target.value)}
              className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {METHODOLOGIES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Rate Card">
            <select
              value={form.rateCardId}
              onChange={(e) => updateField("rateCardId", e.target.value)}
              className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">No rate card</option>
              {rateCards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.currency}){c.isDefault ? " - Default" : ""}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="flex justify-end gap-3 border-t border-neutral-100 pt-4">
          <Link
            href="/"
            className="rounded-md border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Estimate"}
          </button>
        </div>
      </form>
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-neutral-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
