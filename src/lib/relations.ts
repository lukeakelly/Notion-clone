import type { LinkRelation } from "@prisma/client";

export const RELATIONS: { value: LinkRelation; label: string; inverse: string }[] = [
  { value: "supports", label: "supports", inverse: "is supported by" },
  { value: "depends_on", label: "depends on", inverse: "is depended on by" },
  { value: "blocks", label: "blocks", inverse: "is blocked by" },
  { value: "informed_by", label: "informed by", inverse: "informs" },
  { value: "validates", label: "validates", inverse: "is validated by" },
  { value: "invalidates", label: "invalidates", inverse: "is invalidated by" },
  { value: "contradicts", label: "contradicts", inverse: "is contradicted by" },
  { value: "supersedes", label: "supersedes", inverse: "is superseded by" },
  { value: "belongs_to", label: "belongs to", inverse: "has" },
  { value: "addresses", label: "addresses", inverse: "is addressed by" },
  { value: "affects", label: "affects", inverse: "is affected by" },
  { value: "derived_from", label: "derived from", inverse: "is source of" },
  { value: "linked_to", label: "linked to", inverse: "linked from" },
];

export const RELATION_LABELS: Record<LinkRelation, { forward: string; inverse: string }> =
  Object.fromEntries(
    RELATIONS.map((r) => [r.value, { forward: r.label, inverse: r.inverse }]),
  ) as Record<LinkRelation, { forward: string; inverse: string }>;

export const PHASES = ["mvp", "v1", "v1_5", "v2", "backlog"] as const;
export const PHASE_LABELS: Record<string, string> = {
  mvp: "MVP",
  v1: "v1",
  v1_5: "v1.5",
  v2: "v2",
  backlog: "Backlog",
};

export const WORKSTREAMS = [
  "product",
  "engineering",
  "telephony",
  "ux",
  "gtm",
  "pricing",
  "legal",
  "pilot",
  "support",
] as const;
