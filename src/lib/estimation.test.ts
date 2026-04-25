import { describe, it, expect } from "vitest";
import {
  calculateScopeItemEffort,
  calculateEstimate,
  calculateConfidence,
  estimateDuration,
} from "./estimation";

describe("calculateScopeItemEffort", () => {
  it("returns base effort for a simple screen with clear requirements", () => {
    const result = calculateScopeItemEffort(
      { effortDriver: "screen", complexity: "low", priority: "must" },
      { requirementsClarity: "clear", designMaturity: "wireframes", integrationFamiliarity: "known", regulatoryComplexity: "standard", securityComplexity: "standard", performanceNeeds: "standard", techStackFamiliarity: "known" },
    );
    expect(result.low).toBeGreaterThan(0);
    expect(result.likely).toBeGreaterThanOrEqual(result.low);
    expect(result.high).toBeGreaterThanOrEqual(result.likely);
  });

  it("applies complexity multipliers for poor requirements", () => {
    const clear = calculateScopeItemEffort(
      { effortDriver: "api", complexity: "medium", priority: "must" },
      { requirementsClarity: "clear", designMaturity: "wireframes", integrationFamiliarity: "known", regulatoryComplexity: "standard", securityComplexity: "standard", performanceNeeds: "standard", techStackFamiliarity: "known" },
    );
    const poor = calculateScopeItemEffort(
      { effortDriver: "api", complexity: "medium", priority: "must" },
      { requirementsClarity: "poor", designMaturity: "wireframes", integrationFamiliarity: "known", regulatoryComplexity: "standard", securityComplexity: "standard", performanceNeeds: "standard", techStackFamiliarity: "known" },
    );
    expect(poor.likely).toBeGreaterThan(clear.likely);
  });

  it("returns higher effort for higher complexity", () => {
    const low = calculateScopeItemEffort(
      { effortDriver: "screen", complexity: "low", priority: "must" },
      { requirementsClarity: "clear", designMaturity: "wireframes", integrationFamiliarity: "known", regulatoryComplexity: "standard", securityComplexity: "standard", performanceNeeds: "standard", techStackFamiliarity: "known" },
    );
    const high = calculateScopeItemEffort(
      { effortDriver: "screen", complexity: "very_high", priority: "must" },
      { requirementsClarity: "clear", designMaturity: "wireframes", integrationFamiliarity: "known", regulatoryComplexity: "standard", securityComplexity: "standard", performanceNeeds: "standard", techStackFamiliarity: "known" },
    );
    expect(high.likely).toBeGreaterThan(low.likely);
  });
});

describe("calculateEstimate", () => {
  it("calculates totals for a set of scope items", () => {
    const items = [
      { effortDriver: "screen", complexity: "medium", priority: "must", category: "frontend" },
      { effortDriver: "api", complexity: "high", priority: "should", category: "backend" },
    ];
    const settings = {
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
    };
    const result = calculateEstimate(items, settings);
    expect(result.buildEffort.likely).toBeGreaterThan(0);
    expect(result.totalEffort.likely).toBeGreaterThan(result.buildEffort.likely);
    expect(result.overheads.length).toBeGreaterThan(0);
    expect(result.confidenceLevel).toBeDefined();
  });
});

describe("calculateConfidence", () => {
  it("returns high confidence for well-defined scope", () => {
    const items = [
      { complexity: "low", priority: "must" },
      { complexity: "medium", priority: "should" },
    ];
    const settings = {
      requirementsClarity: "clear",
      designMaturity: "existing",
      integrationFamiliarity: "known",
      techStackFamiliarity: "known",
    };
    const result = calculateConfidence(items, settings);
    expect(result).toBe("high");
  });

  it("returns lower confidence for unclear requirements", () => {
    const items = [
      { complexity: "very_high", priority: "must" },
      { complexity: "high", priority: "must" },
      { complexity: "high", priority: "must" },
    ];
    const settings = {
      requirementsClarity: "poor",
      designMaturity: "none",
      integrationFamiliarity: "unknown",
      techStackFamiliarity: "new",
    };
    const result = calculateConfidence(items, settings);
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
