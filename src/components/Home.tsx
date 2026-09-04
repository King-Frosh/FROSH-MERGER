import type { ReactNode } from "react";
import type { Tab } from "@/types";
import {
  CompressIcon,
  DatabaseIcon,
  FileIcon,
  GridMergeIcon,
  GaugeIcon,
  ImageIcon,
  LinkIcon,
  MergeIcon,
  ShieldIcon,
  SparklesIcon,
} from "./icons";
import { Button, Card } from "./ui";

const FEATURE_ICON =
  "flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400";

export default function Home({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  return (
    <div className="animate-fade-up">
      {/* Hero */}
      <section className="relative py-12 sm:py-20">
        <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300">
            <SparklesIcon width={14} height={14} />
            100% private — runs entirely in your browser
          </div>
          <h1 className="mt-6 font-display text-4xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-6xl">
            Merge spreadsheets.
            <br />
            Compress your files.
            <br />
            <span className="bg-gradient-to-r from-brand-500 via-brand-600 to-indigo-600 bg-clip-text text-transparent dark:from-brand-400 dark:to-indigo-400">
              In seconds.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-slate-500 dark:text-slate-400">
            BRICCSMerge is a fast, professional toolkit to combine Excel files and shrink
            documents &amp; images into a single ZIP — no uploads, no sign-ups, no limits.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" onClick={() => onNavigate("merge")} className="w-full sm:w-auto">
              <GridMergeIcon width={18} height={18} />
              Merge Excel files
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => onNavigate("compress")}
              className="w-full sm:w-auto"
            >
              <CompressIcon width={18} height={18} />
              Compress files
            </Button>
          </div>

          {/* trust row */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-2">
              <ShieldIcon width={16} height={16} className="text-emerald-500" />
              Files never leave your device
            </span>
            <span className="inline-flex items-center gap-2">
              <LinkIcon width={16} height={16} className="text-brand-500" />
              Works offline-ready
            </span>
            <span className="inline-flex items-center gap-2">
              <GaugeIcon width={16} height={16} className="text-indigo-500" />
              Instant results
            </span>
          </div>
        </div>
      </section>

      {/* Tool cards */}
      <section className="grid gap-6 py-4 md:grid-cols-2">
        <ToolCard
          icon={<MergeIcon width={26} height={26} />}
          gradient="from-brand-500 to-indigo-600"
          tag="Excel Merger"
          title="Combine spreadsheets into one clean file"
          desc="Merge multiple .xlsx, .xls and .csv files by matching columns, or keep each file as its own sheet in a single workbook."
          bullets={[
            "Smart header detection & column alignment",
            "Add a “Source File” column to trace origins",
            "Live preview before you download",
            "Multi-sheet selection per source file",
          ]}
          cta="Open Excel Merger"
          onOpen={() => onNavigate("merge")}
        />
        <ToolCard
          icon={<CompressIcon width={26} height={26} />}
          gradient="from-sky-500 to-indigo-600"
          tag="File Compressor"
          title="Compress files & optimize images to WebP"
          desc="Deflate-compress any file into a ZIP archive and automatically re-encode raster images for dramatic size savings."
          bullets={[
            "Tunable compression level (fast → max)",
            "Lossy WebP optimization with quality control",
            "Per-file savings breakdown",
            "Bundles everything into one .zip",
          ]}
          cta="Open Compressor"
          onOpen={() => onNavigate("compress")}
        />
      </section>

      {/* Features */}
      <section className="py-10">
        <h2 className="text-center font-display text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
          Why MergePress?
        </h2>
        <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-2">
          <Feature
            icon={<DatabaseIcon />}
            title="Total privacy"
            desc="Your data is processed locally with WebAssembly-free JavaScript. Nothing is transmitted or stored on a server."
          />
          <Feature
            icon={<GridMergeIcon />}
            title="Accurate merging"
            desc="Columns are matched intelligently by header name, so files with slightly different column orders still combine correctly."
          />
          <Feature
            icon={<ImageIcon />}
            title="Big image savings"
            desc="Modern WebP encoding can cut photo and PNG file sizes by 50–80% while keeping quality you control."
          />
          <Feature
            icon={<FileIcon />}
            title="One simple package"
            desc="Every tool downloads finished, ready-to-share files. No configuration, no accounts, no installs."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="py-6">
        <Card className="p-6 sm:p-8">
          <h3 className="text-center font-display text-lg font-bold text-slate-900 dark:text-white">
            How it works
          </h3>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            {[
              { n: "1", t: "Add your files", d: "Drag & drop or browse. Multiple files supported." },
              { n: "2", t: "Tune the options", d: "Choose merge style or compression settings." },
              { n: "3", t: "Download the result", d: "Get a ready Excel file or optimized ZIP instantly." },
            ].map((s) => (
              <div key={s.n} className="relative text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 text-lg font-bold text-white shadow-md shadow-brand-500/25">
                  {s.n}
                </div>
                <p className="mt-4 font-semibold text-slate-800 dark:text-slate-100">{s.t}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{s.d}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}

function ToolCard({
  icon,
  gradient,
  tag,
  title,
  desc,
  bullets,
  cta,
  onOpen,
}: {
  icon: ReactNode;
  gradient: string;
  tag: string;
  title: string;
  desc: string;
  bullets: string[];
  cta: string;
  onOpen: () => void;
}) {
  return (
    <Card className="group flex flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-500/5">
      <div className="relative flex items-center gap-4 p-6 pb-4">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg`}
        >
          {icon}
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            {tag}
          </p>
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
        </div>
      </div>
      <div className="flex flex-1 flex-col px-6">
        <p className="text-sm text-slate-500 dark:text-slate-400">{desc}</p>
        <ul className="mt-4 space-y-2.5">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
              <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r ${gradient}`} />
              {b}
            </li>
          ))}
        </ul>
      </div>
      <div className="p-6">
        <Button
          size="md"
          onClick={onOpen}
          className="w-full justify-center bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500"
        >
          {cta}
          <span className="transition group-hover:translate-x-0.5">→</span>
        </Button>
      </div>
    </Card>
  );
}

function Feature({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <div className={FEATURE_ICON}>{icon}</div>
      <div>
        <p className="font-semibold text-slate-800 dark:text-slate-100">{title}</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{desc}</p>
      </div>
    </div>
  );
}
