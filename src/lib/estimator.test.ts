import { describe, expect, it } from "vitest";
import {
  calculateProcessAsIsCost,
  calculateProject,
  createSampleState,
  defaultSettings,
  parseWorkshopText,
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

  it("extracts workshop complexity from the full notes", () => {
    const parsed = parseWorkshopText(
      "Project name: Example\nProcesses: First process; Second process\nProcess descriptions: Manual queue handling.\nApplications: App A\nComplexity: complex",
      defaultSettings,
    );

    expect(parsed.processes).toHaveLength(2);
    expect(parsed.processes[0].complexity).toBe("complex");
    expect(parsed.processes[1].complexity).toBe("complex");
  });

  it("uses the explicit workshop complexity field over description keywords", () => {
    const parsed = parseWorkshopText(
      "Project name: Mortgage Automation\nProcesses: Application intake\nApplications: App A\nComplexity: medium\nDescription: This involves complex document validation rules.",
      defaultSettings,
    );

    expect(parsed.processes[0].complexity).toBe("medium");
  });

  it("flags missing workshop project names for review", () => {
    const parsed = parseWorkshopText(
      "Processes: First process\nApplications: App A\nComplexity: simple",
      defaultSettings,
    );

    expect(parsed.projectName).toBe("Untitled automation project");
    expect(parsed.unclearFields).toContain("Project name");
  });

  it("extracts structured process details from workshop bullets", () => {
    const parsed = parseWorkshopText(
      [
        "Project name: Claims Assist",
        "Processes in scope:",
        "- Triage claim: Check inbox and create claim; applications=Outlook, Guidewire; integrations=Guidewire API; steps=9; rules=4; exceptions=2",
        "- Evidence chase: Request missing evidence; applications=Outlook, SharePoint; integrations=SharePoint documents; steps=6; rules=3; exceptions=1",
        "Complexity: medium",
      ].join("\n"),
      defaultSettings,
    );

    expect(parsed.processes).toHaveLength(2);
    expect(parsed.processes[0]).toMatchObject({
      name: "Triage claim",
      description: "Check inbox and create claim",
      applications: "Outlook, Guidewire",
      integrations: "Guidewire API",
      steps: 9,
      businessRules: 4,
      exceptions: 2,
    });
    expect(parsed.processes[1]).toMatchObject({
      name: "Evidence chase",
      description: "Request missing evidence",
      applications: "Outlook, SharePoint",
      integrations: "SharePoint documents",
      steps: 6,
      businessRules: 3,
      exceptions: 1,
    });
    expect(parsed.processes[0].flaggedFields).toEqual([]);
    expect(parsed.processes[1].flaggedFields).toEqual([]);
    expect(parsed.unclearFields).not.toContain("Applications involved");
    expect(parsed.unclearFields).not.toContain("Integrations");
  });
});
