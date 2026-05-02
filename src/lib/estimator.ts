export type Frequency = "daily" | "weekly" | "fortnightly" | "monthly" | "quarterly" | "annual";
export type Complexity = "simple" | "medium" | "complex" | "very complex";
export type PhaseName = "Design" | "Build" | "Test" | "Implement";
export type ConfidenceLevel = "Low" | "Medium" | "High";
export type ProjectStatus = "Discovery" | "Design" | "Build" | "Test" | "Implement" | "Complete";

export interface EstimatorUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "estimator" | "viewer";
  authProvider: "mock" | "firebase" | "supabase";
}

export interface Client {
  id: string;
  name: string;
  industry: string;
  accountLead: string;
  notes: string;
  createdAt: string;
}

export interface ProcessRow {
  id: string;
  projectId: string;
  name: string;
  description: string;
  applications: string;
  complexity: Complexity;
  steps: number;
  businessRules: number;
  exceptions: number;
  integrations: string;
  dataDocumentComplexity: string;
  frequency: Frequency;
  activityVolume: number;
  averageProcessingTimeMinutes: number;
  employees: number;
  automatablePercentage: number;
  flaggedFields: string[];
}

export interface PhaseEstimate {
  phase: PhaseName;
  baDays: number;
  devDays: number;
  assumptions: string;
  confidence: ConfidenceLevel;
  notes: string;
}

export interface ProjectEstimate {
  baDays: number;
  devDays: number;
  accountLeadDays: number;
  deliveryCost: number;
  asIsCost: number;
  toBeCost: number;
  annualSaving: number;
  roiMultiple: number;
  paybackMonths: number;
  durationWeeks: number;
  recommendedBas: number;
  recommendedDevelopers: number;
  warnings: string[];
  lastRecalculatedAt: string;
}

export interface Project {
  id: string;
  clientId: string;
  projectNumber: string;
  name: string;
  status: ProjectStatus;
  workshopText: string;
  volumetricCsv: string;
  processesInScope: number;
  numberOfBas: number;
  numberOfDevelopers: number;
  durationWeeks: number;
  accountLeadDaysOverride: number | null;
  assumptions: string[];
  risks: string[];
  dependencies: string[];
  unclearFields: string[];
  phaseEstimates: PhaseEstimate[];
  estimate: ProjectEstimate;
}

export interface GlobalSettings {
  baDayRate: number;
  developerDayRate: number;
  accountLeadDayRate: number;
  blendedHourlyRate: number;
  defaultAutomatablePercentage: number;
  workingHoursPerDay: number;
  workingDaysPerYear: number;
  contingencyPercentage: number;
  defaultAccountLeadDaysPerWeek: number;
  baMaxProcessesPerBa: number;
  baCapacityDurationWeeks: number;
  devDaysPerDeveloperPerWeek: number;
}

export interface AuditEntry {
  id: string;
  projectId: string;
  action: "created" | "ingested" | "saved" | "recalculated";
  at: string;
  summary: string;
}

export interface EstimatorState {
  users: EstimatorUser[];
  clients: Client[];
  projects: Project[];
  processes: ProcessRow[];
  settings: GlobalSettings;
  auditHistory: AuditEntry[];
}

export interface ParsedWorkshop {
  projectName: string;
  processes: Partial<ProcessRow>[];
  phases: Partial<PhaseEstimate>[];
  assumptions: string[];
  risks: string[];
  dependencies: string[];
  unclearFields: string[];
}

export const phaseNames: PhaseName[] = ["Design", "Build", "Test", "Implement"];
let auditIdCounter = 0;

export const frequencyLabels: Record<Frequency, string> = {
  daily: "Daily",
  weekly: "Weekly",
  fortnightly: "Fortnightly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  annual: "Annual",
};

export const defaultSettings: GlobalSettings = {
  baDayRate: 700,
  developerDayRate: 850,
  accountLeadDayRate: 950,
  blendedHourlyRate: 42,
  defaultAutomatablePercentage: 70,
  workingHoursPerDay: 7.5,
  workingDaysPerYear: 230,
  contingencyPercentage: 10,
  defaultAccountLeadDaysPerWeek: 1,
  baMaxProcessesPerBa: 6,
  baCapacityDurationWeeks: 12,
  devDaysPerDeveloperPerWeek: 5,
};

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(safeNumber(value));
}

export function formatNumber(value: number, maximumFractionDigits = 1): string {
  return new Intl.NumberFormat("en-AU", { maximumFractionDigits }).format(safeNumber(value));
}

export function annualFrequencyMultiplier(frequency: Frequency, settings: GlobalSettings): number {
  if (frequency === "daily") return settings.workingDaysPerYear;
  if (frequency === "weekly") return 52;
  if (frequency === "fortnightly") return 26;
  if (frequency === "monthly") return 12;
  if (frequency === "quarterly") return 4;
  return 1;
}

export function calculateProcessAsIsCost(process: ProcessRow, settings: GlobalSettings): number {
  const annualTransactions =
    process.activityVolume * annualFrequencyMultiplier(process.frequency, settings);
  const manualHours = (annualTransactions * process.averageProcessingTimeMinutes) / 60;
  return manualHours * settings.blendedHourlyRate;
}

export function calculateProject(
  project: Project,
  processes: ProcessRow[],
  settings: GlobalSettings,
  mode: "resourcesChanged" | "durationChanged" | "recalculate" = "recalculate",
): ProjectEstimate {
  const scopedProcesses = processes.filter((process) => process.projectId === project.id);
  const baDays = roundOne(project.phaseEstimates.reduce((sum, phase) => sum + phase.baDays, 0));
  const devDays = roundOne(project.phaseEstimates.reduce((sum, phase) => sum + phase.devDays, 0));
  const durationFromResources = calculateDurationWeeksFromResources(
    baDays,
    devDays,
    project.numberOfBas,
    project.numberOfDevelopers,
    settings,
  );
  const durationWeeks = mode === "resourcesChanged" ? durationFromResources : project.durationWeeks;
  const recommendedBas = recommendBas(project, scopedProcesses, baDays, durationWeeks, settings);
  const recommendedDevelopers = recommendDevelopers(devDays, durationWeeks, settings);
  const accountLeadDays =
    project.accountLeadDaysOverride ??
    roundOne(durationWeeks * settings.defaultAccountLeadDaysPerWeek);
  const baseDeliveryCost =
    baDays * settings.baDayRate +
    devDays * settings.developerDayRate +
    accountLeadDays * settings.accountLeadDayRate;
  const deliveryCost = baseDeliveryCost * (1 + settings.contingencyPercentage / 100);
  const asIsCost = scopedProcesses.reduce(
    (sum, process) => sum + calculateProcessAsIsCost(process, settings),
    0,
  );
  const toBeCost = scopedProcesses.reduce((sum, process) => {
    const processCost = calculateProcessAsIsCost(process, settings);
    const remainingPercentage = 100 - clamp(process.automatablePercentage, 0, 100);
    return sum + processCost * (remainingPercentage / 100);
  }, 0);
  const annualSaving = Math.max(0, asIsCost - toBeCost);
  const roiMultiple = deliveryCost > 0 ? annualSaving / deliveryCost : 0;
  const paybackMonths = annualSaving > 0 ? (deliveryCost / annualSaving) * 12 : 0;
  return {
    baDays,
    devDays,
    accountLeadDays: roundOne(accountLeadDays),
    deliveryCost: roundTwo(deliveryCost),
    asIsCost: roundTwo(asIsCost),
    toBeCost: roundTwo(toBeCost),
    annualSaving: roundTwo(annualSaving),
    roiMultiple: roundTwo(roiMultiple),
    paybackMonths: roundOne(paybackMonths),
    durationWeeks: Math.max(1, roundOne(durationWeeks)),
    recommendedBas,
    recommendedDevelopers,
    warnings: buildWarnings(
      project,
      scopedProcesses,
      recommendedBas,
      recommendedDevelopers,
      durationWeeks,
      durationFromResources,
    ),
    lastRecalculatedAt: new Date().toISOString(),
  };
}

export function parseWorkshopText(text: string, settings: GlobalSettings): ParsedWorkshop {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const extractedProjectName = readField(lines, ["project name", "project"]);
  const projectName = extractedProjectName || "Untitled automation project";
  const applications = readField(lines, ["applications", "systems"]) || "";
  const integrations = readField(lines, ["integrations", "integration"]) || "";
  const assumptions = readList(lines, "assumptions");
  const risks = readList(lines, "risks");
  const dependencies = readList(lines, "dependencies");
  const processDetails = readProcessDetails(lines);
  const complexityValue = readField(lines, ["complexity", "process complexity"]);
  const parsedProcesses = processDetails.map((process, index) => {
    const complexity = readComplexity(complexityValue);
    const steps = readNumberNear(text, "steps", index + 8);
    const businessRules = readNumberNear(text, "business rules", index + 4);
    const exceptions = readNumberNear(text, "exceptions", index + 2);
    const flaggedFields: string[] = [];
    if (!applications) flaggedFields.push("Applications involved");
    if (!integrations) flaggedFields.push("Integrations");
    if (!process.description) flaggedFields.push("Process description");
    return {
      name: process.name,
      description: process.description,
      applications: process.applications || applications,
      complexity,
      steps: process.steps ?? steps,
      businessRules: process.businessRules ?? businessRules,
      exceptions: process.exceptions ?? exceptions,
      integrations: process.integrations || integrations,
      dataDocumentComplexity: readField(lines, ["data/document complexity", "data complexity"]) || "",
      automatablePercentage: settings.defaultAutomatablePercentage,
      flaggedFields,
    };
  });
  const phases = phaseNames.map((phase) => ({
    phase,
    baDays: readNumberNear(text, `${phase} BA`, defaultPhaseBaDays(phase, parsedProcesses.length)),
    devDays: readNumberNear(text, `${phase} Dev`, defaultPhaseDevDays(phase, parsedProcesses.length)),
    assumptions: assumptions[0] ?? "Review after SME validation",
    confidence: "Medium" as ConfidenceLevel,
    notes: `${phase} estimate extracted from workshop notes and editable before saving.`,
  }));
  const unclearFields: string[] = [];
  if (!extractedProjectName) unclearFields.push("Project name");
  if (parsedProcesses.length === 0) unclearFields.push("Process names");
  if (!applications) unclearFields.push("Applications involved");
  if (!integrations) unclearFields.push("Integrations");
  return {
    projectName,
    processes: parsedProcesses.length > 0 ? parsedProcesses : [{ name: "Process for review" }],
    phases,
    assumptions,
    risks,
    dependencies,
    unclearFields,
  };
}

export function parseVolumetricCsv(csv: string, projectId: string, settings: GlobalSettings): ProcessRow[] {
  const rows = parseCsvRows(csv);
  if (rows.length < 2) return [];
  const headers = rows[0].map(normaliseHeader);
  return rows.slice(1).filter((row) => row.some(Boolean)).map((row, index) => {
    const get = (aliases: string[]): string => {
      const headerIndex = headers.findIndex((header) => aliases.includes(header));
      return headerIndex >= 0 ? row[headerIndex] ?? "" : "";
    };
    const name = get(["process", "task", "taskprocess", "processname"]) || `Imported process ${index + 1}`;
    return {
      id: `process-import-${Date.now()}-${index}`,
      projectId,
      name,
      description: "",
      applications: "",
      complexity: "medium",
      steps: 0,
      businessRules: 0,
      exceptions: 0,
      integrations: "",
      dataDocumentComplexity: "",
      frequency: parseFrequency(get(["frequency", "taskprocessfrequency"])),
      activityVolume: toNumber(get(["activityvolume", "activityvolumeaverageperfrequency", "volume"])),
      averageProcessingTimeMinutes: toNumber(
        get(["averageprocessingtime", "averageprocessingtimeminutes", "avgprocessingtime"]),
      ),
      employees: toNumber(get(["employees", "numberofemployees", "numberofemployeesperformingthetask"])),
      automatablePercentage: settings.defaultAutomatablePercentage,
      flaggedFields: ["Workshop fields require review"],
    };
  });
}

export function createAuditEntry(projectId: string, action: AuditEntry["action"], summary: string): AuditEntry {
  auditIdCounter += 1;
  return {
    id: `audit-${Date.now()}-${auditIdCounter}`,
    projectId,
    action,
    at: new Date().toISOString(),
    summary,
  };
}

export function createSampleState(): EstimatorState {
  const settings = defaultSettings;
  const clients: Client[] = [
    {
      id: "client-northbank",
      name: "Northbank Mutual",
      industry: "Financial services",
      accountLead: "Amelia Clarke",
      notes: "Claims and operations automation pipeline.",
      createdAt: "2026-04-12T09:00:00.000Z",
    },
    {
      id: "client-careline",
      name: "Careline Health",
      industry: "Healthcare",
      accountLead: "Noah Singh",
      notes: "Back-office patient administration opportunities.",
      createdAt: "2026-04-14T09:00:00.000Z",
    },
    {
      id: "client-horizon",
      name: "Horizon Utilities",
      industry: "Utilities",
      accountLead: "Mia Kelly",
      notes: "Customer operations and billing automation.",
      createdAt: "2026-04-18T09:00:00.000Z",
    },
  ];
  const workshopText = `Project name: Claims Intake Automation
Processes: New claim registration; Evidence chase; Broker update notification
Process descriptions: Intake team reads emails, validates policy data, creates a claim, requests missing evidence and updates brokers.
Applications: Outlook, Guidewire, SharePoint, Teams
Complexity: complex
Number of steps: 38
Number of business rules: 12
Number of exceptions: 7
Integrations: Guidewire API, SharePoint document store
Data/document complexity: Medium-high due to mixed PDFs and email attachments.
Design BA: 18
Design Dev: 4
Build BA: 10
Build Dev: 44
Test BA: 12
Test Dev: 14
Implement BA: 6
Implement Dev: 5
Assumptions: API access is approved; SMEs available two days per week.
Risks: Inconsistent broker email templates; API rate limits.
Dependencies: Guidewire sandbox access; InfoSec approval.`;
  const volumetricCsv = `Process,Frequency,Activity volume average per frequency,Average processing time minutes,Number of employees
New claim registration,Daily,95,11,8
Evidence chase,Weekly,320,8,6
Broker update notification,Daily,120,4,4`;
  const projects: Project[] = [
    createProject({
      id: "project-claims-intake",
      clientId: "client-northbank",
      projectNumber: "NB-2026-001",
      name: "Claims Intake Automation",
      status: "Design",
      workshopText,
      volumetricCsv,
      bas: 2,
      devs: 3,
      durationWeeks: 10,
      assumptions: ["API access is approved", "SMEs available two days per week"],
      risks: ["Inconsistent broker email templates", "API rate limits"],
      dependencies: ["Guidewire sandbox access", "InfoSec approval"],
      phases: [
        samplePhase("Design", 18, 4, "Complex intake mapping and exception validation."),
        samplePhase("Build", 10, 44, "Guidewire and SharePoint integration build."),
        samplePhase("Test", 12, 14, "High-volume regression with business SMEs."),
        samplePhase("Implement", 6, 5, "Pilot rollout with broker support."),
      ],
    }),
    createProject({
      id: "project-policy-changes",
      clientId: "client-northbank",
      projectNumber: "NB-2026-002",
      name: "Policy Change Triage",
      status: "Discovery",
      workshopText: "Project name: Policy Change Triage\nProcesses: Address changes; Beneficiary updates\nApplications: Salesforce, Guidewire\nComplexity: medium",
      volumetricCsv: "Process,Frequency,Activity volume average per frequency,Average processing time minutes,Number of employees\nAddress changes,Daily,70,6,3\nBeneficiary updates,Weekly,90,9,2",
      bas: 1,
      devs: 2,
      durationWeeks: 7,
      assumptions: ["Salesforce queue data is reliable"],
      risks: ["Duplicate customer records"],
      dependencies: ["Data quality report"],
      phases: [
        samplePhase("Design", 8, 2, "Two process variants."),
        samplePhase("Build", 4, 18, "Low integration complexity."),
        samplePhase("Test", 5, 7, "Focused regression cycle."),
        samplePhase("Implement", 3, 3, "Team handover."),
      ],
    }),
    createProject({
      id: "project-referrals",
      clientId: "client-careline",
      projectNumber: "CH-2026-001",
      name: "Referral Intake Workbench",
      status: "Build",
      workshopText: "Project name: Referral Intake Workbench\nProcesses: Referral validation; Appointment request\nApplications: Epic, Outlook\nComplexity: very complex",
      volumetricCsv: "Process,Frequency,Activity volume average per frequency,Average processing time minutes,Number of employees\nReferral validation,Daily,140,13,10\nAppointment request,Daily,110,7,5",
      bas: 2,
      devs: 4,
      durationWeeks: 12,
      assumptions: ["Clinical coding rules will be supplied"],
      risks: ["Patient data handling constraints"],
      dependencies: ["Privacy approval"],
      phases: [
        samplePhase("Design", 22, 5, "Clinical rule mapping."),
        samplePhase("Build", 12, 58, "Complex system interactions."),
        samplePhase("Test", 16, 20, "Privacy and safety validation."),
        samplePhase("Implement", 8, 6, "Controlled rollout."),
      ],
    }),
    createProject({
      id: "project-meter-reads",
      clientId: "client-horizon",
      projectNumber: "HU-2026-001",
      name: "Meter Read Exception Handling",
      status: "Test",
      workshopText: "Project name: Meter Read Exception Handling\nProcesses: Exception categorisation; Customer notification\nApplications: SAP IS-U, ServiceNow\nComplexity: medium",
      volumetricCsv: "Process,Frequency,Activity volume average per frequency,Average processing time minutes,Number of employees\nException categorisation,Daily,210,5,6\nCustomer notification,Weekly,430,3,3",
      bas: 1,
      devs: 2,
      durationWeeks: 8,
      assumptions: ["SAP export format remains stable"],
      risks: ["Peak season volume spikes"],
      dependencies: ["ServiceNow template approval"],
      phases: [
        samplePhase("Design", 9, 2, "Moderate exception logic."),
        samplePhase("Build", 5, 24, "SAP and ServiceNow integration."),
        samplePhase("Test", 7, 8, "Volume and template testing."),
        samplePhase("Implement", 4, 3, "Ops rollout."),
      ],
    }),
  ];
  const processes: ProcessRow[] = [
    sampleProcess("process-claim-registration", "project-claims-intake", "New claim registration", "daily", 95, 11, 8, "complex", 78),
    sampleProcess("process-evidence-chase", "project-claims-intake", "Evidence chase", "weekly", 320, 8, 6, "medium", 65),
    sampleProcess("process-broker-update", "project-claims-intake", "Broker update notification", "daily", 120, 4, 4, "simple", 82),
    sampleProcess("process-address-change", "project-policy-changes", "Address changes", "daily", 70, 6, 3, "simple", 75),
    sampleProcess("process-beneficiary", "project-policy-changes", "Beneficiary updates", "weekly", 90, 9, 2, "medium", 68),
    sampleProcess("process-referral-validation", "project-referrals", "Referral validation", "daily", 140, 13, 10, "very complex", 62),
    sampleProcess("process-appointment", "project-referrals", "Appointment request", "daily", 110, 7, 5, "complex", 72),
    sampleProcess("process-exception-categorisation", "project-meter-reads", "Exception categorisation", "daily", 210, 5, 6, "medium", 80),
    sampleProcess("process-customer-notification", "project-meter-reads", "Customer notification", "weekly", 430, 3, 3, "simple", 88),
  ];
  const projectsWithEstimates = projects.map((project) => ({
    ...project,
    processesInScope: processes.filter((process) => process.projectId === project.id).length,
    estimate: calculateProject(project, processes, settings),
  }));
  return {
    users: [
      {
        id: "user-estimator",
        email: "estimator@simplyai.com.au",
        name: "Simplyai Estimator",
        role: "admin",
        authProvider: "mock",
      },
    ],
    clients,
    projects: projectsWithEstimates,
    processes,
    settings,
    auditHistory: projectsWithEstimates.map((project) =>
      createAuditEntry(project.id, "created", `${project.name} seeded with parsed workshop and volumetric data.`),
    ),
  };
}

function createProject(input: {
  id: string;
  clientId: string;
  projectNumber: string;
  name: string;
  status: ProjectStatus;
  workshopText: string;
  volumetricCsv: string;
  bas: number;
  devs: number;
  durationWeeks: number;
  assumptions: string[];
  risks: string[];
  dependencies: string[];
  phases: PhaseEstimate[];
}): Project {
  return {
    id: input.id,
    clientId: input.clientId,
    projectNumber: input.projectNumber,
    name: input.name,
    status: input.status,
    workshopText: input.workshopText,
    volumetricCsv: input.volumetricCsv,
    processesInScope: 0,
    numberOfBas: input.bas,
    numberOfDevelopers: input.devs,
    durationWeeks: input.durationWeeks,
    accountLeadDaysOverride: null,
    assumptions: input.assumptions,
    risks: input.risks,
    dependencies: input.dependencies,
    unclearFields: [],
    phaseEstimates: input.phases,
    estimate: {
      baDays: 0,
      devDays: 0,
      accountLeadDays: 0,
      deliveryCost: 0,
      asIsCost: 0,
      toBeCost: 0,
      annualSaving: 0,
      roiMultiple: 0,
      paybackMonths: 0,
      durationWeeks: input.durationWeeks,
      recommendedBas: input.bas,
      recommendedDevelopers: input.devs,
      warnings: [],
      lastRecalculatedAt: "",
    },
  };
}

function samplePhase(
  phase: PhaseName,
  baDays: number,
  devDays: number,
  notes: string,
): PhaseEstimate {
  return {
    phase,
    baDays,
    devDays,
    assumptions: "SMEs and environments available as planned.",
    confidence: phase === "Build" ? "Medium" : "High",
    notes,
  };
}

function sampleProcess(
  id: string,
  projectId: string,
  name: string,
  frequency: Frequency,
  activityVolume: number,
  minutes: number,
  employees: number,
  complexity: Complexity,
  automatablePercentage: number,
): ProcessRow {
  return {
    id,
    projectId,
    name,
    description: `${name} currently requires manual review, validation and system updates.`,
    applications: "Outlook, core platform, shared documents",
    complexity,
    steps: complexity === "simple" ? 8 : complexity === "medium" ? 16 : 28,
    businessRules: complexity === "simple" ? 3 : complexity === "medium" ? 7 : 12,
    exceptions: complexity === "simple" ? 1 : complexity === "medium" ? 4 : 8,
    integrations: "API or queue-based handoff",
    dataDocumentComplexity: complexity === "simple" ? "Low" : "Medium",
    frequency,
    activityVolume,
    averageProcessingTimeMinutes: minutes,
    employees,
    automatablePercentage,
    flaggedFields: [],
  };
}

function calculateDurationWeeksFromResources(
  baDays: number,
  devDays: number,
  bas: number,
  developers: number,
  settings: GlobalSettings,
): number {
  const baWeeks = bas > 0 ? baDays / (bas * 5) : baDays;
  const devWeeks = developers > 0 ? devDays / (developers * settings.devDaysPerDeveloperPerWeek) : devDays;
  return Math.max(1, Math.ceil(Math.max(baWeeks, devWeeks)));
}

function recommendBas(
  project: Project,
  processes: ProcessRow[],
  baDays: number,
  durationWeeks: number,
  settings: GlobalSettings,
): number {
  const processCount = project.processesInScope || processes.length || 1;
  const weightedProcessCount = processes.reduce(
    (sum, process) => sum + complexityWeight(process.complexity),
    processCount > processes.length ? processCount - processes.length : 0,
  );
  const capacityPerBa = Math.max(
    1,
    settings.baMaxProcessesPerBa * (durationWeeks / settings.baCapacityDurationWeeks),
  );
  const byProcessCoverage = Math.ceil(weightedProcessCount / capacityPerBa);
  const byEffort = Math.ceil(baDays / Math.max(1, durationWeeks * 5));
  return Math.max(1, byProcessCoverage, byEffort);
}

function recommendDevelopers(
  devDays: number,
  durationWeeks: number,
  settings: GlobalSettings,
): number {
  return Math.max(1, Math.ceil(devDays / Math.max(1, durationWeeks * settings.devDaysPerDeveloperPerWeek)));
}

function buildWarnings(
  project: Project,
  processes: ProcessRow[],
  recommendedBas: number,
  recommendedDevelopers: number,
  durationWeeks: number,
  durationFromResources: number,
): string[] {
  const warnings: string[] = [];
  if (project.numberOfBas < recommendedBas) {
    warnings.push("BA capacity may be too low for this number of processes.");
  }
  if (project.numberOfDevelopers > recommendedDevelopers && project.numberOfBas < recommendedBas + 1) {
    warnings.push(
      "Increasing developers may shorten build time but requires more BA support for design, clarification and testing.",
    );
  }
  if (durationWeeks < durationFromResources) {
    warnings.push("This duration may be too aggressive based on current effort estimates.");
  }
  if (processes.some((process) => process.flaggedFields.length > 0)) {
    warnings.push("Some extracted process fields are flagged for review before sign-off.");
  }
  return warnings;
}

function complexityWeight(complexity: Complexity): number {
  if (complexity === "simple") return 0.85;
  if (complexity === "medium") return 1;
  if (complexity === "complex") return 1.35;
  return 1.7;
}

function defaultPhaseBaDays(phase: PhaseName, processCount: number): number {
  if (phase === "Design") return processCount * 4;
  if (phase === "Build") return processCount * 2;
  if (phase === "Test") return processCount * 3;
  return processCount * 1.5;
}

function defaultPhaseDevDays(phase: PhaseName, processCount: number): number {
  if (phase === "Design") return processCount;
  if (phase === "Build") return processCount * 8;
  if (phase === "Test") return processCount * 3;
  return processCount * 1.5;
}

function readField(lines: string[], names: string[]): string {
  const match = lines.find((line) => {
    const lower = line.toLowerCase();
    return names.some((name) => lower.startsWith(`${name}:`));
  });
  if (!match) return "";
  const colonIndex = match.indexOf(":");
  return colonIndex >= 0 ? match.slice(colonIndex + 1).trim() : "";
}

function readList(lines: string[], name: string): string[] {
  const value = readField(lines, [name]);
  if (!value) return [];
  return value
    .split(/;|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function readProcessNames(lines: string[]): string[] {
  const value = readField(lines, ["processes", "process names"]);
  if (!value) return [];
  return value
    .split(/;|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function readProcessDetails(lines: string[]): Array<{
  name: string;
  description: string;
  applications: string;
  integrations: string;
  steps?: number;
  businessRules?: number;
  exceptions?: number;
}> {
  const namedProcesses = readProcessNames(lines);
  const processBlock = readSection(lines, ["processes in scope", "process details", "processes"]);
  const bulletProcesses = processBlock.flatMap(parseProcessBullet);
  const processes: Array<{
    name: string;
    description?: string;
    applications?: string;
    integrations?: string;
    steps?: number;
    businessRules?: number;
    exceptions?: number;
  }> = bulletProcesses.length > 0 ? bulletProcesses : namedProcesses.map((name) => ({ name }));
  const descriptions = splitListValue(readField(lines, ["process descriptions", "description"]));
  return processes.map((process, index) => ({
    name: process.name,
    description: process.description ?? descriptions[index] ?? descriptions[0] ?? "",
    applications: process.applications ?? "",
    integrations: process.integrations ?? "",
    steps: process.steps,
    businessRules: process.businessRules,
    exceptions: process.exceptions,
  }));
}

function readSection(lines: string[], names: string[]): string[] {
  const startIndex = lines.findIndex((line) => {
    const lower = line.toLowerCase();
    return names.some((name) => lower === `${name}:` || lower.startsWith(`${name}:`));
  });
  if (startIndex < 0) return [];
  const section: string[] = [];
  const firstLineValue = lines[startIndex].slice(lines[startIndex].indexOf(":") + 1).trim();
  if (firstLineValue) section.push(firstLineValue);
  for (const line of lines.slice(startIndex + 1)) {
    if (/^[A-Za-z][A-Za-z /-]{1,40}:/.test(line)) break;
    section.push(line);
  }
  return section;
}

function parseProcessBullet(value: string): Array<{
  name: string;
  description?: string;
  applications?: string;
  integrations?: string;
  steps?: number;
  businessRules?: number;
  exceptions?: number;
}> {
  return value
    .split(/\n|•/)
    .flatMap((line) => line.split(/(?=\s*-\s*[A-Za-z][^:;\n]+:)/))
    .map((raw) => raw.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean)
    .flatMap((line) => {
      if (!line.includes(":")) {
        return splitListValue(line).map((name) => ({ name }));
      }
      const [rawName, ...rest] = line.split(":");
      const details = rest.join(":").trim();
      const name = rawName.trim();
      const description =
        details
          .split(/;|\|/)
          .map((item) => item.trim())
          .find((item) => item && !item.includes("=") && !item.toLowerCase().startsWith("applications")) ?? "";
      return [{
        name,
        description,
        applications: readInlineValue(details, ["applications", "apps", "systems"]),
        integrations: readInlineValue(details, ["integrations", "integration"]),
        steps: readInlineNumber(details, ["steps"]),
        businessRules: readInlineNumber(details, ["business rules", "rules"]),
        exceptions: readInlineNumber(details, ["exceptions"]),
      }];
    });
}

function splitListValue(value: string): string[] {
  if (!value) return [];
  return value
    .split(/;|\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function readInlineValue(text: string, names: string[]): string {
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = text.match(new RegExp(`${escaped}\\s*(?:=|:)\\s*([^;|]+)`, "i"));
    if (match?.[1]) return match[1].trim();
  }
  return "";
}

function readInlineNumber(text: string, names: string[]): number | undefined {
  const value = readInlineValue(text, names);
  return value ? toNumber(value) : undefined;
}

function readComplexity(value: string): Complexity {
  const lower = value.toLowerCase();
  if (lower.includes("very complex")) return "very complex";
  if (lower.includes("complex")) return "complex";
  if (lower.includes("simple")) return "simple";
  return "medium";
}

function readNumberNear(text: string, label: string, fallback: number): number {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp(`${escaped}\\s*:?\\s*(\\d+(?:\\.\\d+)?)`, "i"));
  return match ? toNumber(match[1]) : fallback;
}

function parseCsvRows(csv: string): string[][] {
  const rows: string[][] = [];
  let cell = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];
    if (char === '"' && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function normaliseHeader(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseFrequency(value: string): Frequency {
  const normalised = value.toLowerCase().trim();
  if (normalised.includes("fortnight")) return "fortnightly";
  if (normalised.includes("month")) return "monthly";
  if (normalised.includes("quarter")) return "quarterly";
  if (normalised.includes("annual") || normalised.includes("year")) return "annual";
  if (normalised.includes("week")) return "weekly";
  return "daily";
}

function toNumber(value: string): number {
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function safeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}

function roundTwo(value: number): number {
  return Math.round(value * 100) / 100;
}
