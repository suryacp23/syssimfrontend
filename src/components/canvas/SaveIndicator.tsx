"use client";

import { useCanvasStore } from "@/store/canvasStore";

export function SaveIndicator() {
  const { activeProjectId, isDirty } = useCanvasStore();
  const dirty = activeProjectId ? isDirty[activeProjectId] : false;

  if (!activeProjectId) return null;

  return (
    <div className="flex items-center gap-1.5 text-[11px] font-semibold select-none bg-zinc-100 dark:bg-zinc-900 border px-3 py-1 rounded-full border-zinc-200 dark:border-zinc-800 transition-colors">
      {dirty ? (
        <span className="flex items-center gap-1.5 text-amber-500 dark:text-amber-400">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-ping absolute" />
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 relative" />
          <span>Unsaved Changes</span>
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400" />
          <span>Saved</span>
        </span>
      )}
    </div>
  );
}
