import { useEffect } from "react";

const INACTIVITY_LIMIT = 15 * 60 * 1000;

export function useIdleTimer(isActive, onIdle) {
  useEffect(() => {
    if (!isActive) return;

    let timer;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(onIdle, INACTIVITY_LIMIT);
    };

    const events = ["mousedown", "keydown", "touchstart", "scroll", "mousemove"];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [isActive, onIdle]);
}