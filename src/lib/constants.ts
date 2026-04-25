export const PROJECT_TYPES = [
  { value: "web_application", label: "Web Application" },
  { value: "mobile_app", label: "Mobile App" },
  { value: "internal_app", label: "Internal Business Application" },
  { value: "saas_product", label: "SaaS Product" },
  { value: "ai_application", label: "AI Application" },
  { value: "agentic_workflow", label: "Agentic Workflow" },
  { value: "integration_platform", label: "Integration Platform" },
  { value: "data_dashboard", label: "Data Dashboard" },
  { value: "portal", label: "Portal" },
  { value: "automation_platform", label: "Automation Platform" },
  { value: "legacy_replacement", label: "Legacy System Replacement" },
] as const;

export const ESTIMATE_TYPES = [
  { value: "rom", label: "Rough Order of Magnitude" },
  { value: "discovery", label: "Discovery Estimate" },
  { value: "delivery", label: "Delivery Estimate" },
  { value: "change_request", label: "Change Request Estimate" },
  { value: "mvp_vs_full", label: "MVP vs Full Scope Estimate" },
] as const;

export const ESTIMATE_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "needs_information", label: "Needs Information" },
  { value: "ready_for_review", label: "Ready for Review" },
  { value: "reviewed", label: "Reviewed" },
  { value: "approved", label: "Approved" },
  { value: "sent_to_client", label: "Sent to Client" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "archived", label: "Archived" },
] as const;

export const INDUSTRIES = [
  "Financial Services", "Healthcare", "Education", "Retail",
  "Government", "Technology", "Manufacturing", "Energy",
  "Media", "Telecommunications", "Professional Services",
  "Real Estate", "Non-Profit", "Transport & Logistics", "Other",
] as const;

export const SCOPE_CATEGORIES = [
  { value: "frontend", label: "Front End" },
  { value: "backend", label: "Back End" },
  { value: "integration", label: "Integration" },
  { value: "data", label: "Data" },
  { value: "ai", label: "AI / ML" },
  { value: "devops", label: "DevOps" },
  { value: "testing", label: "Testing" },
  { value: "design", label: "Design" },
  { value: "security", label: "Security" },
] as const;

export const PRIORITIES = [
  { value: "must", label: "Must Have" },
  { value: "should", label: "Should Have" },
  { value: "could", label: "Could Have" },
  { value: "wont", label: "Won't Have" },
] as const;

export const COMPLEXITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "very_high", label: "Very High" },
] as const;

export const EFFORT_DRIVERS = [
  { value: "screen", label: "Screen / Page" },
  { value: "api", label: "API Endpoint" },
  { value: "workflow", label: "Workflow" },
  { value: "integration", label: "Integration" },
  { value: "report", label: "Report" },
  { value: "data_model", label: "Data Model" },
  { value: "ai_capability", label: "AI Capability" },
  { value: "component", label: "Component" },
  { value: "migration", label: "Data Migration" },
] as const;

export const CONFIDENCE_LEVELS = [
  { value: "high", label: "High", color: "bg-green-100 text-green-800" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
  { value: "low", label: "Low", color: "bg-orange-100 text-orange-800" },
  { value: "very_low", label: "Very Low", color: "bg-red-100 text-red-800" },
] as const;

export const DELIVERY_MODELS = [
  { value: "onshore", label: "Onshore" },
  { value: "offshore", label: "Offshore" },
  { value: "blended", label: "Blended" },
] as const;

export const METHODOLOGIES = [
  { value: "agile", label: "Agile" },
  { value: "waterfall", label: "Waterfall" },
  { value: "hybrid", label: "Hybrid" },
] as const;

export const CURRENCIES = [
  { value: "AUD", label: "AUD ($)", symbol: "$" },
  { value: "USD", label: "USD ($)", symbol: "$" },
  { value: "GBP", label: "GBP (\u00a3)", symbol: "\u00a3" },
  { value: "EUR", label: "EUR (\u20ac)", symbol: "\u20ac" },
  { value: "NZD", label: "NZD ($)", symbol: "$" },
] as const;

export const DEFAULT_ROLES = [
  "Engagement Lead",
  "Project Manager",
  "Business Analyst",
  "Solution Architect",
  "UX Designer",
  "UI Designer",
  "Front End Developer",
  "Back End Developer",
  "Full Stack Developer",
  "AI Engineer",
  "Data Engineer",
  "DevOps Engineer",
  "QA Analyst",
  "Security Specialist",
  "Change Manager",
  "Technical Writer",
] as const;

export const DELIVERY_PHASES = [
  { value: "discovery", label: "Discovery", description: "Confirm scope, requirements, risks", durationRange: "1-2 weeks" },
  { value: "design", label: "Design", description: "UX, solution architecture, backlog", durationRange: "1-2 weeks" },
  { value: "build", label: "Build", description: "Front end, back end, integrations", durationRange: "4-10 weeks" },
  { value: "test", label: "Test", description: "System testing, UAT, defects", durationRange: "2-4 weeks" },
  { value: "release", label: "Release", description: "Deployment, handover, support", durationRange: "1 week" },
] as const;

export const STATUS_COLORS: Record<string, string> = {
  draft: "bg-neutral-100 text-neutral-700",
  needs_information: "bg-amber-100 text-amber-800",
  ready_for_review: "bg-blue-100 text-blue-800",
  reviewed: "bg-indigo-100 text-indigo-800",
  approved: "bg-green-100 text-green-800",
  sent_to_client: "bg-purple-100 text-purple-800",
  won: "bg-emerald-100 text-emerald-800",
  lost: "bg-red-100 text-red-800",
  archived: "bg-neutral-200 text-neutral-500",
};
