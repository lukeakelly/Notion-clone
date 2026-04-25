"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateEstimate } from "@/server/actions";

interface QuestionGroup {
  title: string;
  questions: Array<{
    id: string;
    question: string;
    type: "select" | "number" | "text";
    options?: string[];
  }>;
}

const QUESTIONNAIRE: QuestionGroup[] = [
  {
    title: "General",
    questions: [
      { id: "softwareType", question: "What type of software is being built?", type: "select", options: ["Web application", "Mobile app", "SaaS product", "Internal tool", "Integration platform", "Data dashboard", "AI application", "Other"] },
      { id: "projectStage", question: "Is this an MVP, enhancement, rebuild or enterprise-grade system?", type: "select", options: ["MVP", "Enhancement", "Rebuild", "Enterprise-grade", "Proof of concept"] },
      { id: "scopeClarity", question: "Is the scope fixed or still emerging?", type: "select", options: ["Fixed and documented", "Mostly defined", "Still emerging", "Very unclear"] },
      { id: "designsAvailable", question: "Are designs already available?", type: "select", options: ["Full Figma designs", "Wireframes only", "Rough sketches", "No designs"] },
      { id: "existingSystem", question: "Is there an existing system to integrate with or replace?", type: "select", options: ["No", "Yes - simple integration", "Yes - complex integration", "Yes - full replacement"] },
    ],
  },
  {
    title: "Front End",
    questions: [
      { id: "screenCount", question: "How many screens are required?", type: "number" },
      { id: "screenComplexity", question: "Are the screens simple, moderate or complex?", type: "select", options: ["Mostly simple", "Mix of simple and moderate", "Mostly moderate", "Mostly complex"] },
      { id: "mobileResponsive", question: "Is mobile responsiveness required?", type: "select", options: ["Desktop only", "Tablet responsive", "Fully mobile responsive", "Dedicated mobile app"] },
      { id: "designSystem", question: "Is a design system available?", type: "select", options: ["Existing design system", "Partial components", "No design system"] },
      { id: "accessibility", question: "Is accessibility compliance required?", type: "select", options: ["No", "WCAG 2.1 AA", "WCAG 2.1 AAA", "Government standard"] },
    ],
  },
  {
    title: "Back End",
    questions: [
      { id: "dataEntities", question: "How many data entities are required?", type: "number" },
      { id: "apiCount", question: "How many APIs are needed?", type: "number" },
      { id: "businessRules", question: "Are there complex business rules?", type: "select", options: ["Simple", "Moderate", "Complex", "Very complex"] },
      { id: "authRequired", question: "Is authentication required?", type: "select", options: ["No", "Basic login", "SSO", "MFA", "SSO + MFA + RBAC"] },
      { id: "rbacRequired", question: "Is role-based access required?", type: "select", options: ["No", "Basic roles", "Complex role hierarchy", "Attribute-based access control"] },
    ],
  },
  {
    title: "Integrations",
    questions: [
      { id: "integrationSystems", question: "What systems need to be integrated?", type: "text" },
      { id: "apisDocumented", question: "Are the APIs documented?", type: "select", options: ["Yes, well documented", "Partially documented", "No documentation", "Unknown"] },
      { id: "testEnvironments", question: "Are test environments available?", type: "select", options: ["Yes", "Partially", "No", "Unknown"] },
      { id: "integrationTiming", question: "Is the integration real-time or batch?", type: "select", options: ["Real-time", "Batch / scheduled", "Mix of both", "Not applicable"] },
      { id: "vendorsInvolved", question: "Are third-party vendors involved?", type: "select", options: ["No", "1 vendor", "2-3 vendors", "4+ vendors"] },
    ],
  },
  {
    title: "Delivery",
    questions: [
      { id: "goLiveDate", question: "What is the desired go-live date?", type: "text" },
      { id: "teamKnown", question: "Is the delivery team already known?", type: "select", options: ["Yes", "Partially", "No"] },
      { id: "uatIncluded", question: "Is UAT included?", type: "select", options: ["Yes, 1 round", "Yes, 2 rounds", "Yes, 3+ rounds", "No"] },
      { id: "productionSupport", question: "Is production support required?", type: "select", options: ["No", "1 month", "3 months", "6+ months"] },
      { id: "complianceReview", question: "Are there security or compliance reviews?", type: "select", options: ["No", "Standard security review", "Full compliance audit", "Government security clearance"] },
    ],
  },
];

export function QuestionnairePanel({
  estimateId,
  data,
}: {
  estimateId: string;
  data: unknown;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string | number>>(() => {
    if (data && typeof data === "object") return data as Record<string, string | number>;
    return {};
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (id: string, value: string | number) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateEstimate(estimateId, { questionnaireData: answers });
      toast.success("Questionnaire saved");
      router.refresh();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const totalQuestions = QUESTIONNAIRE.reduce((s, g) => s + g.questions.length, 0);
  const answeredCount = Object.keys(answers).filter((k) => answers[k] !== "" && answers[k] !== undefined).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-neutral-700">Guided Questionnaire</h3>
          <p className="text-xs text-neutral-500">
            {answeredCount} of {totalQuestions} questions answered
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Responses"}
        </button>
      </div>

      {QUESTIONNAIRE.map((group) => (
        <div key={group.title} className="rounded-lg border border-neutral-200 bg-white p-6">
          <h4 className="mb-4 text-sm font-semibold">{group.title}</h4>
          <div className="space-y-4">
            {group.questions.map((q) => (
              <div key={q.id}>
                <label className="mb-1 block text-sm text-neutral-700">{q.question}</label>
                {q.type === "select" && q.options && (
                  <select
                    value={answers[q.id] as string ?? ""}
                    onChange={(e) => handleChange(q.id, e.target.value)}
                    className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select...</option>
                    {q.options.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                )}
                {q.type === "number" && (
                  <input
                    type="number"
                    value={answers[q.id] as number ?? ""}
                    onChange={(e) => handleChange(q.id, e.target.value ? Number(e.target.value) : "")}
                    className="w-40 rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    min={0}
                  />
                )}
                {q.type === "text" && (
                  <input
                    type="text"
                    value={answers[q.id] as string ?? ""}
                    onChange={(e) => handleChange(q.id, e.target.value)}
                    className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
