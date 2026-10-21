import { useEffect, useRef } from 'react';

export function useWorker(
  workerFactory: () => Worker,
  onMessage: (e: MessageEvent) => void
) {
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = workerFactory();
    workerRef.current.onmessage = onMessage;
    workerRef.current.onerror = (err) => {
      console.error("Worker failed to load or threw an error:", err);
      // Simulate an error message so the UI can recover
      onMessage(new MessageEvent('message', { data: { type: 'ERROR', message: 'Worker failed to load.' } }));
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, [workerFactory, onMessage]);

  return workerRef.current;
}
