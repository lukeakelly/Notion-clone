import { describe, it, expect } from "vitest";
import {
  calculateScopeItemEffort,
  calculateEstimate,
  calculateConfidence,
  estimateDuration,
  type ScopeItemInput,
  type EstimateSettings,
} from "./estimation";

function makeItem(overrides: Partial<ScopeItemInput> = {}): ScopeItemInput {
  return {
    category: "frontend",
    complexity: "medium",
    effortDriver: "screen",
    priority: "must",
    lowEffort: null,
    likelyEffort: null,
    highEffort: null,
    overridden: false,
    ...overrides,
  };
}

function makeSettings(overrides: Partial<EstimateSettings> = {}): EstimateSettings {
  return {
    requirementsClarity: "clear",
    designMaturity: "wireframes",
    integrationFamiliarity: "known",
    regulatoryComplexity: "standard",
    securityComplexity: "standard",
    performanceNeeds: "standard",
    techStackFamiliarity: "known",
    pmPercent: 12.5,
    baPercent: 15,
    archPercent: 10,
    qaPercent: 25,
    devopsPercent: 10,
    securityPercent: 7.5,
    docPercent: 7.5,
    contingencyPercent: 20,
    ...overrides,
  };
}

describe("calculateScopeItemEffort", () => {
  it("returns base effort for a simple screen with clear requirements", () => {
    const result = calculateScopeItemEffort(
      makeItem({ effortDriver: "screen", complexity: "low" }),
      makeSettings(),
    );
    expect(result.low).toBeGreaterThan(0);
    expect(result.likely).toBeGreaterThanOrEqual(result.low);
    expect(result.high).toBeGreaterThanOrEqual(result.likely);
  });

  it("applies complexity multipliers for poor requirements", () => {
    const clear = calculateScopeItemEffort(
      makeItem({ effortDriver: "api", complexity: "medium" }),
      makeSettings(),
    );
    const poor = calculateScopeItemEffort(
      makeItem({ effortDriver: "api", complexity: "medium" }),
      makeSettings({ requirementsClarity: "poor" }),
    );
    expect(poor.likely).toBeGreaterThan(clear.likely);
  });

  it("returns higher effort for higher complexity", () => {
    const low = calculateScopeItemEffort(
      makeItem({ effortDriver: "screen", complexity: "low" }),
      makeSettings(),
    );
    const high = calculateScopeItemEffort(
      makeItem({ effortDriver: "screen", complexity: "very_high" }),
      makeSettings(),
    );
    expect(high.likely).toBeGreaterThan(low.likely);
  });
});

describe("calculateEstimate", () => {
  it("calculates totals for a set of scope items", () => {
    const items = [
      makeItem({ effortDriver: "screen", complexity: "medium", category: "frontend" }),
      makeItem({ effortDriver: "api", complexity: "high", priority: "should", category: "backend" }),
    ];
    const result = calculateEstimate(items, makeSettings());
    expect(result.buildEffort.likely).toBeGreaterThan(0);
    expect(result.totalEffort.likely).toBeGreaterThan(result.buildEffort.likely);
    expect(result.overheads.length).toBeGreaterThan(0);
    expect(result.confidenceLevel).toBeDefined();
  });
});

describe("calculateConfidence", () => {
  it("returns high confidence for well-defined scope", () => {
    const items = [
      makeItem({ complexity: "low" }),
      makeItem({ complexity: "medium", priority: "should" }),
    ];
    const result = calculateConfidence(
      items,
      makeSettings({ designMaturity: "existing" }),
    );
    expect(result).toBe("high");
  });

  it("returns lower confidence for unclear requirements", () => {
    const items = [
      makeItem({ complexity: "very_high" }),
      makeItem({ complexity: "high" }),
      makeItem({ complexity: "high" }),
    ];
    const result = calculateConfidence(
      items,
      makeSettings({
        requirementsClarity: "poor",
        designMaturity: "none",
        integrationFamiliarity: "unknown",
        techStackFamiliarity: "new",
      }),
    );
    expect(["low", "very_low"]).toContain(result);
  });
});

describe("estimateDuration", () => {
  it("calculates weeks based on days and team size", () => {
    const result = estimateDuration(100, 4);
    expect(result.weeks).toBeGreaterThan(0);
    expect(result.lowWeeks).toBeLessThanOrEqual(result.weeks);
    expect(result.highWeeks).toBeGreaterThanOrEqual(result.weeks);
  });
});
