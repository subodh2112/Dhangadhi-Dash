import React, { useState, useRef } from "react";
import { Loader2, RefreshCw } from "lucide-react";

export default function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const THRESHOLD = 70;

  const handleTouchStart = (e) => {
    if (window.scrollY <= 0 && !refreshing) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  };

  const handleTouchMove = (e) => {
    if (!pulling.current) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0) setPullDistance(Math.min(diff * 0.5, THRESHOLD * 1.5));
  };

  const handleTouchEnd = async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pullDistance >= THRESHOLD) {
      setRefreshing(true);
      setPullDistance(THRESHOLD);
      try { await onRefresh?.(); } catch {}
      setRefreshing(false);
    }
    setPullDistance(0);
  };

  return (
    <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      <div className="flex items-center justify-center overflow-hidden transition-all duration-200" style={{ height: pullDistance }}>
        {refreshing ? (
          <Loader2 className="w-5 h-5 text-saffron animate-spin" />
        ) : (
          <RefreshCw className="w-5 h-5 text-saffron" style={{ transform: `rotate(${pullDistance * 3}deg)` }} />
        )}
      </div>
      {children}
    </div>
  );
}