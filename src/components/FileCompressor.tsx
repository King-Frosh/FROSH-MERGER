import { useMemo, useState } from "react";
import { compressFiles, type CompressReport } from "@/lib/compress";
import { formatBytes, savingsPercent } from "@/lib/format";
import { cn } from "@/utils/cn";
import Dropzone from "./Dropzone";
import {
  AlertIcon,
  CompressIcon,
  DownloadIcon,
  FileIcon,
  ImageIcon,
  RefreshIcon,
  SparklesIcon,
  TrashIcon,
} from "./icons";
import { Button, Card, SliderRow, Switch } from "./ui";

export default function FileCompressor() {
  const [files, setFiles] = useState<File[]>([]);
  const [level, setLevel] = useState(6);
  const [optimizeImages, setOptimizeImages] = useState(true);
  const [imageQuality, setImageQuality] = useState(0.82);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<CompressReport | null>(null);

  const totalOriginal = useMemo(() => files.reduce((s, f) => s + f.size, 0), [files]);

  function addFiles(list: File[]) {
    const existing = new Set(files.map((f) => `${f.name}:${f.size}`));
    const fresh = list.filter((f) => !existing.has(`${f.name}:${f.size}`));
    if (fresh.length) {
      setFiles((prev) => [...prev, ...fresh]);
      setReport(null);
      setError(null);
    }
  }

  function removeFile(name: string, size: number) {
    setFiles((prev) => prev.filter((f) => !(f.name === name && f.size === size)));
    setReport(null);
  }

  async function runCompress() {
    if (!files.length) return;
    setBusy(true);
    setError(null);
    setReport(null);
    try {
      await new Promise((r) => setTimeout(r, 40));
      const rep = await compressFiles(files, {
        level,
        optimizeImages,
        imageQuality,
      });
      setReport(rep);
    } catch (e) {
      setError("Compression failed. Try removing very large files or disabling image optimization.");
    } finally {
      setBusy(false);
    }
  }

  const saving = report ? savingsPercent(report.totalOriginal, report.totalResult) : 0;

  return (
    <div className="animate-fade-up space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
          <CompressIcon />
          <span className="text-sm font-semibold uppercase tracking-wider">File Compressor</span>
        </div>
        <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
          Shrink &amp; package files into one ZIP
        </h2>
        <p className="max-w-2xl text-slate-500 dark:text-slate-400">
          Compress any files with zlib deflation and optionally re-encode images to WebP. Everything
          happens in your browser — files never leave your device.
        </p>
      </div>

      {/* Options */}
      <Card className="p-5 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <SliderRow
            label="Compression level"
            value={level}
            min={1}
            max={9}
            onChange={(v) => {
              setLevel(v);
              setReport(null);
            }}
            format={(v) => (v <= 3 ? `${v} · fast` : v >= 7 ? `${v} · max` : `${v} · balanced`)}
          />
          <div className="space-y-4">
            <Switch
              checked={optimizeImages}
              onChange={(v) => {
                setOptimizeImages(v);
                setReport(null);
              }}
              label="Optimize images to WebP"
              description="Re-encode PNG/JPG for much smaller sizes (lossy)"
            />
            {optimizeImages && (
              <SliderRow
                label="Image quality"
                value={Math.round(imageQuality * 100)}
                min={40}
                max={100}
                onChange={(v) => {
                  setImageQuality(v / 100);
                  setReport(null);
                }}
                format={(v) => `${v}%`}
              />
            )}
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
          Text, CSV, JSON, docs and more compress very well. Already-compressed media (e.g. MP4, MP3,
          most JPG) gains little from deflation — image optimization handles raster formats.
        </p>
      </Card>

      {/* Result */}
      {report && (
        <div className="animate-fade-in overflow-hidden rounded-2xl border border-brand-200 bg-brand-50 dark:border-brand-500/30 dark:bg-brand-500/10">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
                <SparklesIcon width={22} height={22} />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {report.filename}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {formatBytes(report.totalOriginal)} →{" "}
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatBytes(report.totalResult)}
                  </span>{" "}
                  · {saving >= 0 ? "saved" : "grew by"} {Math.abs(saving)}%
                </p>
              </div>
            </div>
            <Button size="md" onClick={() => downloadReport(report)}>
              <DownloadIcon width={18} height={18} />
              Download ZIP
            </Button>
          </div>
          <div className="border-t border-brand-100 px-5 py-4 dark:border-brand-500/20">
            <ItemBreakdown report={report} />
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          <AlertIcon className="mt-0.5 shrink-0" width={18} height={18} />
          <span>{error}</span>
        </div>
      )}

      <Dropzone
        onFiles={addFiles}
        multiple
        title="Drop files to compress"
        hint="or click to browse · any file type is supported"
        extra={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
            <FileIcon width={14} height={14} />
            images · docs · CSV · any files
          </span>
        }
      />

      {/* File list */}
      {files.length > 0 && (
        <Card>
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {files.length} file{files.length > 1 ? "s" : ""} ·{" "}
              <span className="font-normal text-slate-400">{formatBytes(totalOriginal)}</span>
            </p>
            <button
              onClick={() => {
                setFiles([]);
                setReport(null);
              }}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition hover:text-rose-500"
            >
              <TrashIcon width={15} height={15} />
              Clear
            </button>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {files.map((f, i) => (
              <li
                key={`${f.name}:${f.size}:${i}`}
                className="flex items-center gap-4 px-5 py-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                  {isImage(f.name) ? (
                    <ImageIcon width={20} height={20} />
                  ) : (
                    <FileIcon width={20} height={20} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                    {f.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatBytes(f.size)}
                    {isImage(f.name) && optimizeImages && (
                      <span className="ml-2 text-brand-500 dark:text-brand-400">→ WebP</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => removeFile(f.name, f.size)}
                  aria-label="Remove"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition hover:bg-rose-50 hover:text-rose-500 dark:text-slate-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                >
                  <TrashIcon width={16} height={16} />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <Button
          size="lg"
          onClick={runCompress}
          disabled={files.length === 0 || busy}
          className="flex-1 sm:flex-none sm:min-w-56"
        >
          {busy ? (
            <RefreshIcon className="animate-spin" width={18} height={18} />
          ) : (
            <DownloadIcon width={18} height={18} />
          )}
          {busy ? "Compressing…" : report ? "Compress again" : "Compress & download ZIP"}
        </Button>
        {files.length === 0 && (
          <p className="text-sm text-slate-400">Add at least one file to continue.</p>
        )}
      </div>
    </div>
  );
}

function isImage(name: string) {
  return /\.(png|jpe?g|webp|bmp|gif)$/i.test(name);
}

function downloadReport(report: CompressReport) {
  const url = URL.createObjectURL(report.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = report.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function ItemBreakdown({ report }: { report: CompressReport }) {
  return (
    <div className="space-y-3">
      {report.items.map((item, i) => {
        const pct = savingsPercent(item.originalSize, item.resultSize);
        const saved = item.originalSize - item.resultSize;
        const ratio =
          item.originalSize > 0 ? Math.min(100, Math.max(4, (item.resultSize / item.originalSize) * 100)) : 100;
        return (
          <div key={`${item.name}:${i}`}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate font-medium text-slate-700 dark:text-slate-200">
                {item.kind === "optimized" && (
                  <span className="mr-1.5 rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                    WebP
                  </span>
                )}
                {item.name}
              </span>
              <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                {formatBytes(item.originalSize)} →{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatBytes(item.resultSize)}
                </span>
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  saved > 0
                    ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                    : "bg-slate-400 dark:bg-slate-500"
                )}
                style={{ width: `${ratio}%` }}
              />
            </div>
            <div className="mt-1 text-right text-[11px] text-slate-400">
              {saved >= 0 ? `−${formatBytes(saved)} (${pct}%)` : `+${formatBytes(-saved)}`}
            </div>
          </div>
        );
      })}
    </div>
  );
}
