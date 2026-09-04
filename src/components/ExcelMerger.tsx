import { useMemo, useState } from "react";
import {
  isSpreadsheet,
  mergeToAoa,
  parseSpreadsheet,
  runMerge,
  triggerDownload,
  type MergeMode,
  type ParsedFile,
  type SheetData,
} from "@/lib/excel";
import { formatBytes } from "@/lib/format";
import { cn } from "@/utils/cn";
import Dropzone from "./Dropzone";
import {
  AlertIcon,
  CheckIcon,
  ChevronDownIcon,
  DownloadIcon,
  GridMergeIcon,
  LayersIcon,
  MergeIcon,
  RefreshIcon,
  SheetIcon,
  TrashIcon,
} from "./icons";
import { Button, Card, Segmented, Switch } from "./ui";

interface MergeResult {
  blob: Blob;
  filename: string;
  inputRows: number;
  outputRows: number;
  fileCount: number;
  sheets: { name: string; rows: number }[];
  size: number;
}

export default function ExcelMerger() {
  const [parsedFiles, setParsedFiles] = useState<ParsedFile[]>([]);
  const [sheetIdx, setSheetIdx] = useState<Record<string, number>>({});
  const [mode, setMode] = useState<MergeMode>("vertical");
  const [hasHeader, setHasHeader] = useState(true);
  const [includeFileCol, setIncludeFileCol] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [result, setResult] = useState<MergeResult | null>(null);

  const opts = { mode, hasHeader, includeFileCol };

  const entryList = useMemo(
    () => parsedFiles.map((p) => ({ parsed: p, sheetIndex: sheetIdx[p.id] ?? 0 })),
    [parsedFiles, sheetIdx]
  );

  async function handleAdd(list: File[]) {
    const spread = list.filter((f) => isSpreadsheet(f.name));
    const rejected = list.length - spread.length;
    setNotice(null);
    if (spread.length === 0) {
      setNotice("No spreadsheet detected. Add .xlsx, .xls, .csv or .tsv files.");
      return;
    }
    const existing = new Set(parsedFiles.map((f) => `${f.fileName}:${f.size}`));
    const fresh = spread.filter((f) => !existing.has(`${f.name}:${f.size}`));
    if (rejected) setNotice(`${rejected} file(s) ignored — unsupported format.`);

    if (fresh.length === 0) return;
    setBusy(true);
    const parsed: ParsedFile[] = [];
    for (const f of fresh) {
      try {
        parsed.push(await parseSpreadsheet(f));
      } catch {
        setNotice((n) => `${n ?? ""} Could not read ${f.name}.`.trim());
      }
    }
    setParsedFiles((prev) => [...prev, ...parsed]);
    setSheetIdx((prev) => {
      const next = { ...prev };
      parsed.forEach((p) => (next[p.id] = 0));
      return next;
    });
    setBusy(false);
  }

  function removeFile(id: string) {
    setParsedFiles((prev) => prev.filter((f) => f.id !== id));
    setSheetIdx((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setResult(null);
  }

  const preview = useMemo(() => {
    if (mode !== "vertical" || parsedFiles.length === 0) return null;
    const rows = mergeToAoa(entryList, { mode: "vertical", hasHeader, includeFileCol });
    return { rows: rows.slice(0, 7), total: rows.length };
  }, [mode, entryList, hasHeader, includeFileCol, parsedFiles.length]);

  async function doMerge() {
    if (parsedFiles.length === 0) return;
    setBusy(true);
    setNotice(null);
    try {
      await new Promise((r) => setTimeout(r, 30));
      const out = await runMerge(entryList, opts);
      setResult({
        blob: out.blob,
        filename: out.filename,
        inputRows: out.stats.inputRows,
        outputRows: out.stats.outputRows,
        fileCount: out.stats.fileCount,
        sheets: out.stats.outputSheets,
        size: out.blob.size,
      });
    } catch (e) {
      setNotice("Merge failed — could not load the engine or process your files. Please retry.");
    } finally {
      setBusy(false);
    }
  }

  function clearAll() {
    setParsedFiles([]);
    setSheetIdx({});
    setResult(null);
    setNotice(null);
  }

  return (
    <div className="animate-fade-up space-y-6">
      {/* Headline */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
          <GridMergeIcon />
          <span className="text-sm font-semibold uppercase tracking-wider">Excel Merger</span>
        </div>
        <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
          Combine multiple spreadsheets into one
        </h2>
        <p className="max-w-2xl text-slate-500 dark:text-slate-400">
          Drag in your .xlsx, .xls or .csv files. Files are processed locally in your browser —
          nothing is ever uploaded to a server.
        </p>
      </div>

      {/* Options */}
      <Card className="p-5 sm:p-6">
        <Segmented
          label="Merge method"
          value={mode}
          onChange={(v) => {
            setMode(v);
            setResult(null);
          }}
          options={[
            {
              value: "vertical",
              label: "Stack rows by column",
              icon: <MergeIcon width={16} height={16} />,
            },
            {
              value: "sheets",
              label: "One sheet per file",
              icon: <LayersIcon width={16} height={16} />,
            },
          ]}
        />
        <div className="mt-5 flex flex-col gap-5 border-t border-slate-100 pt-5 dark:border-slate-800 sm:flex-row sm:gap-10">
          {mode === "vertical" ? (
            <>
              <Switch
                checked={hasHeader}
                onChange={(v) => {
                  setHasHeader(v);
                  setResult(null);
                }}
                label="First row contains headers"
                description="Columns are matched by header across files"
              />
              <Switch
                checked={includeFileCol}
                onChange={(v) => {
                  setIncludeFileCol(v);
                  setResult(null);
                }}
                label="Add a “Source File” column"
                description="Track which file each row came from"
              />
            </>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Each file becomes its own worksheet inside one downloadable workbook. Multi-sheet
              source files use the sheet you select below.
            </p>
          )}
        </div>
      </Card>

      {notice && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          <AlertIcon className="mt-0.5 shrink-0" width={18} height={18} />
          <span>{notice}</span>
        </div>
      )}

      {/* Result banner */}
      {result && (
        <div className="animate-fade-in overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-white">
                <CheckIcon width={22} height={22} strokeWidth={2.4} />
              </div>
              <div>
                <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                  {result.filename} · {formatBytes(result.size)}
                </p>
                <p className="text-sm text-emerald-700/80 dark:text-emerald-300/70">
                  {result.fileCount} file(s) · {result.inputRows.toLocaleString()} rows in →{" "}
                  {result.outputRows.toLocaleString()} rows out
                </p>
              </div>
            </div>
            <Button
              size="md"
              onClick={() => triggerDownload(result.blob, result.filename)}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              <DownloadIcon width={18} height={18} />
              Download
            </Button>
          </div>
        </div>
      )}

      {/* Dropzone */}
      <Dropzone
        onFiles={handleAdd}
        accept=".xlsx,.xls,.xlsb,.csv,.tsv"
        title="Drop spreadsheets here"
        hint="or click to browse · you can add multiple files at once"
        extra={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
            <SheetIcon width={14} height={14} />
            .xlsx · .xls · .csv · .tsv
          </span>
        }
      />

      {/* File list */}
      {parsedFiles.length > 0 && (
        <Card className="divide-y divide-slate-100 dark:divide-slate-800">
          <div className="flex items-center justify-between px-5 py-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {parsedFiles.length} file{parsedFiles.length > 1 ? "s" : ""} loaded
            </p>
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition hover:text-rose-500"
            >
              <TrashIcon width={15} height={15} />
              Clear all
            </button>
          </div>
          {parsedFiles.map((f) => (
            <FileRow
              key={f.id}
              file={f}
              sheetIndex={sheetIdx[f.id] ?? 0}
              onSheet={(i) => {
                setSheetIdx((p) => ({ ...p, [f.id]: i }));
                setResult(null);
              }}
              onRemove={() => removeFile(f.id)}
            />
          ))}
        </Card>
      )}

      {/* Preview for vertical merge */}
      {preview && preview.total > 0 && (
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Preview — aligned columns
            </h3>
            <span className="text-xs text-slate-400">
              {preview.total.toLocaleString()} rows total
            </span>
          </div>
          <PreviewTable rows={preview.rows} />
        </Card>
      )}

      {/* Action bar */}
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <Button
          size="lg"
          disabled={parsedFiles.length === 0 || busy}
          onClick={doMerge}
          className="flex-1 sm:flex-none sm:min-w-56"
        >
          {busy ? (
            <RefreshIcon className="animate-spin" width={18} height={18} />
          ) : (
            <DownloadIcon width={18} height={18} />
          )}
          {busy ? "Working…" : result ? "Merge again" : "Merge & export"}
        </Button>
        {parsedFiles.length === 0 && (
          <p className="text-sm text-slate-400">Add at least one spreadsheet to continue.</p>
        )}
      </div>
    </div>
  );
}

function FileRow({
  file,
  sheetIndex,
  onSheet,
  onRemove,
}: {
  file: ParsedFile;
  sheetIndex: number;
  onSheet: (i: number) => void;
  onRemove: () => void;
}) {
  const hasSheets = file.sheets.length > 0;
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-brand-600",
          hasSheets ? "bg-brand-50 dark:bg-brand-500/10" : "bg-amber-50 text-amber-500 dark:bg-amber-500/10"
        )}
      >
        <SheetIcon width={22} height={22} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-800 dark:text-slate-100">{file.fileName}</p>
        <p className="text-xs text-slate-400">
          {formatBytes(file.size)}
          {!hasSheets && <span className="ml-1 text-amber-500">· no readable data</span>}
        </p>
      </div>
      {hasSheets && file.sheets.length > 1 && (
        <SheetPicker
          sheets={file.sheets}
          value={sheetIndex}
          onChange={onSheet}
        />
      )}
      <button
        onClick={onRemove}
        aria-label="Remove file"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 transition hover:bg-rose-50 hover:text-rose-500 dark:text-slate-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
      >
        <XMark />
      </button>
    </div>
  );
}

function SheetPicker({
  sheets,
  value,
  onChange,
}: {
  sheets: SheetData[];
  value: number;
  onChange: (i: number) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
      >
        Sheet: {sheets[value]?.name ?? "—"}
        <ChevronDownIcon width={14} height={14} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 max-h-56 w-52 overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-800">
            {sheets.map((s, i) => (
              <button
                key={s.name + i}
                onClick={() => {
                  onChange(i);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition",
                  i === value
                    ? "bg-brand-50 font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                    : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/60"
                )}
              >
                <span className="truncate">{s.name}</span>
                {i === value && <CheckIcon width={14} height={14} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function XMark() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function PreviewTable({ rows }: { rows: unknown[][] }) {
  if (!rows.length) return null;
  const columns = rows[0].length;
  const maxCols = 14;
  return (
    <div className="max-h-72 overflow-auto rounded-xl border border-slate-100 dark:border-slate-800">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="sticky top-0 bg-slate-50 dark:bg-slate-800">
            {rows[0].slice(0, maxCols).map((h, i) => (
              <th
                key={i}
                className="border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
              >
                {String(h ?? "") || <span className="text-slate-300">—</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(1).map((row, r) => (
            <tr key={r} className="odd:bg-white even:bg-slate-50/50 dark:odd:bg-slate-900/20 dark:even:bg-slate-800/20">
              {row.slice(0, maxCols).map((cell, c) => (
                <td
                  key={c}
                  className="max-w-56 truncate border-b border-slate-100 px-3 py-2 text-slate-500 dark:border-slate-800 dark:text-slate-400"
                >
                  {cell == null || cell === "" ? (
                    <span className="text-slate-300 dark:text-slate-600">—</span>
                  ) : (
                    String(cell)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {columns > maxCols && (
        <p className="px-3 py-2 text-xs text-slate-400">Showing {maxCols} of {columns} columns…</p>
      )}
    </div>
  );
}
