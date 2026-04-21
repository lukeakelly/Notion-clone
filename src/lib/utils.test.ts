import { describe, expect, it } from "vitest";
import { cn, formatDate, riskRating, titleCase } from "./utils";

describe("utils", () => {
  it("cn merges class names", () => {
    expect(cn("a", undefined, "b", { c: true, d: false })).toBe("a b c");
  });

  it("titleCase normalises underscores", () => {
    expect(titleCase("in_progress")).toBe("In Progress");
  });

  it("formatDate returns empty for null", () => {
    expect(formatDate(null)).toBe("");
  });

  it("formatDate formats Date", () => {
    const out = formatDate(new Date("2025-01-15T00:00:00Z"));
    expect(out.length).toBeGreaterThan(0);
  });

  it("riskRating computes correct band", () => {
    expect(riskRating(1, 1)?.level).toBe("low");
    expect(riskRating(3, 3)?.level).toBe("medium");
    expect(riskRating(4, 4)?.level).toBe("high");
    expect(riskRating(5, 5)?.level).toBe("critical");
    expect(riskRating(undefined, 5)).toBeNull();
  });
});
