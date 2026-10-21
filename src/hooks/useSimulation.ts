import { useEffect, useRef } from 'react';
import { useSimulationStore } from '@/store/simulationStore';
import { simulatorInstance } from '@/simulation/engine/SimulationEngine';

export function useSimulation() {
  const { isRunning, isPaused, isCompleted, speed } = useSimulationStore();
  const lastTimeRef = useRef<number>(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!isRunning || isPaused || isCompleted) {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = 0;
      }
      return;
    }

    lastTimeRef.current = performance.now();

    const tickLoop = (now: number) => {
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      // Restrict delta jump magnitude to keep clock calculations stable during tab-out
      const safeDelta = Math.min(delta, 100);

      // Advance virtual clock
      simulatorInstance.tick(safeDelta, speed);

      frameRef.current = requestAnimationFrame(tickLoop);
    };

    frameRef.current = requestAnimationFrame(tickLoop);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = 0;
      }
    };
  }, [isRunning, isPaused, speed]);
}
