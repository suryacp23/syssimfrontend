"use client";

import React from 'react';
import { useSimulationStore } from '@/store/simulationStore';
import { useCanvasStore } from '@/store/canvasStore';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, AlertTriangle } from 'lucide-react';
import { simulatorInstance } from '@/simulation/engine/Simulator';

export function SimulationControls() {
  const { 
    isRunning, 
    isPaused, 
    isCompleted,
    speed, 
    validationErrors,
    startSimulation, 
    pauseSimulation, 
    resumeSimulation, 
    resetSimulation,
    setSpeed 
  } = useSimulationStore();

  const { activeProjectId, projects } = useCanvasStore();
  const nodes = activeProjectId ? projects[activeProjectId]?.nodes || [] : [];
  const edges = activeProjectId ? projects[activeProjectId]?.edges || [] : [];

  const handleRun = () => {
    const ok = startSimulation(nodes, edges);
    if (ok) {
      simulatorInstance.init(nodes, edges);
    }
  };

  const handlePauseToggle = () => {
    if (isPaused) {
      resumeSimulation();
    } else {
      pauseSimulation();
    }
  };

  const handleReset = () => {
    resetSimulation();
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
      {/* Validation Errors Alert */}
      {validationErrors.length > 0 && (
        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-destructive/15 border border-destructive/20 text-destructive text-xs max-w-sm shadow-lg backdrop-blur-md animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Architecture Validation Failed</span>
          </div>
          <ul className="list-disc pl-4 space-y-1 font-medium">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Controls Panel */}
      <div className="bg-background/95 border border-zinc-200 dark:border-zinc-800 shadow-md rounded-xl p-1.5 flex items-center gap-2.5">
        {isCompleted ? (
          <>
            <div className="flex items-center gap-2 px-2 text-xs font-bold text-green-600 dark:text-green-400 select-none">
              <span>Report Ready ✓</span>
            </div>
            <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800" />
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Close & Reset</span>
            </Button>
          </>
        ) : !isRunning ? (
          <Button 
            onClick={handleRun}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Simulation</span>
          </Button>
        ) : (
          <>
            <Button
              onClick={handlePauseToggle}
              variant="outline"
              size="sm"
              className="gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer"
            >
              {isPaused ? (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause</span>
                </>
              )}
            </Button>

            <Button
              onClick={handleReset}
              variant="destructive"
              size="sm"
              className="gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </Button>
          </>
        )}

        {isRunning && !isCompleted && (
          <>
            <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800" />
            
            <div className="flex items-center gap-1 select-none">
              <span className="text-[10px] font-black text-muted-foreground mr-1.5 uppercase">Speed</span>
              {[0.5, 1, 2, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                    speed === s
                      ? "bg-blue-650 text-white shadow-sm"
                      : "text-zinc-500 hover:bg-zinc-150 dark:hover:bg-zinc-800 hover:text-foreground"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
