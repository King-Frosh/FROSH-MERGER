export function formatBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(value >= 100 || i === 0 ? 0 : decimals)} ${sizes[i]}`;
}

export function savingsPercent(original: number, result: number): number {
  if (original <= 0) return 0;
  return Math.max(-200, Math.round(((original - result) / original) * 100));
}

export function uniqueName(base: string, taken: Set<string>, max = 28): string {
  let name = base.replace(/\.[^.]+$/, "").trim() || "Sheet";
  name = name.slice(0, max);
  let candidate = name;
  let i = 2;
  while (taken.has(candidate)) {
    const suffix = ` (${i})`;
    candidate = name.slice(0, max - suffix.length) + suffix;
    i++;
  }
  taken.add(candidate);
  return candidate;
}

export function sanitizeSheetName(name: string): string {
  const cleaned = name.replace(/[\\/?*[\]:]/g, " ").trim();
  return (cleaned || "Sheet").slice(0, 31);
}
