import { useEffect, useState } from "react";

export type TimeOfDayPhase = "DAWN" | "DAY" | "DUSK" | "NIGHT";

export interface TimeOfDayState {
  phase: TimeOfDayPhase;
  sunFactor: number; // 0.0 (midnight) to 1.0 (midday)
  localTimeStr: string;
}

export function calculateTimeOfDay(now: Date = new Date()): TimeOfDayState {
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const timeInHours = hours + minutes / 60;

  let phase: TimeOfDayPhase;
  let sunFactor: number;

  if (timeInHours >= 6 && timeInHours < 9) {
    phase = "DAWN";
    // Transition from 0.2 to 0.8
    sunFactor = 0.2 + ((timeInHours - 6) / 3) * 0.6;
  } else if (timeInHours >= 9 && timeInHours < 17) {
    phase = "DAY";
    // Midday peak around 13:00
    const distFromNoon = Math.abs(timeInHours - 13) / 4;
    sunFactor = 0.8 + (1 - distFromNoon) * 0.2;
  } else if (timeInHours >= 17 && timeInHours < 20) {
    phase = "DUSK";
    // Transition from 0.8 to 0.2
    sunFactor = 0.8 - ((timeInHours - 17) / 3) * 0.6;
  } else {
    phase = "NIGHT";
    // Night valley
    sunFactor = 0.08;
  }

  sunFactor = Math.max(0.05, Math.min(1.0, sunFactor));

  const localTimeStr = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return { phase, sunFactor: Number(sunFactor.toFixed(2)), localTimeStr };
}

export function useTimeOfDay() {
  const [tod, setTod] = useState<TimeOfDayState>(calculateTimeOfDay);

  useEffect(() => {
    const applyToDoc = (state: TimeOfDayState) => {
      const root = document.documentElement;
      root.setAttribute("data-tod-phase", state.phase);
      root.style.setProperty("--tod-ambient", state.sunFactor.toString());
      
      // Interpolate subtle day/night adjustments preserving tactical dark palette
      // Night: card background is deep navy/black, day: slightly elevated tactical grey/navy
      if (state.phase === "NIGHT") {
        root.style.setProperty("--map-brightness", "0.55");
        root.style.setProperty("--panel-bg-alpha", "0.94");
        root.style.setProperty("--panel-border-alpha", "0.22");
      } else if (state.phase === "DAWN" || state.phase === "DUSK") {
        root.style.setProperty("--map-brightness", "0.68");
        root.style.setProperty("--panel-bg-alpha", "0.90");
        root.style.setProperty("--panel-border-alpha", "0.28");
      } else {
        root.style.setProperty("--map-brightness", "0.78");
        root.style.setProperty("--panel-bg-alpha", "0.86");
        root.style.setProperty("--panel-border-alpha", "0.36");
      }
    };

    applyToDoc(tod);

    const interval = setInterval(() => {
      const updated = calculateTimeOfDay();
      setTod(updated);
      applyToDoc(updated);
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return tod;
}

