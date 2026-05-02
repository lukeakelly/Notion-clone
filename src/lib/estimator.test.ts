import { describe, expect, it } from "vitest";
import {
  calculateProcessAsIsCost,
  calculateProject,
  createSampleState,
  defaultSettings,
  parseVolumetricCsv,
} from "./estimator";

describe("estimator calculations", () => {
  it("annualises daily volumetric data into as-is cost", () => {
    const process = {
      ...createSampleState().processes[0],
      frequency: "daily" as const,
      activityVolume: 10,
      averageProcessingTimeMinutes: 30,
    };

    expect(calculateProcessAsIsCost(process, defaultSettings)).toBe(48300);
  });

  it("calculates delivery economics and payback", () => {
    const state = createSampleState();
    const project = state.projects[0];
    const estimate = calculateProject(project, state.processes, state.settings);

    expect(estimate.deliveryCost).toBeGreaterThan(0);
    expect(estimate.asIsCost).toBeGreaterThan(estimate.toBeCost);
    expect(estimate.annualSaving).toBeGreaterThan(0);
    expect(estimate.roiMultiple).toBeGreaterThan(0);
    expect(estimate.paybackMonths).toBeGreaterThan(0);
  });

  it("parses CSV volumetric rows", () => {
    const rows = parseVolumetricCsv(
      "Process,Frequency,Activity volume average per frequency,Average processing time minutes,Number of employees\nTask A,Monthly,50,12,3",
      "project-test",
      defaultSettings,
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      name: "Task A",
      frequency: "monthly",
      activityVolume: 50,
      averageProcessingTimeMinutes: 12,
      employees: 3,
    });
  });
});
