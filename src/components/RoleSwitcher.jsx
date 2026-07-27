import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ShoppingBag, Store, Bike, Shield, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { getRolesArray, getActiveRole, isRoleSuspended, ROLE_LABELS } from "@/lib/roles";

const ROLE_ICONS = {
  customer: ShoppingBag,
  merchant: Store,
  rider: Bike,
  admin: Shield,
};

export default function RoleSwitcher() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const ref = useRef(null);

  const roles = getRolesArray(user);
  const activeRole = getActiveRole(user);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (roles.length <= 1) return null;

  const handleSwitch = async (role) => {
    if (role === activeRole) {
      setOpen(false);
      return;
    }
    if (isRoleSuspended(user, role)) return;
    setSwitching(true);
    try {
      await base44.functions.invoke("role_management", { action: "switch_role", role });
      sessionStorage.setItem("ddash_role_chosen", "true");
      window.location.href = "/";
    } catch {
      setSwitching(false);
    }
  };

  const ActiveIcon = ROLE_ICONS[activeRole] || ShoppingBag;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={switching}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted hover:bg-saffron/10 transition-colors"
      >
        {switching ? <Loader2 className="w-4 h-4 text-saffron animate-spin" /> : <ActiveIcon className="w-4 h-4 text-saffron" />}
        <span className="text-sm font-semibold text-foreground">{ROLE_LABELS[activeRole]}</span>
        <ChevronDown className="w-3.5 h-3.5 text-foreground/40" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-2xl shadow-xl p-2 z-50">
          <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 px-3 py-2">Switch Role</p>
          {roles.map((role) => {
            const Icon = ROLE_ICONS[role] || ShoppingBag;
            const isActive = role === activeRole;
            const suspended = isRoleSuspended(user, role);
            return (
              <button
                key={role}
                onClick={() => handleSwitch(role)}
                disabled={suspended}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left disabled:opacity-40 ${
                  isActive ? "bg-saffron/10 text-saffron" : "hover:bg-muted text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-semibold flex-1">{ROLE_LABELS[role]}</span>
                {suspended && <span className="text-[9px] font-bold uppercase text-red-500">Suspended</span>}
                {isActive && !suspended && <span className="text-[10px] font-bold uppercase">Active</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}