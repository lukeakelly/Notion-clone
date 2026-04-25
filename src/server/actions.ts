"use server";

import { prisma } from "./db";
import { auth } from "./auth";
import { revalidatePath } from "next/cache";
import {
  calculateEstimate,
  calculateScopeItemEffort,
  allocateRoles,
} from "@/lib/estimation";

const DEFAULT_EMAIL = "estimator@estimation-tool.local";

async function requireUser() {
  const session = await auth();
  if (session?.user?.id) return session.user;

  // Fall back to default user for anonymous / demo access
  const user = await prisma.user.upsert({
    where: { email: DEFAULT_EMAIL },
    update: {},
    create: { email: DEFAULT_EMAIL, name: "estimator", role: "editor" },
  });
  return { id: user.id, name: user.name, email: user.email, image: user.image };
}

// ---- Estimates ----

export async function getEstimates() {
  const user = await requireUser();
  return prisma.estimate.findMany({
    where: { createdById: user.id },
    include: { _count: { select: { scopeItems: true, risks: true } }, rateCard: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getEstimate(id: string) {
  const user = await requireUser();
  return prisma.estimate.findFirst({
    where: { id, createdById: user.id },
    include: {
      scopeItems: { orderBy: { sortOrder: "asc" } },
      roleEstimates: true,
      risks: { orderBy: { createdAt: "asc" } },
      assumptions: { orderBy: { createdAt: "asc" } },
      versions: { orderBy: { version: "desc" }, take: 20 },
      rateCard: { include: { roles: true } },
    },
  });
}

export async function createEstimate(data: {
  projectName: string;
  clientName: string;
  industry?: string;
  projectType: string;
  estimateType: string;
  currency?: string;
  targetDate?: string;
  deliveryModel?: string;
  methodology?: string;
  rateCardId?: string;
}) {
  const user = await requireUser();
  const estimate = await prisma.estimate.create({
    data: {
      projectName: data.projectName,
      clientName: data.clientName,
      industry: data.industry || null,
      projectType: data.projectType,
      estimateType: data.estimateType,
      currency: data.currency || "AUD",
      targetDate: data.targetDate ? new Date(data.targetDate) : null,
      deliveryModel: data.deliveryModel || null,
      methodology: data.methodology || "agile",
      rateCardId: data.rateCardId || null,
      createdById: user.id,
    },
  });
  revalidatePath("/");
  revalidatePath("/estimates");
  return estimate;
}

export async function updateEstimate(
  id: string,
  data: Record<string, unknown>,
) {
  const user = await requireUser();
  const existing = await prisma.estimate.findFirst({
    where: { id, createdById: user.id },
  });
  if (!existing) throw new Error("Estimate not found");

  // Clean data - remove undefined values and handle dates
  const cleanData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (key === "targetDate" && typeof value === "string") {
      cleanData[key] = value ? new Date(value) : null;
    } else {
      cleanData[key] = value;
    }
  }

  const estimate = await prisma.estimate.update({
    where: { id },
    data: cleanData,
  });
  revalidatePath(`/estimates/${id}`);
  revalidatePath("/");
  return estimate;
}

export async function deleteEstimate(id: string) {
  const user = await requireUser();
  await prisma.estimate.deleteMany({ where: { id, createdById: user.id } });
  revalidatePath("/");
  revalidatePath("/estimates");
}

export async function duplicateEstimate(id: string) {
  const user = await requireUser();
  const source = await prisma.estimate.findFirst({
    where: { id, createdById: user.id },
    include: {
      scopeItems: true,
      risks: true,
      assumptions: true,
    },
  });
  if (!source) throw new Error("Estimate not found");

  const newEstimate = await prisma.estimate.create({
    data: {
      projectName: `${source.projectName} (Copy)`,
      clientName: source.clientName,
      industry: source.industry,
      projectType: source.projectType,
      estimateType: source.estimateType,
      currency: source.currency,
      targetDate: source.targetDate,
      deliveryModel: source.deliveryModel,
      methodology: source.methodology,
      requirementsClarity: source.requirementsClarity,
      designMaturity: source.designMaturity,
      integrationFamiliarity: source.integrationFamiliarity,
      regulatoryComplexity: source.regulatoryComplexity,
      securityComplexity: source.securityComplexity,
      performanceNeeds: source.performanceNeeds,
      techStackFamiliarity: source.techStackFamiliarity,
      pmPercent: source.pmPercent,
      baPercent: source.baPercent,
      archPercent: source.archPercent,
      qaPercent: source.qaPercent,
      devopsPercent: source.devopsPercent,
      securityPercent: source.securityPercent,
      docPercent: source.docPercent,
      contingencyPercent: source.contingencyPercent,
      includesFrontEnd: source.includesFrontEnd,
      includesBackEnd: source.includesBackEnd,
      includesFullStack: source.includesFullStack,
      includesApiIntegration: source.includesApiIntegration,
      includesDataLayer: source.includesDataLayer,
      includesAuth: source.includesAuth,
      includesAdminConsole: source.includesAdminConsole,
      includesReporting: source.includesReporting,
      includesWorkflowEngine: source.includesWorkflowEngine,
      includesAiCapability: source.includesAiCapability,
      includesThirdParty: source.includesThirdParty,
      includesDevOps: source.includesDevOps,
      includesMaintenance: source.includesMaintenance,
      questionnaireData: source.questionnaireData ?? undefined,
      rateCardId: source.rateCardId,
      createdById: user.id,
      scopeItems: {
        create: source.scopeItems.map((si) => ({
          name: si.name,
          description: si.description,
          category: si.category,
          priority: si.priority,
          complexity: si.complexity,
          effortDriver: si.effortDriver,
          lowEffort: si.lowEffort,
          likelyEffort: si.likelyEffort,
          highEffort: si.highEffort,
          assumptions: si.assumptions,
          exclusions: si.exclusions,
          risks: si.risks,
          confidence: si.confidence,
          overridden: si.overridden,
          overrideNote: si.overrideNote,
          sortOrder: si.sortOrder,
        })),
      },
      risks: {
        create: source.risks.map((r) => ({
          description: r.description,
          impact: r.impact,
          likelihood: r.likelihood,
          mitigation: r.mitigation,
          owner: r.owner,
        })),
      },
      assumptions: {
        create: source.assumptions.map((a) => ({
          description: a.description,
          relatedScopeItem: a.relatedScopeItem,
          status: a.status,
        })),
      },
    },
  });
  revalidatePath("/");
  return newEstimate;
}

// ---- Scope Items ----

export async function addScopeItem(
  estimateId: string,
  data: {
    name: string;
    description?: string;
    category: string;
    priority?: string;
    complexity?: string;
    effortDriver?: string;
  },
) {
  await requireUser();
  const maxOrder = await prisma.scopeItem.aggregate({
    where: { estimateId },
    _max: { sortOrder: true },
  });

  const item = await prisma.scopeItem.create({
    data: {
      estimateId,
      name: data.name,
      description: data.description || null,
      category: data.category,
      priority: data.priority || "must",
      complexity: data.complexity || "medium",
      effortDriver: data.effortDriver || null,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });
  revalidatePath(`/estimates/${estimateId}`);
  return item;
}

export async function updateScopeItem(
  id: string,
  data: Record<string, unknown>,
) {
  await requireUser();
  const item = await prisma.scopeItem.update({
    where: { id },
    data,
  });
  revalidatePath(`/estimates/${item.estimateId}`);
  return item;
}

export async function deleteScopeItem(id: string) {
  await requireUser();
  const item = await prisma.scopeItem.delete({ where: { id } });
  revalidatePath(`/estimates/${item.estimateId}`);
}

// ---- Risks ----

export async function addRisk(
  estimateId: string,
  data: { description: string; impact?: string; likelihood?: string; mitigation?: string },
) {
  await requireUser();
  const risk = await prisma.risk.create({
    data: {
      estimateId,
      description: data.description,
      impact: data.impact || "medium",
      likelihood: data.likelihood || "medium",
      mitigation: data.mitigation || null,
    },
  });
  revalidatePath(`/estimates/${estimateId}`);
  return risk;
}

export async function updateRisk(id: string, data: Record<string, unknown>) {
  await requireUser();
  const risk = await prisma.risk.update({ where: { id }, data });
  revalidatePath(`/estimates/${risk.estimateId}`);
  return risk;
}

export async function deleteRisk(id: string) {
  await requireUser();
  const risk = await prisma.risk.delete({ where: { id } });
  revalidatePath(`/estimates/${risk.estimateId}`);
}

// ---- Assumptions ----

export async function addAssumption(
  estimateId: string,
  data: { description: string; relatedScopeItem?: string },
) {
  await requireUser();
  const assumption = await prisma.assumption.create({
    data: {
      estimateId,
      description: data.description,
      relatedScopeItem: data.relatedScopeItem || null,
    },
  });
  revalidatePath(`/estimates/${estimateId}`);
  return assumption;
}

export async function updateAssumption(id: string, data: Record<string, unknown>) {
  await requireUser();
  const assumption = await prisma.assumption.update({ where: { id }, data });
  revalidatePath(`/estimates/${assumption.estimateId}`);
  return assumption;
}

export async function deleteAssumption(id: string) {
  await requireUser();
  const assumption = await prisma.assumption.delete({ where: { id } });
  revalidatePath(`/estimates/${assumption.estimateId}`);
}

// ---- Bulk Import (AI extraction) ----

export async function bulkImportFromAI(
  estimateId: string,
  data: {
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
  },
) {
  await requireUser();

  const maxOrder = await prisma.scopeItem.aggregate({
    where: { estimateId },
    _max: { sortOrder: true },
  });
  let nextOrder = (maxOrder._max.sortOrder ?? -1) + 1;

  const scopeCreates = data.scopeItems.map((item) => {
    const order = nextOrder++;
    return prisma.scopeItem.create({
      data: {
        estimateId,
        name: item.name,
        description: item.description || null,
        category: item.category,
        priority: item.priority || "must",
        complexity: item.complexity || "medium",
        effortDriver: item.effortDriver || null,
        sortOrder: order,
      },
    });
  });

  const riskCreates = data.risks.map((r) =>
    prisma.risk.create({
      data: {
        estimateId,
        description: r.description,
        impact: r.impact || "medium",
        likelihood: r.likelihood || "medium",
        mitigation: r.mitigation || null,
      },
    }),
  );

  const assumptionCreates = data.assumptions.map((a) =>
    prisma.assumption.create({
      data: {
        estimateId,
        description: a.description,
      },
    }),
  );

  await prisma.$transaction([...scopeCreates, ...riskCreates, ...assumptionCreates]);

  revalidatePath(`/estimates/${estimateId}`);
  return {
    scopeItemsAdded: data.scopeItems.length,
    risksAdded: data.risks.length,
    assumptionsAdded: data.assumptions.length,
  };
}

// ---- Rate Cards ----

export async function getRateCards() {
  await requireUser();
  return prisma.rateCard.findMany({
    include: { roles: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getRateCard(id: string) {
  await requireUser();
  return prisma.rateCard.findUnique({
    where: { id },
    include: { roles: true },
  });
}

export async function createRateCard(data: {
  name: string;
  description?: string;
  currency?: string;
  isDefault?: boolean;
  roles: Array<{
    role: string;
    standardRate: number;
    costRate?: number;
    margin?: number;
    location?: string;
    seniority?: string;
  }>;
}) {
  await requireUser();

  if (data.isDefault) {
    await prisma.rateCard.updateMany({ data: { isDefault: false } });
  }

  const rateCard = await prisma.rateCard.create({
    data: {
      name: data.name,
      description: data.description || null,
      currency: data.currency || "AUD",
      isDefault: data.isDefault ?? false,
      roles: {
        create: data.roles,
      },
    },
    include: { roles: true },
  });
  revalidatePath("/rate-cards");
  return rateCard;
}

export async function updateRateCard(
  id: string,
  data: {
    name?: string;
    description?: string;
    currency?: string;
    isDefault?: boolean;
    roles?: Array<{
      id?: string;
      role: string;
      standardRate: number;
      costRate?: number;
      margin?: number;
      location?: string;
      seniority?: string;
    }>;
  },
) {
  await requireUser();

  if (data.isDefault) {
    await prisma.rateCard.updateMany({
      where: { id: { not: id } },
      data: { isDefault: false },
    });
  }

  if (data.roles) {
    await prisma.rateCardRole.deleteMany({ where: { rateCardId: id } });
    await prisma.rateCardRole.createMany({
      data: data.roles.map((r) => ({
        rateCardId: id,
        role: r.role,
        standardRate: r.standardRate,
        costRate: r.costRate ?? null,
        margin: r.margin ?? null,
        location: r.location ?? null,
        seniority: r.seniority ?? null,
      })),
    });
  }

  const rateCard = await prisma.rateCard.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      currency: data.currency,
      isDefault: data.isDefault,
    },
    include: { roles: true },
  });
  revalidatePath("/rate-cards");
  return rateCard;
}

export async function deleteRateCard(id: string) {
  await requireUser();
  await prisma.rateCard.delete({ where: { id } });
  revalidatePath("/rate-cards");
}

// ---- Recalculate Estimate ----

export async function recalculateEstimate(id: string) {
  const user = await requireUser();
  const estimate = await prisma.estimate.findFirst({
    where: { id, createdById: user.id },
    include: {
      scopeItems: true,
      rateCard: { include: { roles: true } },
    },
  });
  if (!estimate) throw new Error("Estimate not found");

  const settings = {
    requirementsClarity: estimate.requirementsClarity,
    designMaturity: estimate.designMaturity,
    integrationFamiliarity: estimate.integrationFamiliarity,
    regulatoryComplexity: estimate.regulatoryComplexity,
    securityComplexity: estimate.securityComplexity,
    performanceNeeds: estimate.performanceNeeds,
    techStackFamiliarity: estimate.techStackFamiliarity,
    pmPercent: estimate.pmPercent,
    baPercent: estimate.baPercent,
    archPercent: estimate.archPercent,
    qaPercent: estimate.qaPercent,
    devopsPercent: estimate.devopsPercent,
    securityPercent: estimate.securityPercent,
    docPercent: estimate.docPercent,
    contingencyPercent: estimate.contingencyPercent,
  };

  // Update scope item efforts
  for (const item of estimate.scopeItems) {
    if (!item.overridden) {
      const effort = calculateScopeItemEffort(item, settings);
      await prisma.scopeItem.update({
        where: { id: item.id },
        data: {
          lowEffort: effort.low,
          likelyEffort: effort.likely,
          highEffort: effort.high,
        },
      });
    }
  }

  // Recalculate totals
  const updatedItems = await prisma.scopeItem.findMany({
    where: { estimateId: id },
  });

  const calculation = calculateEstimate(updatedItems, settings);

  // Get rate for cost calculation
  const defaultRate = 1400; // AUD per day default
  const rateMap: Record<string, number> = {};
  if (estimate.rateCard?.roles) {
    for (const role of estimate.rateCard.roles) {
      rateMap[role.role] = role.standardRate;
    }
  }

  const avgRate =
    estimate.rateCard?.roles && estimate.rateCard.roles.length > 0
      ? estimate.rateCard.roles.reduce((s, r) => s + r.standardRate, 0) / estimate.rateCard.roles.length
      : defaultRate;

  // Generate role estimates
  await prisma.roleEstimate.deleteMany({ where: { estimateId: id } });
  const roleAllocations = allocateRoles(calculation, updatedItems);
  const roleEstimateData: Array<{ estimateId: string; role: string; days: number; rate: number; cost: number; phase: string; workstream: string }> = [];

  for (const alloc of roleAllocations) {
    const rate = rateMap[alloc.role] || avgRate;
    roleEstimateData.push({
      estimateId: id,
      role: alloc.role,
      days: alloc.days,
      rate,
      cost: Math.round(alloc.days * rate),
      phase: alloc.phase,
      workstream: alloc.workstream,
    });
  }

  if (roleEstimateData.length > 0) {
    await prisma.roleEstimate.createMany({ data: roleEstimateData });
  }

  // Update estimate totals
  await prisma.estimate.update({
    where: { id },
    data: {
      totalLowDays: calculation.totalEffort.low,
      totalLikelyDays: calculation.totalEffort.likely,
      totalHighDays: calculation.totalEffort.high,
      totalLowCost: Math.round(calculation.totalEffort.low * avgRate),
      totalLikelyCost: Math.round(calculation.totalEffort.likely * avgRate),
      totalHighCost: Math.round(calculation.totalEffort.high * avgRate),
      confidenceLevel: calculation.confidenceLevel,
    },
  });

  revalidatePath(`/estimates/${id}`);
  return calculation;
}

// ---- Versioning ----

export async function saveVersion(id: string, changeNote?: string) {
  const user = await requireUser();
  const estimate = await prisma.estimate.findFirst({
    where: { id, createdById: user.id },
    include: {
      scopeItems: true,
      roleEstimates: true,
      risks: true,
      assumptions: true,
    },
  });
  if (!estimate) throw new Error("Estimate not found");

  const snapshot = JSON.parse(JSON.stringify(estimate));
  const newVersion = estimate.version + 1;

  await prisma.estimateVersion.create({
    data: {
      estimateId: id,
      version: estimate.version,
      snapshot,
      changeNote: changeNote || null,
    },
  });

  await prisma.estimate.update({
    where: { id },
    data: { version: newVersion },
  });

  revalidatePath(`/estimates/${id}`);
  return newVersion;
}

// ---- Dashboard Stats ----

export async function getDashboardStats() {
  const user = await requireUser();
  const where = { createdById: user.id };

  const [total, drafts, inReview, approved, estimates] = await Promise.all([
    prisma.estimate.count({ where }),
    prisma.estimate.count({ where: { ...where, status: "draft" } }),
    prisma.estimate.count({ where: { ...where, status: "ready_for_review" } }),
    prisma.estimate.count({ where: { ...where, status: "approved" } }),
    prisma.estimate.findMany({
      where,
      select: {
        totalLikelyCost: true,
        status: true,
        confidenceLevel: true,
      },
    }),
  ]);

  const pipelineValue = estimates.reduce((sum, e) => sum + (e.totalLikelyCost || 0), 0);

  const confidenceDistribution = {
    high: estimates.filter((e) => e.confidenceLevel === "high").length,
    medium: estimates.filter((e) => e.confidenceLevel === "medium").length,
    low: estimates.filter((e) => e.confidenceLevel === "low").length,
    very_low: estimates.filter((e) => e.confidenceLevel === "very_low").length,
  };

  return {
    total,
    drafts,
    inReview,
    approved,
    pipelineValue,
    confidenceDistribution,
  };
}

// ---- Update estimate status ----

export async function updateEstimateStatus(id: string, status: string) {
  const user = await requireUser();
  await prisma.estimate.updateMany({
    where: { id, createdById: user.id },
    data: { status },
  });
  revalidatePath(`/estimates/${id}`);
  revalidatePath("/");
}
