import { useEffect, useState } from "react";
import ExcelMerger from "@/components/ExcelMerger";
import FileCompressor from "@/components/FileCompressor";
import Header from "@/components/Header";
import Home from "@/components/Home";
import { useTheme } from "@/hooks/useTheme";
import { ShieldIcon } from "@/components/icons";
import type { Tab } from "@/types";

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [tab, setTab] = useState<Tab>("home");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [tab]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 antialiased transition-colors dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100">
      <Header active={tab} onNavigate={setTab} theme={theme} onToggleTheme={toggleTheme} />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {tab === "home" && <Home onNavigate={setTab} />}
        {tab === "merge" && <ExcelMerger />}
        {tab === "compress" && <FileCompressor />}

        {/* Tab shortcut strip for quick navigation within tools */}
        {tab !== "home" && (
          <div className="mt-14 flex flex-wrap items-center justify-center gap-2 text-sm text-slate-400">
            <span>Need the other tool?</span>
            <button
              onClick={() => setTab(tab === "merge" ? "compress" : "merge")}
              className="font-semibold text-brand-600 transition hover:text-brand-500 dark:text-brand-400"
            >
              {tab === "merge" ? "Open File Compressor →" : "Open Excel Merger →"}
            </button>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200/70 py-8 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:px-6 sm:text-left">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} BRICCSMerge · Excel merger &amp; file compressor
          </p>
          <p className="flex items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500">
            <ShieldIcon width={15} height={15} />
            All processing happens locally — your files never leave this device.
          </p>
        </div>
      </footer>
    </div>
  );
}
