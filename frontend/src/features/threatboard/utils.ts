import type { AssetVulnerabilityMatch, Vulnerability } from "./types";

export function formatPercent(value?: number | null) {
  if (value === null || value === undefined) {
    return "Not set";
  }
  return `${Math.round(value * 100)}%`;
}

export function formatDateValue(value?: string | null) {
  if (!value) {
    return "Not set";
  }
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    new Date(`${value}T00:00:00`),
  );
}

export function isKnownExploited(vulnerability: Vulnerability) {
  return Boolean(vulnerability.score?.kev_known_exploited || vulnerability.date_added_to_kev);
}

export function isOverdue(dateValue?: string | null) {
  if (!dateValue) {
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(`${dateValue}T00:00:00`);
  return dueDate < today;
}

export function matchSearchText(match: AssetVulnerabilityMatch) {
  return [
    match.asset.name,
    match.asset.vendor,
    match.asset.product,
    match.vulnerability.cve_id,
    match.vulnerability.title,
    match.vulnerability.vendor,
    match.vulnerability.product,
  ]
    .join(" ")
    .toLowerCase();
}

export function vulnerabilitySearchText(vulnerability: Vulnerability) {
  return [
    vulnerability.cve_id,
    vulnerability.title,
    vulnerability.vendor,
    vulnerability.product,
    vulnerability.description,
  ]
    .join(" ")
    .toLowerCase();
}
