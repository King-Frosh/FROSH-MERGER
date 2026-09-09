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
  const [tab, setTab] = useState<Tab>("merge");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [tab]);

  const isMerge = tab === "merge";

  return (
    <div
      className={
        isMerge
          ? "min-h-screen bg-[#020b1d] text-slate-100 antialiased"
          : "min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 antialiased transition-colors dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100"
      }
    >
      <Header active={tab} onNavigate={setTab} theme={theme} onToggleTheme={toggleTheme} />

      <main
        className={
          isMerge
            ? "mergepress-main mx-auto w-full max-w-[1040px] flex-1 px-4 py-7 sm:px-6 sm:py-8"
            : "mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12"
        }
      >
        {tab === "home" && <Home onNavigate={setTab} />}
        {tab === "merge" && <ExcelMerger />}
        {tab === "compress" && <FileCompressor />}

        {tab === "compress" && (
          <div className="mt-14 flex flex-wrap items-center justify-center gap-2 text-sm text-slate-400">
            <span>Need the other tool?</span>
            <button
              onClick={() => setTab("merge")}
              className="font-semibold text-brand-600 transition hover:text-brand-500 dark:text-brand-400"
            >
              Open Excel Merger →
            </button>
          </div>
        )}
      </main>

      <footer
        className={
          isMerge
            ? "border-t border-blue-950/80 bg-[#020b1d]"
            : "border-t border-slate-200/70 py-8 dark:border-slate-800"
        }
      >
        <div
          className={
            isMerge
              ? "mx-auto flex min-h-[56px] max-w-[1040px] items-center justify-between gap-4 px-4 sm:px-6"
              : "mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:px-6 sm:text-left"
          }
        >
          {isMerge ? (
            <>
              <img
                src="https://www.briccsint.com/img/briccs1.png"
                alt="BRICCS International Ideal Ltd"
                className="h-9 w-auto max-w-[118px] object-contain object-left"
              />
              <p className="hidden text-xs text-slate-500 sm:block">
                FROSH-MERGER <span className="mx-2 text-slate-700">|</span> Excel Merger Tool
              </p>
              <p className="flex items-center gap-1.5 text-xs text-slate-400">
                <ShieldIcon width={15} height={15} />
                Secure <span className="text-slate-700">·</span> Fast <span className="text-slate-700">·</span> Reliable
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                © {new Date().getFullYear()} BRICCSMerge · Excel merger &amp; file compressor
              </p>
              <p className="flex items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500">
                <ShieldIcon width={15} height={15} />
                All processing happens locally — your files never leave this device.
              </p>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}
