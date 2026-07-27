import React, { useState } from "react";
import { ShoppingBag, Store, Bike, Shield, ArrowRight, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getRolesArray, getActiveRole, isRoleSuspended, ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_DASHBOARDS } from "@/lib/roles";
import Logo from "@/components/Logo";

const ROLE_ICONS = {
  customer: ShoppingBag,
  merchant: Store,
  rider: Bike,
  admin: Shield,
};

export default function RolePicker({ user }) {
  const [switching, setSwitching] = useState(null);
  const roles = getRolesArray(user);
  const activeRole = getActiveRole(user);

  const handleChoose = async (role) => {
    if (isRoleSuspended(user, role)) return;
    setSwitching(role);
    try {
      if (role !== activeRole) {
        await base44.functions.invoke("role_management", { action: "switch_role", role });
      }
      sessionStorage.setItem("ddash_role_chosen", "true");
      window.location.href = ROLE_DASHBOARDS[role] || "/";
    } catch {
      setSwitching(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="inline-block mb-6"><Logo /></div>
          <h1 className="font-display font-extrabold text-3xl text-foreground mb-2">Continue as</h1>
          <p className="text-foreground/50 text-sm">Your account has multiple roles. Choose one to continue.</p>
        </div>

        <div className="space-y-3">
          {roles.map((role) => {
            const Icon = ROLE_ICONS[role] || ShoppingBag;
            const isLoading = switching === role;
            const suspended = isRoleSuspended(user, role);
            return (
              <button
                key={role}
                onClick={() => handleChoose(role)}
                disabled={switching !== null || suspended}
                className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-border hover:border-saffron/40 hover:bg-saffron/5 transition-all text-left disabled:opacity-50"
              >
                <div className="w-12 h-12 rounded-2xl bg-saffron/10 flex items-center justify-center flex-shrink-0">
                  {isLoading ? <Loader2 className="w-6 h-6 text-saffron animate-spin" /> : <Icon className="w-6 h-6 text-saffron" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-foreground text-lg">{ROLE_LABELS[role]}</p>
                    {suspended && <span className="text-[9px] font-bold uppercase text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full">Suspended</span>}
                    {role === activeRole && !suspended && <span className="text-[9px] font-bold uppercase text-terai bg-terai/10 px-2 py-0.5 rounded-full">Current</span>}
                  </div>
                  <p className="text-xs text-foreground/50">{ROLE_DESCRIPTIONS[role]}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-foreground/30" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}