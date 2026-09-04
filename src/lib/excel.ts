import { getXLSX } from "./load";

export interface SheetData {
  name: string;
  rows: unknown[][];
}

export interface ParsedFile {
  id: string;
  fileName: string;
  size: number;
  sheets: SheetData[];
  error?: string;
}

export interface FileEntry {
  parsed: ParsedFile;
  sheetIndex: number;
}

export type MergeMode = "vertical" | "sheets";

export interface MergeOptions {
  mode: MergeMode;
  hasHeader: boolean;
  includeFileCol: boolean;
}

export interface MergeStats {
  inputRows: number;
  outputRows: number;
  fileCount: number;
  outputSheets: { name: string; rows: number }[];
}

export interface MergeOutput {
  blob: Blob;
  filename: string;
  stats: MergeStats;
}

const extOf = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";

export function isSpreadsheet(name: string): boolean {
  return ["xlsx", "xls", "xlsb", "csv", "tsv"].includes(extOf(name));
}

export async function parseSpreadsheet(file: File): Promise<ParsedFile> {
  const XLSX = await getXLSX();
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(new Uint8Array(buf), { type: "array", cellDates: false });
  const sheets: SheetData[] = wb.SheetNames.map((sn: string) => {
    const ws = wb.Sheets[sn];
    const rows = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      defval: "",
      raw: true,
    });
    return { name: sn, rows };
  }).filter((s: SheetData) => s.rows.length > 0);

  return {
    id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    fileName: file.name,
    size: file.size,
    sheets,
  };
}

function normalizeHeaders(row: unknown[]): { display: string; key: string }[] {
  const seen = new Map<string, number>();
  return row.map((cell, i) => {
    const text = String(cell ?? "").trim();
    const display = text || `Column ${i + 1}`;
    let base = display.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    if (!base) base = `col${i}`;
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    const key = count > 1 ? `${base}_${count}` : base;
    return { display, key };
  });
}

/**
 * Merge rows for the "vertical" mode (header alignment across files).
 * Pure & synchronous — operates on already-parsed cell data, so no CDN needed.
 */
export function mergeToAoa(entries: FileEntry[], opts: MergeOptions): unknown[][] {
  const valid = entries.filter((e) => e.parsed.sheets.length > 0);
  const chosen = valid.map((e) => ({
    file: e,
    sheet: e.parsed.sheets[e.sheetIndex] ?? e.parsed.sheets[0],
  }));
  const out: unknown[][] = [];
  const includeFileCol = opts.includeFileCol;

  if (!opts.hasHeader) {
    for (const c of chosen) {
      if (!c.sheet) continue;
      if (includeFileCol) c.sheet.rows.forEach((r) => out.push([c.file.parsed.fileName, ...r]));
      else out.push(...c.sheet.rows);
    }
    return out;
  }

  const first = chosen.find((c) => c.sheet && c.sheet.rows.length > 0);
  if (!first?.sheet) return [];

  const orderedKeys: string[] = [];
  if (includeFileCol) orderedKeys.push("__source__");

  const perFile = chosen
    .filter((c) => c.sheet)
    .map((c) => {
      const keys = normalizeHeaders(c.sheet!.rows[0] ?? []);
      const display = new Map<string, string>();
      keys.forEach((k) => {
        if (!orderedKeys.includes(k.key)) orderedKeys.push(k.key);
        if (!display.has(k.key)) display.set(k.key, k.display);
      });
      return { c, keys, display };
    });

  const headerOut: unknown[] = orderedKeys.map((k) =>
    k === "__source__" ? "Source File" : (perFile[0].display.get(k) ?? k)
  );
  out.push(headerOut);

  for (const pf of perFile) {
    const colOf = new Map<string, number>();
    pf.keys.forEach((k, i) => colOf.set(k.key, i));
    const rows = pf.c.sheet!.rows;
    for (let r = 1; r < rows.length; r++) {
      const src = rows[r];
      const row = new Array<unknown>(orderedKeys.length).fill("");
      orderedKeys.forEach((k, idx) => {
        if (k === "__source__") {
          row[idx] = pf.c.file.parsed.fileName;
          return;
        }
        const ci = colOf.get(k);
        if (ci !== undefined && src && ci < src.length) row[idx] = src[ci];
      });
      out.push(row);
    }
  }
  return out;
}

export async function runMerge(entries: FileEntry[], opts: MergeOptions): Promise<MergeOutput> {
  const XLSX = await getXLSX();
  const valid = entries.filter((e) => e.parsed.sheets.length > 0);
  const chosen = valid.map((e) => ({
    file: e,
    sheet: e.parsed.sheets[e.sheetIndex] ?? e.parsed.sheets[0],
  }));
  const inputRows = chosen.reduce((s, c) => s + (c.sheet ? c.sheet.rows.length : 0), 0);
  const wb = XLSX.utils.book_new();
  const outputSheets: { name: string; rows: number }[] = [];
  let outputRows = 0;

  if (opts.mode === "sheets") {
    const used = new Set<string>();
    for (const c of chosen) {
      if (!c.sheet) continue;
      const ws = XLSX.utils.aoa_to_sheet(c.sheet.rows);
      applyColWidths(ws, c.sheet.rows);
      const base = c.file.parsed.fileName.replace(/\.[^.]+$/, "").slice(0, 28) || "Sheet";
      let name = base;
      let i = 2;
      while (used.has(name.toLowerCase())) {
        name = `${base.slice(0, 26)} (${i})`;
        i++;
      }
      used.add(name.toLowerCase());
      XLSX.utils.book_append_sheet(wb, ws, name);
      outputSheets.push({ name, rows: c.sheet.rows.length });
      outputRows += c.sheet.rows.length;
    }
  } else {
    const rows = mergeToAoa(entries, opts);
    outputRows = rows.length ? rows.length - (opts.hasHeader ? 1 : 0) : 0;
    if (rows.length) {
      const ws = XLSX.utils.aoa_to_sheet(rows);
      applyColWidths(ws, rows);
      XLSX.utils.book_append_sheet(wb, ws, "Merged");
      outputSheets.push({ name: "Merged", rows: rows.length });
    }
  }

  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const stats: MergeStats = { inputRows, outputRows, fileCount: valid.length, outputSheets };
  const filename =
    opts.mode === "sheets"
      ? "merged-workbook.xlsx"
      : opts.includeFileCol
      ? "merged-with-source.xlsx"
      : "merged.xlsx";

  return { blob, filename, stats };
}

function applyColWidths(ws: any, rows: unknown[][]) {
  if (!rows[0]) return;
  ws["!cols"] = rows[0].map((_, i) => {
    let w = 8;
    const limit = Math.min(rows.length, 250);
    for (let r = 0; r < limit; r++) {
      const v = rows[r]?.[i];
      const len = v == null ? 0 : String(v).length;
      if (len > w) w = len;
    }
    return { wch: Math.min(w + 2, 40) };
  });
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
