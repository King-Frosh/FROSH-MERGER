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
  const wb = XLSX.read(new Uint8Array(buf), { type: "array", cellDates: false, dense: true });
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

/** Convert report timestamps to YYYY-MM-DD HH:mm:ss. */
function formatReportDateTime(value: unknown): unknown {
  if (value == null || value === "") return value;

  let date: Date | null = null;

  if (value instanceof Date) {
    date = value;
  } else if (typeof value === "number" && Number.isFinite(value)) {
    date = new Date(Date.UTC(1899, 11, 30) + Math.round(value * 86400000));
  } else if (typeof value === "string") {
    const text = value.trim();
    const direct = text.match(
      /^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?/,
    );
    if (direct) {
      const [, y, mo, d, h, mi, sec = "00"] = direct;
      return `${y.padStart(4, "0")}-${mo.padStart(2, "0")}-${d.padStart(2, "0")} ${h.padStart(2, "0")}:${mi.padStart(2, "0")}:${sec.padStart(2, "0")}`;
    }

    const dmy = text.match(
      /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
    );
    if (dmy) {
      const [, d, mo, y, h = "00", mi = "00", sec = "00"] = dmy;
      return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")} ${h.padStart(2, "0")}:${mi.padStart(2, "0")}:${sec.padStart(2, "0")}`;
    }

    const parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime())) date = parsed;
  }

  if (!date || Number.isNaN(date.getTime())) return value;

  const y = date.getUTCFullYear();
  const mo = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const h = String(date.getUTCHours()).padStart(2, "0");
  const mi = String(date.getUTCMinutes()).padStart(2, "0");
  const sec = String(date.getUTCSeconds()).padStart(2, "0");
  return `${y}-${mo}-${d} ${h}:${mi}:${sec}`;
}

function formatMessagingTimeColumns(rows: unknown[][]): unknown[][] {
  if (!rows.length || !rows[0]) return rows;

  const targetColumns = new Set(["msg time", "submit time", "response time", "deliver time"]);
  const columns = rows[0]
    .map((header, index) => {
      const name = String(header ?? "").trim().toLowerCase();
      return targetColumns.has(name) ? index : -1;
    })
    .filter((index) => index >= 0);

  if (!columns.length) return rows;

  return rows.map((row, rowIndex) => {
    if (rowIndex === 0) return row;
    const formatted = [...row];
    for (const column of columns) formatted[column] = formatReportDateTime(formatted[column]);
    return formatted;
  });
}

/**
 * Merge rows for vertical mode. maxRows is used by the UI preview so it does
 * not build another full merged copy of a large dataset just to show 7 rows.
 */
export function mergeToAoa(entries: FileEntry[], opts: MergeOptions, maxRows?: number): unknown[][] {
  const valid = entries.filter((e) => e.parsed.sheets.length > 0);
  const chosen = valid.map((e) => ({
    file: e,
    sheet: e.parsed.sheets[e.sheetIndex] ?? e.parsed.sheets[0],
  }));
  const out: unknown[][] = [];
  const includeFileCol = opts.includeFileCol;
  const reachedLimit = () => maxRows != null && out.length >= maxRows;

  if (!opts.hasHeader) {
    for (const c of chosen) {
      if (!c.sheet) continue;
      for (const sourceRow of c.sheet.rows) {
        if (includeFileCol) out.push([c.file.parsed.fileName, ...sourceRow]);
        else out.push(sourceRow);
        if (reachedLimit()) return formatMessagingTimeColumns(out.slice(0, maxRows));
      }
    }
    return formatMessagingTimeColumns(out);
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

  const firstHeader = first.sheet.rows[0] ?? [];
  const firstKeys = normalizeHeaders(firstHeader);
  const firstDisplayByKey = new Map(firstKeys.map((k) => [k.key, k.display]));
  const headerOut: unknown[] = orderedKeys.map((k) =>
    k === "__source__" ? "Source File" : (firstDisplayByKey.get(k) ?? perFile[0].display.get(k) ?? k)
  );
  out.push(headerOut);
  if (reachedLimit()) return out.slice(0, maxRows);

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
      if (reachedLimit()) return formatMessagingTimeColumns(out.slice(0, maxRows));
    }
  }
  return formatMessagingTimeColumns(out);
}

export function mergedRowCount(entries: FileEntry[], opts: MergeOptions): number {
  const chosen = entries
    .filter((e) => e.parsed.sheets.length > 0)
    .map((e) => e.parsed.sheets[e.sheetIndex] ?? e.parsed.sheets[0]);
  if (opts.mode !== "vertical") return chosen.reduce((sum, sheet) => sum + (sheet?.rows.length ?? 0), 0);
  const dataRows = chosen.reduce(
    (sum, sheet) => sum + Math.max(0, (sheet?.rows.length ?? 0) - (opts.hasHeader ? 1 : 0)),
    0,
  );
  return dataRows + (opts.hasHeader && dataRows > 0 ? 1 : 0);
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
      const formattedRows = formatMessagingTimeColumns(c.sheet.rows);
      const ws = XLSX.utils.aoa_to_sheet(formattedRows);
      applyColWidths(ws, formattedRows);
      const base = c.file.parsed.fileName.replace(/\.[^.]+$/, "").slice(0, 28) || "Sheet";
      let name = base;
      let i = 2;
      while (used.has(name.toLowerCase())) {
        name = `${base.slice(0, 26)} (${i})`;
        i++;
      }
      used.add(name.toLowerCase());
      XLSX.utils.book_append_sheet(wb, ws, name);
      outputSheets.push({ name, rows: formattedRows.length });
      outputRows += formattedRows.length;
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

  // XLSX ZIPs are uncompressed by default. Compression substantially reduces
  // large export sizes and also lowers the amount of data written to disk.
  const out = XLSX.write(wb, {
    bookType: "xlsx",
    type: "array",
    compression: true,
  });
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
  ws["!cols"] = rows[0].map((header, i) => {
    let w = Math.max(12, String(header ?? "").trim().length + 2);
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
