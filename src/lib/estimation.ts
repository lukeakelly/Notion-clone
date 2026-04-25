// Estimation calculation engine
// Implements rule-based estimation with complexity multipliers and delivery overheads

interface ScopeItemInput {
  category: string;
  complexity: string;
  effortDriver: string | null;
  priority: string;
  lowEffort: number | null;
  likelyEffort: number | null;
  highEffort: number | null;
  overridden: boolean;
}

interface EstimateSettings {
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
}

// Base effort ranges in days: [low, likely, high]
const BASE_EFFORT: Record<string, Record<string, [number, number, number]>> = {
  screen: {
    low: [0.5, 1, 2],
    medium: [1, 2, 3],
    high: [2, 3.5, 5],
    very_high: [3, 5, 8],
  },
  api: {
    low: [0.5, 1, 2],
    medium: [1, 2, 3],
    high: [2, 3.5, 5],
    very_high: [3, 5, 10],
  },
  workflow: {
    low: [1, 2, 3],
    medium: [2, 4, 6],
    high: [4, 7, 12],
    very_high: [8, 12, 20],
  },
  integration: {
    low: [2, 4, 7],
    medium: [4, 7, 12],
    high: [8, 14, 20],
    very_high: [12, 20, 40],
  },
  report: {
    low: [1, 1.5, 2],
    medium: [1.5, 3, 5],
    high: [3, 5, 8],
    very_high: [5, 8, 12],
  },
  data_model: {
    low: [0.5, 1, 2],
    medium: [1, 2, 4],
    high: [2, 4, 7],
    very_high: [4, 7, 12],
  },
  ai_capability: {
    low: [2, 4, 6],
    medium: [4, 8, 12],
    high: [8, 15, 25],
    very_high: [15, 25, 40],
  },
  component: {
    low: [0.5, 1, 1.5],
    medium: [1, 2, 3],
    high: [2, 3.5, 5],
    very_high: [3, 5, 8],
  },
  migration: {
    low: [2, 3, 5],
    medium: [3, 6, 10],
    high: [6, 10, 18],
    very_high: [10, 18, 30],
  },
};

// Complexity multipliers for various factors
const COMPLEXITY_MULTIPLIERS: Record<string, Record<string, number>> = {
  requirementsClarity: {
    clear: 1.0,
    partial: 1.2,
    poor: 1.5,
  },
  designMaturity: {
    existing: 0.8,
    wireframes: 1.0,
    none: 1.3,
  },
  integrationFamiliarity: {
    known: 1.0,
    partial: 1.2,
    unknown: 1.5,
  },
  regulatoryComplexity: {
    standard: 1.0,
    regulated: 1.3,
    highly_regulated: 1.5,
  },
  securityComplexity: {
    standard: 1.0,
    elevated: 1.2,
    complex: 1.4,
  },
  performanceNeeds: {
    standard: 1.0,
    high: 1.2,
    critical: 1.3,
  },
  techStackFamiliarity: {
    known: 1.0,
    partial: 1.2,
    new: 1.4,
  },
};

export function getBaseEffort(
  effortDriver: string | null,
  complexity: string,
): [number, number, number] {
  const driver = effortDriver || "component";
  const driverEffort = BASE_EFFORT[driver];
  if (!driverEffort) return [1, 2, 3];
  return driverEffort[complexity] || driverEffort["medium"] || [1, 2, 3];
}

export function getComplexityMultiplier(settings: EstimateSettings): number {
  let multiplier = 1.0;
  for (const [key, values] of Object.entries(COMPLEXITY_MULTIPLIERS)) {
    const setting = settings[key as keyof EstimateSettings] as string;
    const m = values[setting];
    if (m !== undefined) {
      multiplier *= m;
    }
  }
  return Math.round(multiplier * 100) / 100;
}

export function calculateScopeItemEffort(
  item: ScopeItemInput,
  settings: EstimateSettings,
): { low: number; likely: number; high: number } {
  if (item.overridden && item.lowEffort != null && item.likelyEffort != null && item.highEffort != null) {
    return { low: item.lowEffort, likely: item.likelyEffort, high: item.highEffort };
  }

  const [baseLow, baseLikely, baseHigh] = getBaseEffort(item.effortDriver, item.complexity);
  const multiplier = getComplexityMultiplier(settings);

  return {
    low: Math.round(baseLow * multiplier * 10) / 10,
    likely: Math.round(baseLikely * multiplier * 10) / 10,
    high: Math.round(baseHigh * multiplier * 10) / 10,
  };
}

export interface OverheadBreakdown {
  label: string;
  percent: number;
  lowDays: number;
  likelyDays: number;
  highDays: number;
}

export interface EstimateCalculation {
  buildEffort: { low: number; likely: number; high: number };
  overheads: OverheadBreakdown[];
  totalEffort: { low: number; likely: number; high: number };
  complexityMultiplier: number;
  confidenceLevel: string;
}

export function calculateEstimate(
  scopeItems: ScopeItemInput[],
  settings: EstimateSettings,
): EstimateCalculation {
  // Only include items that are must/should/could (exclude won't)
  const activeItems = scopeItems.filter((i) => i.priority !== "wont");

  let buildLow = 0;
  let buildLikely = 0;
  let buildHigh = 0;

  for (const item of activeItems) {
    const effort = calculateScopeItemEffort(item, settings);
    buildLow += effort.low;
    buildLikely += effort.likely;
    buildHigh += effort.high;
  }

  const overheads: OverheadBreakdown[] = [
    { label: "Project Management", percent: settings.pmPercent, lowDays: 0, likelyDays: 0, highDays: 0 },
    { label: "Business Analysis", percent: settings.baPercent, lowDays: 0, likelyDays: 0, highDays: 0 },
    { label: "Solution Architecture", percent: settings.archPercent, lowDays: 0, likelyDays: 0, highDays: 0 },
    { label: "QA / Testing", percent: settings.qaPercent, lowDays: 0, likelyDays: 0, highDays: 0 },
    { label: "DevOps", percent: settings.devopsPercent, lowDays: 0, likelyDays: 0, highDays: 0 },
    { label: "Security Review", percent: settings.securityPercent, lowDays: 0, likelyDays: 0, highDays: 0 },
    { label: "Documentation", percent: settings.docPercent, lowDays: 0, likelyDays: 0, highDays: 0 },
    { label: "Contingency", percent: settings.contingencyPercent, lowDays: 0, likelyDays: 0, highDays: 0 },
  ];

  for (const o of overheads) {
    o.lowDays = Math.round(buildLow * (o.percent / 100) * 10) / 10;
    o.likelyDays = Math.round(buildLikely * (o.percent / 100) * 10) / 10;
    o.highDays = Math.round(buildHigh * (o.percent / 100) * 10) / 10;
  }

  const totalOverheadLow = overheads.reduce((s, o) => s + o.lowDays, 0);
  const totalOverheadLikely = overheads.reduce((s, o) => s + o.likelyDays, 0);
  const totalOverheadHigh = overheads.reduce((s, o) => s + o.highDays, 0);

  const totalEffort = {
    low: Math.round((buildLow + totalOverheadLow) * 10) / 10,
    likely: Math.round((buildLikely + totalOverheadLikely) * 10) / 10,
    high: Math.round((buildHigh + totalOverheadHigh) * 10) / 10,
  };

  return {
    buildEffort: {
      low: Math.round(buildLow * 10) / 10,
      likely: Math.round(buildLikely * 10) / 10,
      high: Math.round(buildHigh * 10) / 10,
    },
    overheads,
    totalEffort,
    complexityMultiplier: getComplexityMultiplier(settings),
    confidenceLevel: calculateConfidence(scopeItems, settings),
  };
}

export function calculateConfidence(
  scopeItems: ScopeItemInput[],
  settings: EstimateSettings,
): string {
  let score = 100;

  // Requirements clarity
  if (settings.requirementsClarity === "partial") score -= 15;
  if (settings.requirementsClarity === "poor") score -= 30;

  // Design maturity
  if (settings.designMaturity === "wireframes") score -= 5;
  if (settings.designMaturity === "none") score -= 15;

  // Integration familiarity
  if (settings.integrationFamiliarity === "partial") score -= 10;
  if (settings.integrationFamiliarity === "unknown") score -= 20;

  // Tech stack
  if (settings.techStackFamiliarity === "partial") score -= 10;
  if (settings.techStackFamiliarity === "new") score -= 20;

  // Scope size affects confidence
  const itemCount = scopeItems.length;
  if (itemCount > 30) score -= 10;
  if (itemCount > 50) score -= 10;

  // Proportion of high/very_high complexity items
  const highComplexity = scopeItems.filter(
    (i) => i.complexity === "high" || i.complexity === "very_high",
  ).length;
  if (highComplexity / Math.max(itemCount, 1) > 0.5) score -= 15;

  if (score >= 75) return "high";
  if (score >= 50) return "medium";
  if (score >= 25) return "low";
  return "very_low";
}

export interface RoleAllocation {
  role: string;
  days: number;
  phase: string;
  workstream: string;
}

export function allocateRoles(
  calculation: EstimateCalculation,
  scopeItems: ScopeItemInput[],
): RoleAllocation[] {
  const allocations: RoleAllocation[] = [];
  const likely = calculation.buildEffort.likely;

  // Calculate category distribution
  const categoryDays: Record<string, number> = {};
  for (const item of scopeItems.filter((i) => i.priority !== "wont")) {
    const cat = item.category;
    const effort = item.likelyEffort ?? 2;
    categoryDays[cat] = (categoryDays[cat] || 0) + effort;
  }

  // Allocate build roles based on categories
  if (categoryDays["frontend"] || categoryDays["design"]) {
    const feDays = (categoryDays["frontend"] || 0) + (categoryDays["design"] || 0) * 0.3;
    if (feDays > 0) allocations.push({ role: "Front End Developer", days: Math.round(feDays * 10) / 10, phase: "build", workstream: "Front End" });
    const designDays = (categoryDays["design"] || 0) * 0.7;
    if (designDays > 0) allocations.push({ role: "UX Designer", days: Math.round(designDays * 10) / 10, phase: "design", workstream: "Design" });
  }

  if (categoryDays["backend"]) {
    allocations.push({ role: "Back End Developer", days: Math.round(categoryDays["backend"] * 10) / 10, phase: "build", workstream: "Back End" });
  }

  if (categoryDays["integration"]) {
    allocations.push({ role: "Back End Developer", days: Math.round(categoryDays["integration"] * 10) / 10, phase: "build", workstream: "Integration" });
  }

  if (categoryDays["ai"]) {
    allocations.push({ role: "AI Engineer", days: Math.round(categoryDays["ai"] * 10) / 10, phase: "build", workstream: "AI / ML" });
  }

  if (categoryDays["data"]) {
    allocations.push({ role: "Data Engineer", days: Math.round(categoryDays["data"] * 10) / 10, phase: "build", workstream: "Data" });
  }

  // Overheads
  for (const oh of calculation.overheads) {
    if (oh.likelyDays <= 0) continue;
    let role = "Project Manager";
    let phase = "build";
    const workstream = oh.label;
    if (oh.label === "Business Analysis") { role = "Business Analyst"; phase = "discovery"; }
    if (oh.label === "Solution Architecture") { role = "Solution Architect"; phase = "design"; }
    if (oh.label === "QA / Testing") { role = "QA Analyst"; phase = "test"; }
    if (oh.label === "DevOps") { role = "DevOps Engineer"; phase = "build"; }
    if (oh.label === "Security Review") { role = "Security Specialist"; phase = "build"; }
    if (oh.label === "Documentation") { role = "Technical Writer"; phase = "release"; }
    if (oh.label === "Contingency") continue; // Don't assign contingency to a role
    allocations.push({ role, days: oh.likelyDays, phase, workstream });
  }

  // Engagement lead (5% of total)
  const engLeadDays = Math.round(likely * 0.05 * 10) / 10;
  if (engLeadDays > 0) {
    allocations.push({ role: "Engagement Lead", days: engLeadDays, phase: "build", workstream: "Leadership" });
  }

  return allocations;
}

export function estimateDuration(totalLikelyDays: number, teamSize: number = 4): { weeks: number; lowWeeks: number; highWeeks: number } {
  const effectiveDaysPerWeek = 5;
  const baseWeeks = totalLikelyDays / (teamSize * effectiveDaysPerWeek);
  return {
    weeks: Math.ceil(baseWeeks),
    lowWeeks: Math.ceil(baseWeeks * 0.85),
    highWeeks: Math.ceil(baseWeeks * 1.3),
  };
}

export const DEFAULT_COMMON_RISKS = [
  { description: "Requirements are incomplete or still emerging", impact: "high", likelihood: "medium" },
  { description: "Integration APIs are undocumented or unavailable", impact: "high", likelihood: "medium" },
  { description: "No test environment available for integrations", impact: "medium", likelihood: "medium" },
  { description: "Security or compliance approval may delay timeline", impact: "medium", likelihood: "low" },
  { description: "Client SME availability may be limited", impact: "medium", likelihood: "medium" },
  { description: "Data quality issues may impact migration and testing", impact: "high", likelihood: "medium" },
  { description: "Third-party vendor dependency may affect schedule", impact: "medium", likelihood: "medium" },
  { description: "Scope creep beyond agreed requirements", impact: "high", likelihood: "high" },
];

export const DEFAULT_ASSUMPTIONS = [
  "Client will provide timely access to systems, APIs and subject matter experts.",
  "Existing APIs are available and documented.",
  "UX designs will be approved before build phase starts.",
  "Estimate excludes major scope changes after approval.",
  "Estimate excludes production support unless explicitly selected.",
  "Estimate assumes standard business-hours delivery.",
  "Estimate assumes one round of UAT defect remediation.",
  "Client will provide timely feedback on deliverables (within 3 business days).",
  "Production deployment includes one environment only.",
];
