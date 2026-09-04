import { useRef, useState, type DragEvent, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import { UploadIcon } from "./icons";

export default function Dropzone({
  onFiles,
  accept,
  multiple = true,
  title,
  hint,
  extra,
}: {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  title: string;
  hint: string;
  extra?: ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (!e.dataTransfer.files?.length) return;
    onFiles(Array.from(e.dataTransfer.files));
  };

  const openPicker = () => inputRef.current?.click();

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
      }}
      onDrop={handleDrop}
      onClick={openPicker}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && openPicker()}
      className={cn(
        "group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition",
        dragging
          ? "border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-500/10"
          : "border-slate-300 bg-slate-50/50 hover:border-brand-400 hover:bg-brand-50/40 dark:border-slate-700 dark:bg-slate-800/30 dark:hover:border-brand-500 dark:hover:bg-brand-500/5"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const list = e.target.files;
          if (list?.length) onFiles(Array.from(list));
          e.target.value = "";
        }}
      />
      <div
        className={cn(
          "mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition",
          dragging
            ? "bg-brand-600 text-white"
            : "bg-white text-brand-600 shadow-sm ring-1 ring-slate-200 group-hover:bg-brand-600 group-hover:text-white dark:bg-slate-900 dark:text-brand-400 dark:ring-slate-700 dark:group-hover:bg-brand-600 dark:group-hover:text-white"
        )}
      >
        <UploadIcon width={28} height={28} strokeWidth={1.8} />
      </div>
      <p className="text-base font-semibold text-slate-800 dark:text-white">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        {dragging ? "Release to add files" : hint}
      </p>
      {extra && <div className="mt-5">{extra}</div>}
    </div>
  );
}
