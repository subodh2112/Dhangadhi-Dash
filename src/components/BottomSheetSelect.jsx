import React, { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Check, ChevronDown } from "lucide-react";

export default function BottomSheetSelect({ value, onChange, options, placeholder, label }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full h-12 px-4 rounded-xl border border-border bg-background text-left text-foreground font-medium flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-saffron/40 focus:border-saffron transition-all"
      >
        <span className={selected ? "" : "text-foreground/30"}>{selected?.label || placeholder || "Select..."}</span>
        <ChevronDown className="w-4 h-4 text-foreground/40 flex-shrink-0" />
      </button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[70vh]">
          <DrawerHeader>
            <DrawerTitle>{label || "Select an option"}</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-6 space-y-1">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-left transition-colors min-h-[44px] ${value === opt.value ? "bg-saffron/10 text-saffron font-bold" : "hover:bg-muted text-foreground"}`}
              >
                {opt.label}
                {value === opt.value && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}