import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function titleCase(input: string): string {
  return input
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function riskRating(likelihood?: string | number, impact?: string | number) {
  const l = Number(likelihood);
  const i = Number(impact);
  if (!Number.isFinite(l) || !Number.isFinite(i) || l < 1 || i < 1) return null;
  const score = l * i;
  let level: "low" | "medium" | "high" | "critical" = "low";
  if (score >= 20) level = "critical";
  else if (score >= 12) level = "high";
  else if (score >= 6) level = "medium";
  return { score, level };
}
