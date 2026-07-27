import React from "react";
import { isStoreOpen } from "@/lib/storeStatus";

export default function StoreOpenBadge({ store, size = "sm", className = "" }) {
  const open = isStoreOpen(store);
  const sizeClasses = size === "xs"
    ? "px-1.5 py-0.5 text-[9px] gap-0.5"
    : "px-2 py-0.5 text-[10px] gap-1";
  const dotSize = size === "xs" ? "w-1 h-1" : "w-1.5 h-1.5";

  return (
    <span className={`inline-flex items-center rounded-full font-bold ${sizeClasses} ${open ? "bg-terai/10 text-terai" : "bg-red-500/10 text-red-500"} ${className}`}>
      <span className={`${dotSize} rounded-full ${open ? "bg-terai" : "bg-red-500"} ${open ? "animate-pulse" : ""}`} />
      {open ? "Open" : "Closed"}
    </span>
  );
}