/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client";
import { ENTITIES } from "../src/lib/entities";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Product OS…");

  // ---- User ----
  const user = await prisma.user.upsert({
    where: { email: "founder@product-os.local" },
    update: {},
    create: {
      email: "founder@product-os.local",
      name: "Founder",
      role: "owner",
    },
  });

  // Clear previous seed data (by deleting all records — cascades cover links/activity/tags/attachments/comments/ai)
  await prisma.record.deleteMany({});
  await prisma.tag.deleteMany({});

  // helper to create a record
  const mk = async (input: {
    type: any;
    title: string;
    summary?: string;
    bodyMd?: string;
    status?: string;
    phase?: any;
    priority?: any;
    confidence?: any;
    data?: any;
    tags?: string[];
  }) => {
    const tags = input.tags ?? [];
    const tagConnectors: any[] = [];
    for (const t of tags) {
      const name = t.toLowerCase();
      const tag = await prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name },
      });
      tagConnectors.push({ tag: { connect: { id: tag.id } } });
    }
    return prisma.record.create({
      data: {
        type: input.type,
        title: input.title,
        summary: input.summary,
        bodyMd: input.bodyMd ?? null,
        status: input.status ?? ENTITIES[input.type as keyof typeof ENTITIES].defaultStatus,
        phase: input.phase ?? null,
        priority: input.priority ?? null,
        confidence: input.confidence ?? null,
        data: input.data ?? {},
        createdById: user.id,
        updatedById: user.id,
        ownerId: user.id,
        tags: { create: tagConnectors },
      },
    });
  };

  // ---- Strategy ----
  const vision = await mk({
    type: "vision",
    title: "Telephony-native agentic communications assistant",
    summary:
      "An AI assistant that takes and makes real phone calls on your behalf, with memory and policy controls.",
    status: "validated",
    confidence: "high",
    data: {
      targetOutcome: "Save users 5+ hours/week on routine phone communications",
      horizon: "3 years",
    },
    tags: ["strategy"],
  });

  const problem = await mk({
    type: "problem",
    title: "Busy professionals drop or delay phone calls",
    summary:
      "Inbound calls interrupt; outbound calls require mental context-switching and scheduling.",
    status: "validated",
    data: {
      affectedPersona: "Solo consultants / founders / small-firm partners",
      evidenceStrength: "medium",
      urgency: "high",
      frequency: "frequent",
    },
    tags: ["problem", "customer"],
  });

  const icp = await mk({
    type: "icp",
    title: "UK professional services, 1–20 staff",
    summary: "Law, accounting, insurance, property. Phone still core.",
    status: "validated",
    data: {
      segment: "Professional services",
      industry: "Law / accounting / insurance / property",
      companySize: "1-20",
      geography: "UK",
      buyerType: "Owner / managing partner",
      userType: "Partner, office manager",
      currentPain:
        "Missed client calls cost deals. Reception outsourcing is expensive and low quality.",
      triggerEvents: ["Missed opportunity", "Hired reception provider", "Lost client"],
      budgetFit: "£100-£500/mo per user",
      salesComplexity: "Low: direct sales",
    },
    tags: ["icp", "uk"],
  });

  // ---- Roadmap ----
  const epic = await mk({
    type: "epic",
    title: "Inbound call handling MVP",
    summary: "Pick up calls, qualify intent, capture intent, notify user.",
    status: "scoping",
    phase: "mvp",
    priority: "p0",
    tags: ["inbound", "mvp"],
  });

  const featureA = await mk({
    type: "feature",
    title: "Inbound greeting + intent capture",
    summary:
      "Answer an inbound call with a branded greeting, ask for caller intent, and capture a structured summary.",
    status: "ready",
    phase: "mvp",
    priority: "p0",
    confidence: "medium",
    data: {
      whyItMatters:
        "This is the minimum unit of value: catching calls the user would otherwise miss.",
      userOutcome:
        "Caller reaches a helpful agent instead of voicemail; user receives a summary.",
      acceptanceCriteria: [
        "Inbound PSTN call answered within 1.5s",
        "Agent captures intent, company, callback number",
        "Structured summary delivered to user via email within 60s",
      ],
      nfrImplications: [
        "Voice latency <500ms",
        "99.5% call success rate during pilot",
      ],
      effortEstimate: "L",
      businessValue: "High",
    },
    tags: ["feature", "telephony", "mvp"],
  });

  const featureB = await mk({
    type: "feature",
    title: "Memory: caller history across sessions",
    summary:
      "Agent recognises repeat callers and has continuity of context (last conversation, preferences).",
    status: "scoping",
    phase: "v1",
    priority: "p1",
    confidence: "medium",
    data: {
      whyItMatters: "Differentiator vs. generic call-answering services.",
      userOutcome: "Repeat callers get recognised, not re-qualified.",
      acceptanceCriteria: [
        "Caller-phone-number based lookup",
        "Last-call summary included in agent context",
        "User-editable facts supported",
      ],
    },
    tags: ["feature", "memory"],
  });

  // ---- Decisions ----
  const decTelephony = await mk({
    type: "decision",
    title: "Use Twilio Voice for MVP telephony",
    summary:
      "Chose Twilio over Vonage/Plivo for MVP based on ecosystem maturity and UK PSTN coverage.",
    status: "approved",
    data: {
      domain: "architecture",
      context:
        "We need a telephony provider that handles inbound and outbound with low friction, including UK PSTN and SIP.",
      options: ["Twilio Voice", "Plivo", "Vonage", "Direct SIP trunking"],
      chosenOption: "Twilio Voice",
      whyChosen:
        "Best SDK maturity, mature WebRTC+SIP support, UK PSTN numbers available instantly, well-documented Media Streams API for low-latency STT integration.",
      tradeOffs:
        "Higher per-minute cost than Plivo at scale. Re-evaluate at >200k minutes/mo.",
      consequences:
        "Implementation proceeds against Twilio Media Streams; architecture tightly couples to their event model.",
      reviewDate: "2025-12-31",
    },
    tags: ["decision", "telephony", "architecture"],
  });

  const decStack = await mk({
    type: "decision",
    title: "Next.js + Postgres + Prisma for internal tooling",
    summary: "Monolithic Next.js app with Prisma-backed Postgres for Product OS.",
    status: "approved",
    data: {
      domain: "architecture",
      context: "Internal tooling needs to be deployable by one engineer.",
      options: ["Next.js + Prisma", "Rails", "Laravel", "Django"],
      chosenOption: "Next.js + Prisma",
      whyChosen:
        "Strongest TS ergonomics for solo founder, single-language stack, portable via Docker.",
      tradeOffs: "Next.js server actions still evolving. Acceptable for internal use.",
    },
    tags: ["decision", "stack"],
  });

  // ---- Assumptions / risks ----
  const assumption = await mk({
    type: "assumption",
    title: "Users accept AI greeting if quality is high",
    summary:
      "We assume inbound callers will not abandon if they perceive the agent as competent.",
    status: "validating",
    confidence: "medium",
    data: {
      assumptionType: "Behavioural",
      source: "4 customer discovery calls",
      validationApproach: "Small pilot with 3 friendly firms; measure callback rate.",
      dueDate: "2025-11-30",
    },
    tags: ["assumption"],
  });

  const risk = await mk({
    type: "risk",
    title: "Voice latency above 800ms breaks conversation flow",
    summary: "If round-trip latency exceeds ~800ms, users perceive awkwardness and abandon.",
    status: "mitigating",
    priority: "p0",
    data: {
      riskStatement:
        "If voice latency exceeds 800ms on the inbound path, callers will perceive the agent as broken and hang up.",
      category: "Technical",
      likelihood: "4",
      impact: "5",
      mitigation:
        "Use streaming ASR + streaming TTS; co-locate in eu-west region; measure per-hop latency.",
      contingency:
        "Fall back to 'please hold, connecting you to a human' prompt; escalate to voicemail.",
    },
    tags: ["risk", "telephony", "latency"],
  });

  const dependency = await mk({
    type: "dependency",
    title: "Twilio account verification for UK numbers",
    summary: "Regulatory verification can take 2-6 weeks for UK PSTN numbers.",
    status: "in_progress",
    data: {
      isExternal: "true",
      requiredByDate: "2025-11-15",
      impactIfDelayed: "Blocks inbound pilot.",
    },
    tags: ["dependency", "telephony"],
  });

  // ---- Experiments ----
  const exp = await mk({
    type: "experiment",
    title: "Voice quality bake-off: Twilio vs. Plivo vs. Daily",
    summary: "Compare voice quality and latency across three providers on UK PSTN.",
    status: "planned",
    phase: "mvp",
    data: {
      hypothesis: "Twilio will give best quality and ≤500ms latency on UK PSTN.",
      objective: "Choose telephony provider with confidence.",
      method:
        "Place 20 calls per provider through a scripted flow. Record, transcribe, score.",
      sampleOrEnv: "3 UK phone numbers, 3 networks.",
      successMetrics: ["p50 latency < 500ms", "Quality score ≥ 4/5", "Zero dropped calls"],
      startDate: "2025-11-01",
      endDate: "2025-11-10",
      template: "voice_quality",
      rubricQuality: "",
      rubricReliability: "",
      rubricCost: "",
      rubricSpeed: "",
      rubricUx: "",
      rubricRisk: "",
    },
    tags: ["experiment", "telephony", "voice"],
  });

  const exp2 = await mk({
    type: "experiment",
    title: "ASR accuracy: Deepgram vs. AssemblyAI vs. Whisper",
    summary:
      "Compare transcription accuracy under UK accents and telephony audio (8kHz narrowband).",
    status: "running",
    data: {
      hypothesis: "Deepgram Nova-2 ≥ 90% WER on telephony-quality UK English.",
      objective: "Choose ASR for MVP.",
      method: "Curated 30-call corpus, blind scoring.",
      successMetrics: ["WER ≤ 10% on telephony audio"],
      template: "asr_accuracy",
    },
    tags: ["experiment", "asr"],
  });

  // ---- Research ----
  const research = await mk({
    type: "researchItem",
    title: "UK small-firm phone usage study 2024",
    summary:
      "Report on call volumes and dropped-call rates at small professional services firms.",
    status: "summarised",
    data: {
      sourceType: "Research report",
      sourceRef: "https://example.com/report-2024",
      date: "2024-09",
      authorOrSource: "PhoneStats Research",
      keyFindings: [
        "Avg 62 inbound calls/day per 5-person firm",
        "23% go unanswered in first ring",
        "11% of missed calls result in lost business",
      ],
    },
    tags: ["research", "uk"],
  });

  const meeting = await mk({
    type: "meetingSummary",
    title: "Discovery call: Acme Legal",
    summary: "Call with managing partner; validates inbound-missed-call pain.",
    status: "actioned",
    data: {
      participants: ["Partner at Acme", "Founder"],
      date: "2025-10-15",
      context: "Discovery call #3",
      topInsights: [
        "They lose ~2 client enquiries a week to unanswered calls after 6pm.",
        "Willing to pay per-call handled, not per-seat.",
      ],
      objections: ["Data residency", "Caller will hang up on AI"],
      opportunities: ["Pilot candidate", "Would refer other partners"],
      followups: ["Send pilot spec", "Ask about GDPR sign-off"],
    },
    tags: ["discovery", "pilot"],
  });

  // ---- Architecture ----
  const archComp = await mk({
    type: "architectureComponent",
    title: "Voice gateway (Twilio Media Streams)",
    summary: "Bridges PSTN call to internal orchestrator via WebSocket audio frames.",
    status: "in_use",
    data: {
      function: "Receives inbound audio, proxies agent audio back.",
      vendorOrInternal: "vendor",
      maturity: "High",
      criticality: "Critical",
    },
    tags: ["architecture", "telephony"],
  });

  const archTelephony = await mk({
    type: "telephonyRecord",
    title: "Inbound call path: Twilio → Media Streams → Orchestrator",
    summary: "Authoritative description of the MVP inbound path.",
    status: "in_use",
    data: {
      provider: "Twilio",
      callPath: "PSTN → Twilio Voice → Media Streams WS → Orchestrator → Deepgram → LLM → TTS → Twilio → PSTN",
      inboundHandling: "Auto-answer with TwiML bin; stream to our WS.",
      outboundHandling: "Outbound REST trigger; dialler flow.",
      numberMgmt: "One UK 02x number per pilot firm.",
      sipPstnAssumptions: "UK PSTN; SIP fallback deferred.",
      fallbackModel: "If orchestrator down, TwiML bin plays 'please call back'.",
      recordingAssumptions: "Recording on consent only; default off.",
      consentImplications: "Need spoken consent per GDPR if recording enabled.",
      latencyNotes: "Target p50 round-trip <500ms.",
      failureModes: "WS disconnect, TTS stall, LLM timeout.",
    },
    tags: ["architecture", "telephony"],
  });

  const memory = await mk({
    type: "memoryModelRecord",
    title: "Personal memory: user preferences and routing rules",
    summary: "Editable memory keyed by user; routes, greeting style, call hours.",
    status: "in_use",
    data: {
      memoryType: "personal",
      retentionLogic: "Indefinite; user-editable.",
      explainabilityControls: "List of stored facts visible in settings.",
      deletionRules: "One-click delete clears all personal memory.",
    },
    tags: ["architecture", "memory"],
  });

  // ---- Pricing ----
  const pricing = await mk({
    type: "pricingModel",
    title: "Small firm: £299/mo per 3-line firm",
    summary: "Flat fee covering 300 call-minutes, with overage at £0.50/min.",
    status: "draft",
    data: {
      structure: "Flat subscription + overage",
      subscriptionAssumptions: "300 inbound call-minutes included",
      includedUsage: "300 minutes / 50 call summaries",
      overages: "£0.50 / minute over",
      setupFees: "£199 one-off onboarding",
      servicesRevenue: "Optional custom voice £499",
      cogsAssumptions: "~£40/mo telephony + £45/mo LLM per firm",
      grossMarginEstimate: "70% target",
      commercialRisks: ["Under-priced at scale", "Overage surprise for customer"],
      targetSegmentFit: "UK small professional services",
    },
    tags: ["pricing"],
  });

  const pkg = await mk({
    type: "package",
    title: "Starter package (pilot firms)",
    summary: "Package offered to the first 10 pilot firms.",
    status: "draft",
    data: {
      targetCustomer: "UK pilot firms 2-10 staff",
      usageIncluded: "300 minutes / 50 summaries",
      exclusions: ["Outbound dialling", "Custom voices"],
      onboardingModel: "1x 90-min onboarding + weekly check-in for 6 weeks",
      supportModel: "Shared Slack channel + email",
      commercialGuardrails: "Overage cap £200/mo",
    },
    tags: ["pricing", "pilot"],
  });

  // ---- GTM ----
  const persona = await mk({
    type: "persona",
    title: "Managing Partner — small law firm",
    summary: "Decision-maker; signs the cheque; allergic to bad client experience.",
    status: "validated",
    data: {
      role: "Managing partner",
      pains: ["Missed calls = lost clients", "Reception providers are bad"],
      buyingTriggers: ["Recent missed client", "Partner complaint"],
      objections: ["GDPR", "AI hallucination", "Data residency"],
      successMetrics: ["Callback rate >90%", "Client NPS unchanged"],
      preferredLanguage: "Plain English, no buzzwords",
      salesCycleNotes: "2-4 weeks; 1 demo, 1 trial, 1 close call.",
    },
    tags: ["gtm", "persona"],
  });

  const useCase = await mk({
    type: "useCase",
    title: "Capture inbound enquiries after-hours",
    summary: "Handle calls after 5:30pm and route to next-day callback.",
    status: "approved",
    data: {
      customerProblem: "Firms close at 5:30pm but clients call until 8pm.",
      actor: "Inbound caller",
      workflowSummary:
        "Call rings; agent answers with firm-specific greeting; qualifies; schedules callback.",
      valueProp: "Never miss a potential client.",
      proofNeeded: "Callback rate & client sentiment data.",
    },
    tags: ["gtm", "use-case"],
  });

  const account = await mk({
    type: "account",
    title: "Acme Legal",
    summary: "Warm pilot candidate; managing partner is bought in.",
    status: "engaged",
    data: {
      sector: "Legal",
      fitScore: "5",
      keyContacts: ["Jane Smith (Managing Partner)", "Dave Green (Office Manager)"],
      nextStep: "Send pilot spec by 2025-11-10",
      concerns: ["Data residency"],
    },
    tags: ["pilot", "account"],
  });

  // ---- Delivery ----
  const milestone = await mk({
    type: "milestone",
    title: "Voice bake-off complete",
    summary: "Decide telephony provider.",
    status: "not_started",
    phase: "mvp",
    data: {
      targetDate: "2025-11-10",
      workstream: "telephony",
      criteria: ["3 providers tested", "Winner selected", "Decision recorded"],
    },
    tags: ["milestone", "mvp"],
  });

  const task1 = await mk({
    type: "task",
    title: "Spin up Twilio trial account",
    summary: "Set up trial + acquire first UK 02x number.",
    status: "done",
    priority: "p1",
    data: { workstream: "telephony" },
  });

  const task2 = await mk({
    type: "task",
    title: "Instrument p50 latency measurement in call harness",
    status: "in_progress",
    priority: "p0",
    data: { workstream: "engineering" },
  });

  const task3 = await mk({
    type: "task",
    title: "Draft pilot agreement with Acme Legal",
    status: "blocked",
    priority: "p1",
    data: { workstream: "legal" },
  });

  // ---- Ideas ----
  const idea1 = await mk({
    type: "idea",
    title: "White-label calls as 'Reception by <Firm>'",
    summary: "Firms brand outbound/inbound greeting with their own name.",
    status: "triaged",
    data: { intendedDestination: "feature" },
  });

  // ---- Links ----
  const link = (fromId: string, toId: string, relation: any, note?: string) =>
    prisma.link.create({
      data: {
        fromId,
        toId,
        relation,
        note,
        createdById: user.id,
      },
    });

  // Problem ↔ Feature
  await link(featureA.id, problem.id, "addresses", "Solves missed-calls pain.");
  await link(featureB.id, problem.id, "addresses");

  // Feature ↔ Epic
  await link(featureA.id, epic.id, "belongs_to");
  // Vision ↔ Problem / Features
  await link(problem.id, vision.id, "supports");
  await link(featureA.id, vision.id, "supports");

  // Decisions ↔ Features
  await link(featureA.id, decTelephony.id, "informed_by", "Twilio chosen for MVP telephony.");
  // Decisions ↔ Architecture
  await link(archTelephony.id, decTelephony.id, "informed_by");
  await link(archComp.id, decTelephony.id, "informed_by");

  // Risks & assumptions ↔ Experiments
  await link(exp.id, risk.id, "validates", "Bake-off directly tests latency risk.");
  await link(exp.id, assumption.id, "validates");
  await link(exp2.id, assumption.id, "validates");

  // Research ↔ Problem / ICP
  await link(research.id, problem.id, "supports");
  await link(research.id, icp.id, "supports");
  await link(meeting.id, icp.id, "supports");
  await link(meeting.id, problem.id, "supports");

  // Use case ↔ Feature / ICP
  await link(useCase.id, featureA.id, "addresses");
  await link(useCase.id, icp.id, "belongs_to");

  // Package ↔ Pricing, ICP
  await link(pkg.id, pricing.id, "belongs_to");
  await link(pkg.id, icp.id, "belongs_to");
  await link(pricing.id, icp.id, "belongs_to");

  // Delivery
  await link(task1.id, featureA.id, "belongs_to");
  await link(task2.id, featureA.id, "belongs_to");
  await link(task3.id, account.id, "belongs_to");
  await link(milestone.id, exp.id, "belongs_to");

  // Dependency ↔ Feature
  await link(featureA.id, dependency.id, "depends_on");

  // Persona ↔ ICP
  await link(persona.id, icp.id, "belongs_to");

  // Idea -> future feature
  await link(idea1.id, featureA.id, "derived_from");

  // Memory model ↔ Feature B
  await link(featureB.id, memory.id, "informed_by");

  // Activity log entries
  await prisma.activity.createMany({
    data: [
      { recordId: featureA.id, actorId: user.id, verb: "created" },
      { recordId: decTelephony.id, actorId: user.id, verb: "created" },
      { recordId: exp.id, actorId: user.id, verb: "created" },
    ],
  });

  // Comment
  await prisma.comment.create({
    data: {
      recordId: featureA.id,
      authorId: user.id,
      bodyMd: "We should make sure to test 3G networks too.",
    },
  });

  console.log(`Seed complete. User: ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
