import { describe, expect, it } from "vitest";
import { ENTITIES, ALL_ENTITIES, MVP_ENTITIES, entityBySlug, MODULES } from "./entities";

describe("entities", () => {
  it("registers every type", () => {
    for (const e of ALL_ENTITIES) {
      expect(ENTITIES[e.type]).toBeDefined();
      expect(ENTITIES[e.type].slug).toBe(e.slug);
    }
  });

  it("has unique slugs", () => {
    const slugs = ALL_ENTITIES.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("has at least 20 MVP entities", () => {
    expect(MVP_ENTITIES.length).toBeGreaterThanOrEqual(20);
  });

  it("resolves by slug", () => {
    expect(entityBySlug("features")?.type).toBe("feature");
    expect(entityBySlug("decisions")?.type).toBe("decision");
    expect(entityBySlug("does-not-exist")).toBeUndefined();
  });

  it("every module references real entity types", () => {
    for (const m of MODULES) {
      for (const t of m.entities) {
        expect(ENTITIES[t]).toBeDefined();
      }
    }
  });
});
