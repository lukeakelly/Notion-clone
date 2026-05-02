"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  Calculator,
  Clock,
  Database,
  FileText,
  Gauge,
  LineChart,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  type AuditEntry,
  type Client,
  type Complexity,
  type ConfidenceLevel,
  type EstimatorState,
  type Frequency,
  type GlobalSettings,
  type PhaseEstimate,
  type PhaseName,
  type ProcessRow,
  type Project,
  type ProjectStatus,
  calculateProcessAsIsCost,
  calculateProject,
  createAuditEntry,
  createSampleState,
  formatCurrency,
  formatNumber,
  frequencyLabels,
  parseVolumetricCsv,
  parseWorkshopText,
  phaseNames,
} from "@/lib/estimator";
import { cn, formatDate } from "@/lib/utils";

type View =
  | { name: "home" }
  | { name: "client"; clientId: string }
  | { name: "program"; clientId: string }
  | { name: "project"; projectId: string }
  | { name: "settings" };

const storageKey = "simplyai-estimator-state-v1";
const statuses: ProjectStatus[] = ["Discovery", "Design", "Build", "Test", "Implement", "Complete"];
const complexities: Complexity[] = ["simple", "medium", "complex", "very complex"];
const confidenceLevels: ConfidenceLevel[] = ["Low", "Medium", "High"];
const frequencies: Frequency[] = ["daily", "weekly", "fortnightly", "monthly", "quarterly", "annual"];

export function EstimatorApp() {
  const [state, setState] = useState<EstimatorState>(() => createSampleState());
  const [view, setView] = useState<View>({ name: "home" });
  const [clientSearch, setClientSearch] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return;
    try {
      setState(JSON.parse(stored) as EstimatorState);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  const totals = useMemo(() => getPortfolioTotals(state), [state]);
  const activeClient = view.name === "client" || view.name === "program"
    ? state.clients.find((client) => client.id === view.clientId)
    : null;
  const activeProject = view.name === "project"
    ? state.projects.find((project) => project.id === view.projectId)
    : null;

  function saveState(nextState = state) {
    window.localStorage.setItem(storageKey, JSON.stringify(nextState));
    setSavedAt(new Date().toISOString());
  }

  function resetSampleData() {
    const nextState = createSampleState();
    setState(nextState);
    saveState(nextState);
    setView({ name: "home" });
  }

  function addClient() {
    const client: Client = {
      id: `client-${Date.now()}`,
      name: "New Simplyai Client",
      industry: "Industry",
      accountLead: "Account Lead",
      notes: "Add client notes.",
      createdAt: new Date().toISOString(),
    };
    setState((current) => ({ ...current, clients: [client, ...current.clients] }));
    setView({ name: "client", clientId: client.id });
  }

  function addProject(clientId: string) {
    const project: Project = {
      id: `project-${Date.now()}`,
      clientId,
      projectNumber: `SIM-${new Date().getFullYear()}-${state.projects.length + 1}`,
      name: "New Automation Project",
      status: "Discovery",
      workshopText:
        "Project name: New Automation Project\nProcesses: Process one\nApplications: Source app, target app\nComplexity: medium",
      volumetricCsv:
        "Process,Frequency,Activity volume average per frequency,Average processing time minutes,Number of employees\nProcess one,Weekly,100,8,3",
      processesInScope: 1,
      numberOfBas: 1,
      numberOfDevelopers: 1,
      durationWeeks: 6,
      accountLeadDaysOverride: null,
      assumptions: ["Discovery workshop notes to be validated"],
      risks: ["Unclear integration details"],
      dependencies: ["SME availability"],
      unclearFields: ["Full volumetric validation"],
      phaseEstimates: phaseNames.map((phase) => ({
        phase,
        baDays: phase === "Design" ? 5 : phase === "Build" ? 2 : 3,
        devDays: phase === "Build" ? 10 : 2,
        assumptions: "Editable placeholder.",
        confidence: "Medium",
        notes: "Update after ingestion.",
      })),
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
        durationWeeks: 6,
        recommendedBas: 1,
        recommendedDevelopers: 1,
        warnings: [],
        lastRecalculatedAt: "",
      },
    };
    const process: ProcessRow = {
      id: `process-${Date.now()}`,
      projectId: project.id,
      name: "Process one",
      description: "",
      applications: "",
      complexity: "medium",
      steps: 0,
      businessRules: 0,
      exceptions: 0,
      integrations: "",
      dataDocumentComplexity: "",
      frequency: "weekly",
      activityVolume: 100,
      averageProcessingTimeMinutes: 8,
      employees: 3,
      automatablePercentage: state.settings.defaultAutomatablePercentage,
      flaggedFields: ["Workshop fields require review"],
    };
    const projectWithEstimate = {
      ...project,
      estimate: calculateProject(project, [process], state.settings),
    };
    const audit = createAuditEntry(project.id, "created", "New project created from prototype template.");
    setState((current) => ({
      ...current,
      projects: [projectWithEstimate, ...current.projects],
      processes: [process, ...current.processes],
      auditHistory: [audit, ...current.auditHistory],
    }));
    setView({ name: "project", projectId: project.id });
  }

  function updateClient<K extends keyof Client>(clientId: string, field: K, value: Client[K]) {
    setState((current) => ({
      ...current,
      clients: current.clients.map((client) =>
        client.id === clientId ? { ...client, [field]: value } : client,
      ),
    }));
  }

  function updateProject<K extends keyof Project>(projectId: string, field: K, value: Project[K]) {
    setState((current) => ({
      ...current,
      projects: current.projects.map((project) =>
        project.id === projectId ? { ...project, [field]: value } : project,
      ),
    }));
  }

  function updateProcess<K extends keyof ProcessRow>(processId: string, field: K, value: ProcessRow[K]) {
    setState((current) => ({
      ...current,
      processes: current.processes.map((process) =>
        process.id === processId ? { ...process, [field]: value } : process,
      ),
    }));
  }

  function updatePhase<K extends keyof PhaseEstimate>(
    projectId: string,
    phaseName: PhaseName,
    field: K,
    value: PhaseEstimate[K],
  ) {
    setState((current) => ({
      ...current,
      projects: current.projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              phaseEstimates: project.phaseEstimates.map((phase) =>
                phase.phase === phaseName ? { ...phase, [field]: value } : phase,
              ),
            }
          : project,
      ),
    }));
  }

  function updateSettings<K extends keyof GlobalSettings>(field: K, value: GlobalSettings[K]) {
    setState((current) => ({ ...current, settings: { ...current.settings, [field]: value } }));
  }

  function ingestWorkshop(projectId: string) {
    setState((current) => {
      const project = current.projects.find((item) => item.id === projectId);
      if (!project) return current;
      const parsed = parseWorkshopText(project.workshopText, current.settings);
      const existingProcesses = current.processes.filter((process) => process.projectId === projectId);
      const mergedProcesses = parsed.processes.map((process, index) => {
        const existing = existingProcesses[index];
        return {
          id: existing?.id ?? `process-workshop-${Date.now()}-${index}`,
          projectId,
          name: process.name ?? existing?.name ?? `Process ${index + 1}`,
          description: process.description ?? existing?.description ?? "",
          applications: process.applications ?? existing?.applications ?? "",
          complexity: process.complexity ?? existing?.complexity ?? "medium",
          steps: process.steps ?? existing?.steps ?? 0,
          businessRules: process.businessRules ?? existing?.businessRules ?? 0,
          exceptions: process.exceptions ?? existing?.exceptions ?? 0,
          integrations: process.integrations ?? existing?.integrations ?? "",
          dataDocumentComplexity:
            process.dataDocumentComplexity ?? existing?.dataDocumentComplexity ?? "",
          frequency: existing?.frequency ?? "weekly",
          activityVolume: existing?.activityVolume ?? 0,
          averageProcessingTimeMinutes: existing?.averageProcessingTimeMinutes ?? 0,
          employees: existing?.employees ?? 0,
          automatablePercentage:
            process.automatablePercentage ??
            existing?.automatablePercentage ??
            current.settings.defaultAutomatablePercentage,
          flaggedFields: process.flaggedFields ?? existing?.flaggedFields ?? [],
        };
      });
      const otherProcesses = current.processes.filter((process) => process.projectId !== projectId);
      const updatedProject = {
        ...project,
        name: parsed.projectName,
        processesInScope: mergedProcesses.length,
        assumptions: parsed.assumptions.length > 0 ? parsed.assumptions : project.assumptions,
        risks: parsed.risks.length > 0 ? parsed.risks : project.risks,
        dependencies: parsed.dependencies.length > 0 ? parsed.dependencies : project.dependencies,
        unclearFields: parsed.unclearFields,
        phaseEstimates: phaseNames.map((phaseName) => {
          const parsedPhase = parsed.phases.find((phase) => phase.phase === phaseName);
          const existingPhase = project.phaseEstimates.find((phase) => phase.phase === phaseName);
          return {
            phase: phaseName,
            baDays: parsedPhase?.baDays ?? existingPhase?.baDays ?? 0,
            devDays: parsedPhase?.devDays ?? existingPhase?.devDays ?? 0,
            assumptions: parsedPhase?.assumptions ?? existingPhase?.assumptions ?? "",
            confidence: parsedPhase?.confidence ?? existingPhase?.confidence ?? "Medium",
            notes: parsedPhase?.notes ?? existingPhase?.notes ?? "",
          };
        }),
      };
      const audit = createAuditEntry(projectId, "ingested", "Workshop notes parsed into editable fields.");
      return {
        ...current,
        projects: current.projects.map((item) => (item.id === projectId ? updatedProject : item)),
        processes: [...mergedProcesses, ...otherProcesses],
        auditHistory: [audit, ...current.auditHistory],
      };
    });
  }

  function importCsv(projectId: string) {
    setState((current) => {
      const project = current.projects.find((item) => item.id === projectId);
      if (!project) return current;
      const imported = parseVolumetricCsv(project.volumetricCsv, projectId, current.settings);
      if (imported.length === 0) return current;
      const existingProcesses = current.processes.filter((process) => process.projectId === projectId);
      const merged = imported.map((process, index) => {
        const existing = existingProcesses[index];
        return {
          ...process,
          id: existing?.id ?? process.id,
          description: existing?.description ?? process.description,
          applications: existing?.applications ?? process.applications,
          complexity: existing?.complexity ?? process.complexity,
          steps: existing?.steps ?? process.steps,
          businessRules: existing?.businessRules ?? process.businessRules,
          exceptions: existing?.exceptions ?? process.exceptions,
          integrations: existing?.integrations ?? process.integrations,
          dataDocumentComplexity: existing?.dataDocumentComplexity ?? process.dataDocumentComplexity,
          automatablePercentage: existing?.automatablePercentage ?? process.automatablePercentage,
        };
      });
      const audit = createAuditEntry(projectId, "ingested", "CSV volumetric data imported into editable rows.");
      return {
        ...current,
        projects: current.projects.map((item) =>
          item.id === projectId ? { ...item, processesInScope: merged.length } : item,
        ),
        processes: [...merged, ...current.processes.filter((process) => process.projectId !== projectId)],
        auditHistory: [audit, ...current.auditHistory],
      };
    });
  }

  function recalculateProject(projectId: string, mode: "resourcesChanged" | "durationChanged" | "recalculate") {
    setState((current) => {
      const project = current.projects.find((item) => item.id === projectId);
      if (!project) return current;
      const estimate = calculateProject(project, current.processes, current.settings, mode);
      const updatedProject = {
        ...project,
        durationWeeks: estimate.durationWeeks,
        estimate,
      };
      if (mode === "durationChanged") {
        updatedProject.numberOfBas = estimate.recommendedBas;
        updatedProject.numberOfDevelopers = estimate.recommendedDevelopers;
      }
      const audit = createAuditEntry(
        projectId,
        "recalculated",
        `Estimate recalculated: ${formatCurrency(estimate.deliveryCost)} delivery cost and ${formatCurrency(
          estimate.annualSaving,
        )} annual saving.`,
      );
      return {
        ...current,
        projects: current.projects.map((item) => (item.id === projectId ? updatedProject : item)),
        auditHistory: [audit, ...current.auditHistory],
      };
    });
  }

  const filteredClients = state.clients.filter((client) => {
    const haystack = `${client.name} ${client.industry} ${client.accountLead}`.toLowerCase();
    return haystack.includes(clientSearch.toLowerCase());
  });

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Simplyai internal prototype · @simplyai.com.au only
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Automation Estimation Workspace
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-500">
                Estimate BA, developer and account lead effort across Design, Build, Test and Implement,
                then calculate delivery cost, as-is cost, to-be cost, annual saving, ROI and payback.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setView({ name: "settings" })}>
              <Settings className="h-4 w-4" /> Global settings
            </Button>
            <Button variant="outline" onClick={resetSampleData}>
              <RefreshCw className="h-4 w-4" /> Reset sample data
            </Button>
            <Button onClick={() => saveState()}>
              <Save className="h-4 w-4" /> Save prototype
            </Button>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total clients" value={String(totals.totalClients)} icon={<Building2 />} />
          <MetricCard label="Total projects" value={String(totals.totalProjects)} icon={<FileText />} />
          <MetricCard
            label="Total delivery cost"
            value={formatCurrency(totals.totalDeliveryCost)}
            icon={<Calculator />}
          />
          <MetricCard
            label="Projected annual savings"
            value={formatCurrency(totals.totalAnnualSaving)}
            icon={<LineChart />}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <Badge className="border-blue-200 bg-blue-50 text-blue-700">
            Mock localStorage persistence
          </Badge>
          <Badge>Firebase/Supabase-ready object model</Badge>
          <Badge>Future tables: Users, Clients, Projects, Processes, Estimates, Settings, Audit</Badge>
          {savedAt ? <span>Last saved locally {new Date(savedAt).toLocaleTimeString()}</span> : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <NavButton active={view.name === "home"} onClick={() => setView({ name: "home" })}>
          Home
        </NavButton>
        {activeClient ? (
          <>
            <NavButton
              active={view.name === "client"}
              onClick={() => setView({ name: "client", clientId: activeClient.id })}
            >
              {activeClient.name}
            </NavButton>
            <NavButton
              active={view.name === "program"}
              onClick={() => setView({ name: "program", clientId: activeClient.id })}
            >
              Program Level View
            </NavButton>
          </>
        ) : null}
        {activeProject ? <NavButton active>{activeProject.projectNumber}</NavButton> : null}
      </div>

      {view.name === "home" ? (
        <HomeView
          clients={filteredClients}
          projects={state.projects}
          search={clientSearch}
          onSearch={setClientSearch}
          onAddClient={addClient}
          onOpenClient={(clientId) => setView({ name: "client", clientId })}
          onOpenProject={(projectId) => setView({ name: "project", projectId })}
        />
      ) : null}

      {view.name === "client" && activeClient ? (
        <ClientView
          client={activeClient}
          projects={state.projects.filter((project) => project.clientId === activeClient.id)}
          onUpdateClient={updateClient}
          onProgram={() => setView({ name: "program", clientId: activeClient.id })}
          onProject={(projectId) => setView({ name: "project", projectId })}
          onAddProject={() => addProject(activeClient.id)}
        />
      ) : null}

      {view.name === "program" && activeClient ? (
        <ProgramView
          client={activeClient}
          projects={state.projects.filter((project) => project.clientId === activeClient.id)}
          processes={state.processes}
          settings={state.settings}
          onProject={(projectId) => setView({ name: "project", projectId })}
        />
      ) : null}

      {view.name === "project" && activeProject ? (
        <ProjectView
          project={activeProject}
          processes={state.processes.filter((process) => process.projectId === activeProject.id)}
          settings={state.settings}
          auditHistory={state.auditHistory.filter((entry) => entry.projectId === activeProject.id)}
          onUpdateProject={updateProject}
          onUpdateProcess={updateProcess}
          onUpdatePhase={updatePhase}
          onIngestWorkshop={ingestWorkshop}
          onImportCsv={importCsv}
          onRecalculate={recalculateProject}
        />
      ) : null}

      {view.name === "settings" ? (
        <SettingsView settings={state.settings} onUpdateSettings={updateSettings} />
      ) : null}
    </div>
  );
}

function HomeView({
  clients,
  projects,
  search,
  onSearch,
  onAddClient,
  onOpenClient,
  onOpenProject,
}: {
  clients: Client[];
  projects: Project[];
  search: string;
  onSearch: (value: string) => void;
  onAddClient: () => void;
  onOpenClient: (clientId: string) => void;
  onOpenProject: (projectId: string) => void;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <Card className="border-blue-100 shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-blue-100 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg text-slate-950">Clients</CardTitle>
            <p className="text-sm text-slate-500">Search, filter and open client-level estimates.</p>
          </div>
          <Button onClick={onAddClient}>
            <Plus className="h-4 w-4" /> Add new client
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => onSearch(event.target.value)}
              className="border-blue-100 pl-9"
              placeholder="Search clients by name, industry or account lead"
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {clients.map((client) => {
              const clientProjects = projects.filter((project) => project.clientId === client.id);
              const annualSaving = clientProjects.reduce(
                (sum, project) => sum + project.estimate.annualSaving,
                0,
              );
              return (
                <button
                  type="button"
                  key={client.id}
                  onClick={() => onOpenClient(client.id)}
                  className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-950">{client.name}</h3>
                      <p className="text-sm text-slate-500">{client.industry}</p>
                    </div>
                    <Badge>{clientProjects.length} projects</Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">Account lead</p>
                      <p className="font-medium text-slate-800">{client.accountLead}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Annual saving</p>
                      <p className="font-medium text-blue-700">{formatCurrency(annualSaving)}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <Card className="border-blue-100 shadow-sm">
        <CardHeader className="border-blue-100">
          <CardTitle className="flex items-center gap-2 text-lg text-slate-950">
            <BarChart3 className="h-5 w-5 text-blue-600" /> Latest project estimates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {projects.slice(0, 5).map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => onOpenProject(project.id)}
              className="w-full rounded-xl border border-slate-200 p-3 text-left hover:border-blue-300"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{project.name}</p>
                  <p className="text-xs text-slate-500">{project.projectNumber}</p>
                </div>
                <Badge>{project.status}</Badge>
              </div>
              <MiniBars deliveryCost={project.estimate.deliveryCost} annualSaving={project.estimate.annualSaving} />
              <div className="mt-2 flex justify-between text-xs text-slate-500">
                <span>{formatCurrency(project.estimate.deliveryCost)} cost</span>
                <span>{formatCurrency(project.estimate.annualSaving)} saving</span>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ClientView({
  client,
  projects,
  onUpdateClient,
  onProgram,
  onProject,
  onAddProject,
}: {
  client: Client;
  projects: Project[];
  onUpdateClient: <K extends keyof Client>(clientId: string, field: K, value: Client[K]) => void;
  onProgram: () => void;
  onProject: (projectId: string) => void;
  onAddProject: () => void;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
      <Card className="border-blue-100 shadow-sm">
        <CardHeader className="border-blue-100">
          <CardTitle className="text-lg text-slate-950">Client details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Client name">
            <Input
              value={client.name}
              onChange={(event) => onUpdateClient(client.id, "name", event.target.value)}
            />
          </Field>
          <Field label="Industry">
            <Input
              value={client.industry}
              onChange={(event) => onUpdateClient(client.id, "industry", event.target.value)}
            />
          </Field>
          <Field label="Account lead">
            <Input
              value={client.accountLead}
              onChange={(event) => onUpdateClient(client.id, "accountLead", event.target.value)}
            />
          </Field>
          <Field label="Notes">
            <Textarea
              value={client.notes}
              onChange={(event) => onUpdateClient(client.id, "notes", event.target.value)}
            />
          </Field>
        </CardContent>
      </Card>
      <div className="space-y-6">
        <div className="grid gap-3 md:grid-cols-3">
          <ActionCard
            icon={<Gauge />}
            title="Program Level View"
            description="Review every project for this client in one dashboard table."
            onClick={onProgram}
          />
          <ActionCard
            icon={<FileText />}
            title="Individual Projects"
            description={`${projects.length} project estimates are available for editing.`}
            onClick={() => {
              if (projects[0]) onProject(projects[0].id);
            }}
          />
          <ActionCard
            icon={<Plus />}
            title="Add New Project"
            description="Create a new estimate with workshop notes and volumetric rows."
            onClick={onAddProject}
          />
        </div>
        <Card className="border-blue-100 shadow-sm">
          <CardHeader className="border-blue-100">
            <CardTitle className="text-lg text-slate-950">Projects</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {projects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => onProject(project.id)}
                className="rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-blue-300"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-950">{project.name}</p>
                    <p className="text-xs text-slate-500">{project.projectNumber}</p>
                  </div>
                  <Badge>{project.status}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">Delivery cost</p>
                    <p className="font-semibold">{formatCurrency(project.estimate.deliveryCost)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">ROI</p>
                    <p className="font-semibold text-blue-700">
                      {formatNumber(project.estimate.roiMultiple)}x
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProgramView({
  client,
  projects,
  processes,
  settings,
  onProject,
}: {
  client: Client;
  projects: Project[];
  processes: ProcessRow[];
  settings: GlobalSettings;
  onProject: (projectId: string) => void;
}) {
  const summary = getProjectTotals(projects);
  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Client projects" value={String(projects.length)} icon={<FileText />} />
        <MetricCard label="Delivery cost" value={formatCurrency(summary.deliveryCost)} icon={<Calculator />} />
        <MetricCard label="Annual saving" value={formatCurrency(summary.annualSaving)} icon={<LineChart />} />
        <MetricCard label="Average ROI" value={`${formatNumber(summary.averageRoi)}x`} icon={<Gauge />} />
      </div>
      <Card className="border-blue-100 shadow-sm">
        <CardHeader className="border-blue-100">
          <CardTitle className="text-lg text-slate-950">{client.name} Program Level View</CardTitle>
          <p className="text-sm text-slate-500">
            Dashboard table showing all scoped automation projects for this client.
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-[1300px] text-left text-sm">
            <thead className="bg-blue-50 text-xs uppercase tracking-wide text-blue-700">
              <tr>
                {[
                  "Project #",
                  "Project name",
                  "Processes",
                  "BA days",
                  "Dev days",
                  "AL days",
                  "Delivery cost",
                  "As-is cost",
                  "To-be cost",
                  "% automatable",
                  "Annual saving",
                  "ROI",
                  "Payback",
                  "Status",
                  "Last recalculated",
                ].map((heading) => (
                  <th key={heading} className="px-3 py-2 font-semibold">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => {
                const scopedProcesses = processes.filter((process) => process.projectId === project.id);
                const automatable = scopedProcesses.length > 0
                  ? scopedProcesses.reduce((sum, process) => sum + process.automatablePercentage, 0) /
                    scopedProcesses.length
                  : settings.defaultAutomatablePercentage;
                return (
                  <tr key={project.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-3 font-medium text-blue-700">
                      <button type="button" onClick={() => onProject(project.id)} className="hover:underline">
                        {project.projectNumber}
                      </button>
                    </td>
                    <td className="px-3 py-3">{project.name}</td>
                    <td className="px-3 py-3">{project.processesInScope}</td>
                    <td className="px-3 py-3">{formatNumber(project.estimate.baDays)}</td>
                    <td className="px-3 py-3">{formatNumber(project.estimate.devDays)}</td>
                    <td className="px-3 py-3">{formatNumber(project.estimate.accountLeadDays)}</td>
                    <td className="px-3 py-3">{formatCurrency(project.estimate.deliveryCost)}</td>
                    <td className="px-3 py-3">{formatCurrency(project.estimate.asIsCost)}</td>
                    <td className="px-3 py-3">{formatCurrency(project.estimate.toBeCost)}</td>
                    <td className="px-3 py-3">{formatNumber(automatable)}%</td>
                    <td className="px-3 py-3 font-medium text-blue-700">
                      {formatCurrency(project.estimate.annualSaving)}
                    </td>
                    <td className="px-3 py-3">{formatNumber(project.estimate.roiMultiple)}x</td>
                    <td className="px-3 py-3">{formatNumber(project.estimate.paybackMonths)} months</td>
                    <td className="px-3 py-3">
                      <Badge>{project.status}</Badge>
                    </td>
                    <td className="px-3 py-3">{formatDate(project.estimate.lastRecalculatedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function ProjectView({
  project,
  processes,
  settings,
  auditHistory,
  onUpdateProject,
  onUpdateProcess,
  onUpdatePhase,
  onIngestWorkshop,
  onImportCsv,
  onRecalculate,
}: {
  project: Project;
  processes: ProcessRow[];
  settings: GlobalSettings;
  auditHistory: AuditEntry[];
  onUpdateProject: <K extends keyof Project>(projectId: string, field: K, value: Project[K]) => void;
  onUpdateProcess: <K extends keyof ProcessRow>(processId: string, field: K, value: ProcessRow[K]) => void;
  onUpdatePhase: <K extends keyof PhaseEstimate>(
    projectId: string,
    phaseName: PhaseName,
    field: K,
    value: PhaseEstimate[K],
  ) => void;
  onIngestWorkshop: (projectId: string) => void;
  onImportCsv: (projectId: string) => void;
  onRecalculate: (projectId: string, mode: "resourcesChanged" | "durationChanged" | "recalculate") => void;
}) {
  const maxChartValue = Math.max(project.estimate.deliveryCost, project.estimate.annualSaving, 1);
  return (
    <div className="space-y-6">
      <Card className="border-blue-100 shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Project number">
                <Input
                  value={project.projectNumber}
                  onChange={(event) => onUpdateProject(project.id, "projectNumber", event.target.value)}
                />
              </Field>
              <Field label="Project name">
                <Input
                  value={project.name}
                  onChange={(event) => onUpdateProject(project.id, "name", event.target.value)}
                />
              </Field>
              <Field label="Status">
                <Select
                  value={project.status}
                  onValueChange={(value) => onUpdateProject(project.id, "status", value as ProjectStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Last recalculated">
                <Input value={formatDate(project.estimate.lastRecalculatedAt)} readOnly />
              </Field>
            </div>
            <Button onClick={() => onRecalculate(project.id, "recalculate")} className="lg:mt-6">
              <RefreshCw className="h-4 w-4" /> Recalculate Estimate
            </Button>
          </div>
        </CardContent>
      </Card>

      {project.estimate.warnings.length > 0 || project.unclearFields.length > 0 ? (
        <div className="space-y-2">
          {[...project.estimate.warnings, ...project.unclearFields.map((field) => `${field} is unclear and flagged for review.`)].map(
            (warning) => (
              <div
                key={warning}
                className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{warning}</span>
              </div>
            ),
          )}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Delivery cost" value={formatCurrency(project.estimate.deliveryCost)} icon={<Calculator />} />
        <MetricCard label="As-is cost" value={formatCurrency(project.estimate.asIsCost)} icon={<Users />} />
        <MetricCard label="To-be cost" value={formatCurrency(project.estimate.toBeCost)} icon={<SlidersHorizontal />} />
        <MetricCard label="Annual saving" value={formatCurrency(project.estimate.annualSaving)} icon={<LineChart />} />
        <MetricCard label="Payback" value={`${formatNumber(project.estimate.paybackMonths)} months`} icon={<Clock />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="border-blue-100 shadow-sm">
          <CardHeader className="border-blue-100">
            <CardTitle className="flex items-center gap-2 text-lg text-slate-950">
              <Upload className="h-5 w-5 text-blue-600" /> Ingestion workspace
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            <Field label="Workshop text dump">
              <Textarea
                value={project.workshopText}
                rows={12}
                onChange={(event) => onUpdateProject(project.id, "workshopText", event.target.value)}
              />
              <Button variant="outline" className="mt-2" onClick={() => onIngestWorkshop(project.id)}>
                Extract workshop fields
              </Button>
            </Field>
            <Field label="CSV volumetric file">
              <Textarea
                value={project.volumetricCsv}
                rows={12}
                onChange={(event) => onUpdateProject(project.id, "volumetricCsv", event.target.value)}
              />
              <Button variant="outline" className="mt-2" onClick={() => onImportCsv(project.id)}>
                Parse CSV rows
              </Button>
            </Field>
          </CardContent>
        </Card>

        <Card className="border-blue-100 shadow-sm">
          <CardHeader className="border-blue-100">
            <CardTitle className="flex items-center gap-2 text-lg text-slate-950">
              <BarChart3 className="h-5 w-5 text-blue-600" /> Cost vs saving
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ChartBar
              label="Delivery cost"
              value={project.estimate.deliveryCost}
              max={maxChartValue}
              className="bg-blue-600"
            />
            <ChartBar
              label="Annual saving"
              value={project.estimate.annualSaving}
              max={maxChartValue}
              className="bg-emerald-500"
            />
            <div className="grid grid-cols-2 gap-3 rounded-2xl bg-blue-50 p-4">
              <div>
                <p className="text-xs text-blue-700">ROI multiple</p>
                <p className="text-2xl font-semibold text-blue-950">
                  {formatNumber(project.estimate.roiMultiple)}x
                </p>
              </div>
              <div>
                <p className="text-xs text-blue-700">Duration</p>
                <p className="text-2xl font-semibold text-blue-950">
                  {formatNumber(project.estimate.durationWeeks)}w
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-blue-100 shadow-sm">
        <CardHeader className="border-blue-100">
          <CardTitle className="flex items-center gap-2 text-lg text-slate-950">
            <SlidersHorizontal className="h-5 w-5 text-blue-600" /> Resource and duration logic
          </CardTitle>
          <p className="text-sm text-slate-500">
            Edit resources to recalculate duration, or use the duration slider to recommend BA and developer resources.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-5">
          <Field label="Number of BAs">
            <Input
              type="number"
              min={1}
              value={project.numberOfBas}
              onChange={(event) => onUpdateProject(project.id, "numberOfBas", numberFromInput(event.target.value))}
              onBlur={() => onRecalculate(project.id, "resourcesChanged")}
            />
            <p className="mt-1 text-xs text-slate-500">
              Recommended: {project.estimate.recommendedBas}
            </p>
          </Field>
          <Field label="Number of developers">
            <Input
              type="number"
              min={1}
              value={project.numberOfDevelopers}
              onChange={(event) =>
                onUpdateProject(project.id, "numberOfDevelopers", numberFromInput(event.target.value))
              }
              onBlur={() => onRecalculate(project.id, "resourcesChanged")}
            />
            <p className="mt-1 text-xs text-slate-500">
              Recommended: {project.estimate.recommendedDevelopers}
            </p>
          </Field>
          <Field label="Project duration in weeks">
            <Input
              type="range"
              min={2}
              max={32}
              value={project.durationWeeks}
              onChange={(event) => onUpdateProject(project.id, "durationWeeks", numberFromInput(event.target.value))}
              onPointerUp={() => onRecalculate(project.id, "durationChanged")}
            />
            <p className="mt-1 text-xs text-slate-500">{project.durationWeeks} weeks</p>
          </Field>
          <Field label="Processes in scope">
            <Input
              type="number"
              min={1}
              value={project.processesInScope}
              onChange={(event) =>
                onUpdateProject(project.id, "processesInScope", numberFromInput(event.target.value))
              }
            />
          </Field>
          <Field label="Account Lead days override">
            <Input
              type="number"
              min={0}
              placeholder={`${formatNumber(project.estimate.durationWeeks * settings.defaultAccountLeadDaysPerWeek)} default`}
              value={project.accountLeadDaysOverride ?? ""}
              onChange={(event) =>
                onUpdateProject(
                  project.id,
                  "accountLeadDaysOverride",
                  event.target.value === "" ? null : numberFromInput(event.target.value),
                )
              }
            />
          </Field>
        </CardContent>
      </Card>

      <EditableProcessesTable
        processes={processes}
        settings={settings}
        onUpdateProcess={onUpdateProcess}
      />

      <EditablePhasesTable
        project={project}
        onUpdatePhase={onUpdatePhase}
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <ListEditor
          title="Assumptions"
          values={project.assumptions}
          onChange={(values) => onUpdateProject(project.id, "assumptions", values)}
        />
        <ListEditor
          title="Risks"
          values={project.risks}
          onChange={(values) => onUpdateProject(project.id, "risks", values)}
        />
        <ListEditor
          title="Dependencies"
          values={project.dependencies}
          onChange={(values) => onUpdateProject(project.id, "dependencies", values)}
        />
      </div>

      <Card className="border-blue-100 shadow-sm">
        <CardHeader className="border-blue-100">
          <CardTitle className="flex items-center gap-2 text-lg text-slate-950">
            <Database className="h-5 w-5 text-blue-600" /> Audit and recalculation history
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {auditHistory.map((entry) => (
            <div key={entry.id} className="rounded-xl border border-slate-200 p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <Badge>{entry.action}</Badge>
                <span className="text-xs text-slate-500">{new Date(entry.at).toLocaleString()}</span>
              </div>
              <p className="mt-2 text-slate-700">{entry.summary}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function EditableProcessesTable({
  processes,
  settings,
  onUpdateProcess,
}: {
  processes: ProcessRow[];
  settings: GlobalSettings;
  onUpdateProcess: <K extends keyof ProcessRow>(processId: string, field: K, value: ProcessRow[K]) => void;
}) {
  return (
    <Card className="border-blue-100 shadow-sm">
      <CardHeader className="border-blue-100">
        <CardTitle className="text-lg text-slate-950">Editable process and volumetric rows</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="min-w-[1500px] text-left text-sm">
          <thead className="bg-blue-50 text-xs uppercase tracking-wide text-blue-700">
            <tr>
              {[
                "Process",
                "Description",
                "Applications",
                "Complexity",
                "Steps",
                "Rules",
                "Exceptions",
                "Integrations",
                "Data complexity",
                "Frequency",
                "Volume",
                "Minutes",
                "Employees",
                "Automatable %",
                "As-is cost",
                "Review flags",
              ].map((heading) => (
                <th key={heading} className="px-3 py-2">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {processes.map((process) => (
              <tr key={process.id} className="border-b border-slate-100 align-top">
                <td className="px-3 py-2">
                  <Input
                    value={process.name}
                    onChange={(event) => onUpdateProcess(process.id, "name", event.target.value)}
                    className="min-w-44"
                  />
                </td>
                <td className="px-3 py-2">
                  <Textarea
                    value={process.description}
                    onChange={(event) => onUpdateProcess(process.id, "description", event.target.value)}
                    className="min-w-64"
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    value={process.applications}
                    onChange={(event) => onUpdateProcess(process.id, "applications", event.target.value)}
                    className="min-w-48"
                  />
                </td>
                <td className="px-3 py-2">
                  <Select
                    value={process.complexity}
                    onValueChange={(value) => onUpdateProcess(process.id, "complexity", value as Complexity)}
                  >
                    <SelectTrigger className="min-w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {complexities.map((complexity) => (
                        <SelectItem key={complexity} value={complexity}>
                          {complexity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <NumberCell
                  value={process.steps}
                  onChange={(value) => onUpdateProcess(process.id, "steps", value)}
                />
                <NumberCell
                  value={process.businessRules}
                  onChange={(value) => onUpdateProcess(process.id, "businessRules", value)}
                />
                <NumberCell
                  value={process.exceptions}
                  onChange={(value) => onUpdateProcess(process.id, "exceptions", value)}
                />
                <td className="px-3 py-2">
                  <Input
                    value={process.integrations}
                    onChange={(event) => onUpdateProcess(process.id, "integrations", event.target.value)}
                    className="min-w-48"
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    value={process.dataDocumentComplexity}
                    onChange={(event) =>
                      onUpdateProcess(process.id, "dataDocumentComplexity", event.target.value)
                    }
                    className="min-w-40"
                  />
                </td>
                <td className="px-3 py-2">
                  <Select
                    value={process.frequency}
                    onValueChange={(value) => onUpdateProcess(process.id, "frequency", value as Frequency)}
                  >
                    <SelectTrigger className="min-w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencies.map((frequency) => (
                        <SelectItem key={frequency} value={frequency}>
                          {frequencyLabels[frequency]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <NumberCell
                  value={process.activityVolume}
                  onChange={(value) => onUpdateProcess(process.id, "activityVolume", value)}
                />
                <NumberCell
                  value={process.averageProcessingTimeMinutes}
                  onChange={(value) => onUpdateProcess(process.id, "averageProcessingTimeMinutes", value)}
                />
                <NumberCell
                  value={process.employees}
                  onChange={(value) => onUpdateProcess(process.id, "employees", value)}
                />
                <NumberCell
                  value={process.automatablePercentage}
                  onChange={(value) => onUpdateProcess(process.id, "automatablePercentage", value)}
                />
                <td className="px-3 py-2 font-medium text-blue-700">
                  {formatCurrency(calculateProcessAsIsCost(process, settings))}
                </td>
                <td className="px-3 py-2">
                  {process.flaggedFields.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {process.flaggedFields.map((field) => (
                        <Badge key={field} className="border-amber-200 bg-amber-50 text-amber-800">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Reviewed</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function EditablePhasesTable({
  project,
  onUpdatePhase,
}: {
  project: Project;
  onUpdatePhase: <K extends keyof PhaseEstimate>(
    projectId: string,
    phaseName: PhaseName,
    field: K,
    value: PhaseEstimate[K],
  ) => void;
}) {
  return (
    <Card className="border-blue-100 shadow-sm">
      <CardHeader className="border-blue-100">
        <CardTitle className="text-lg text-slate-950">Editable phase estimate table</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="min-w-[1000px] text-left text-sm">
          <thead className="bg-blue-50 text-xs uppercase tracking-wide text-blue-700">
            <tr>
              {["Phase", "BA days", "Dev days", "Assumptions", "Confidence", "Notes"].map((heading) => (
                <th key={heading} className="px-3 py-2">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {project.phaseEstimates.map((phase) => (
              <tr key={phase.phase} className="border-b border-slate-100 align-top">
                <td className="px-3 py-3 font-semibold text-slate-900">{phase.phase}</td>
                <NumberCell
                  value={phase.baDays}
                  onChange={(value) => onUpdatePhase(project.id, phase.phase, "baDays", value)}
                />
                <NumberCell
                  value={phase.devDays}
                  onChange={(value) => onUpdatePhase(project.id, phase.phase, "devDays", value)}
                />
                <td className="px-3 py-2">
                  <Input
                    value={phase.assumptions}
                    onChange={(event) =>
                      onUpdatePhase(project.id, phase.phase, "assumptions", event.target.value)
                    }
                    className="min-w-72"
                  />
                </td>
                <td className="px-3 py-2">
                  <Select
                    value={phase.confidence}
                    onValueChange={(value) =>
                      onUpdatePhase(project.id, phase.phase, "confidence", value as ConfidenceLevel)
                    }
                  >
                    <SelectTrigger className="min-w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {confidenceLevels.map((confidence) => (
                        <SelectItem key={confidence} value={confidence}>
                          {confidence}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-3 py-2">
                  <Input
                    value={phase.notes}
                    onChange={(event) => onUpdatePhase(project.id, phase.phase, "notes", event.target.value)}
                    className="min-w-80"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function SettingsView({
  settings,
  onUpdateSettings,
}: {
  settings: GlobalSettings;
  onUpdateSettings: <K extends keyof GlobalSettings>(field: K, value: GlobalSettings[K]) => void;
}) {
  return (
    <Card className="border-blue-100 shadow-sm">
      <CardHeader className="border-blue-100">
        <CardTitle className="flex items-center gap-2 text-lg text-slate-950">
          <Settings className="h-5 w-5 text-blue-600" /> Editable global settings
        </CardTitle>
        <p className="text-sm text-slate-500">
          These values drive all recalculations and are structured for later Firebase/Supabase persistence.
        </p>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SettingsNumber label="BA day rate" value={settings.baDayRate} onChange={(value) => onUpdateSettings("baDayRate", value)} />
        <SettingsNumber label="Developer day rate" value={settings.developerDayRate} onChange={(value) => onUpdateSettings("developerDayRate", value)} />
        <SettingsNumber label="Account Lead day rate" value={settings.accountLeadDayRate} onChange={(value) => onUpdateSettings("accountLeadDayRate", value)} />
        <SettingsNumber label="Blended hourly rate" value={settings.blendedHourlyRate} onChange={(value) => onUpdateSettings("blendedHourlyRate", value)} />
        <SettingsNumber label="Default automatable %" value={settings.defaultAutomatablePercentage} onChange={(value) => onUpdateSettings("defaultAutomatablePercentage", value)} />
        <SettingsNumber label="Working hours per day" value={settings.workingHoursPerDay} onChange={(value) => onUpdateSettings("workingHoursPerDay", value)} />
        <SettingsNumber label="Working days per year" value={settings.workingDaysPerYear} onChange={(value) => onUpdateSettings("workingDaysPerYear", value)} />
        <SettingsNumber label="Contingency %" value={settings.contingencyPercentage} onChange={(value) => onUpdateSettings("contingencyPercentage", value)} />
        <SettingsNumber label="Default Account Lead days/week" value={settings.defaultAccountLeadDaysPerWeek} onChange={(value) => onUpdateSettings("defaultAccountLeadDaysPerWeek", value)} />
        <SettingsNumber label="BA max processes over duration" value={settings.baMaxProcessesPerBa} onChange={(value) => onUpdateSettings("baMaxProcessesPerBa", value)} />
        <SettingsNumber label="BA capacity duration weeks" value={settings.baCapacityDurationWeeks} onChange={(value) => onUpdateSettings("baCapacityDurationWeeks", value)} />
        <SettingsNumber label="Dev days per developer/week" value={settings.devDaysPerDeveloperPerWeek} onChange={(value) => onUpdateSettings("devDaysPerDeveloperPerWeek", value)} />
      </CardContent>
    </Card>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
        </div>
        <div className="rounded-xl bg-blue-600 p-2 text-white [&_svg]:h-5 [&_svg]:w-5">{icon}</div>
      </div>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-blue-100 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md"
    >
      <div className="mb-3 inline-flex rounded-xl bg-blue-50 p-2 text-blue-700 [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </div>
      <p className="font-semibold text-slate-950">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </button>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function NavButton({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-medium transition",
        active
          ? "border-blue-600 bg-blue-600 text-white"
          : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700",
      )}
    >
      {children}
    </button>
  );
}

function NumberCell({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <td className="px-3 py-2">
      <Input
        type="number"
        value={value}
        onChange={(event) => onChange(numberFromInput(event.target.value))}
        className="min-w-24"
      />
    </td>
  );
}

function SettingsNumber({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label}>
      <Input type="number" value={value} onChange={(event) => onChange(numberFromInput(event.target.value))} />
    </Field>
  );
}

function ChartBar({
  label,
  value,
  max,
  className,
}: {
  label: string;
  value: number;
  max: number;
  className: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">{formatCurrency(value)}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div className={cn("h-full rounded-full", className)} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
      </div>
    </div>
  );
}

function MiniBars({ deliveryCost, annualSaving }: { deliveryCost: number; annualSaving: number }) {
  const max = Math.max(deliveryCost, annualSaving, 1);
  return (
    <div className="mt-3 space-y-1.5">
      <div className="h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-blue-500" style={{ width: `${Math.min(100, (deliveryCost / max) * 100)}%` }} />
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.min(100, (annualSaving / max) * 100)}%` }} />
      </div>
    </div>
  );
}

function ListEditor({
  title,
  values,
  onChange,
}: {
  title: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <Card className="border-blue-100 shadow-sm">
      <CardHeader className="border-blue-100">
        <CardTitle className="text-lg text-slate-950">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          value={values.join("\n")}
          rows={6}
          onChange={(event) =>
            onChange(event.target.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean))
          }
        />
      </CardContent>
    </Card>
  );
}

function getPortfolioTotals(state: EstimatorState) {
  return {
    totalClients: state.clients.length,
    totalProjects: state.projects.length,
    totalDeliveryCost: state.projects.reduce((sum, project) => sum + project.estimate.deliveryCost, 0),
    totalAnnualSaving: state.projects.reduce((sum, project) => sum + project.estimate.annualSaving, 0),
  };
}

function getProjectTotals(projects: Project[]) {
  const deliveryCost = projects.reduce((sum, project) => sum + project.estimate.deliveryCost, 0);
  const annualSaving = projects.reduce((sum, project) => sum + project.estimate.annualSaving, 0);
  const averageRoi =
    projects.length > 0
      ? projects.reduce((sum, project) => sum + project.estimate.roiMultiple, 0) / projects.length
      : 0;
  return { deliveryCost, annualSaving, averageRoi };
}

function numberFromInput(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
