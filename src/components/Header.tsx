import type { ReactElement } from "react";
import type { Tab } from "@/types";
import { cn } from "@/utils/cn";
import type { Theme } from "@/hooks/useTheme";
import { CompressIcon, GridMergeIcon, MoonIcon, SunIcon } from "./icons";

const LOGO_GRADIENT =
  "bg-gradient-to-br from-brand-500 via-brand-600 to-indigo-600";

export default function Header({
  active,
  onNavigate,
  theme,
  onToggleTheme,
}: {
  active: Tab;
  onNavigate: (t: Tab) => void;
  theme: Theme;
  onToggleTheme: () => void;
}) {
  const tabs: { key: Tab; label: string; icon: ReactElement }[] = [
    { key: "merge", label: "Merge Excel", icon: <GridMergeIcon width={16} height={16} /> },
    { key: "compress", label: "Compress Files", icon: <CompressIcon width={16} height={16} /> },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-950/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <button
          onClick={() => onNavigate("home")}
          className="flex shrink-0 items-center gap-2.5"
          aria-label="MergePress home"
        >
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md shadow-brand-500/25",
              LOGO_GRADIENT
            )}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2.5" />
              <path d="M9 3v18M3 9h18" />
            </svg>
          </span>
          <span className="hidden font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:block">
            BRICCS<span className="text-brand-600 dark:text-brand-400">Merge</span>
          </span>
        </button>

        <nav className="ml-auto flex items-center gap-1 sm:gap-1.5">
          {tabs.map((t) => {
            const activeTab = active === t.key;
            return (
              <button
                key={t.key}
                onClick={() => onNavigate(t.key)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition sm:px-4",
                  activeTab
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                )}
              >
                <span className={cn(activeTab ? "hidden sm:inline-flex" : "hidden sm:inline-flex")}>
                  {t.icon}
                </span>
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden">{t.label.split(" ")[0]}</span>
              </button>
            );
          })}

          <button
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="ml-1 flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            {theme === "light" ? <MoonIcon width={19} height={19} /> : <SunIcon width={19} height={19} />}
          </button>
        </nav>
      </div>
    </header>
  );
}
