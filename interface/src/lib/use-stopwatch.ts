import { useEffect, useRef, useState } from "react";

/**
 * Counts elapsed whole seconds while `running` is true. The value resets to 0
 * each time recording (re)starts and freezes at its last value when stopped, so
 * it doubles as both a live timer and the final duration readout.
 */
export function useStopwatch(running: boolean): number {
  const [seconds, setSeconds] = useState(0);
  const startedAtRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    startedAtRef.current = Date.now();
    setSeconds(0);
    const id = setInterval(() => {
      setSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 250);
    return () => clearInterval(id);
  }, [running]);

  return seconds;
}
