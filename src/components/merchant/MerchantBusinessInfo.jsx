import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { FileText, Building2, CreditCard, Percent, Loader2, ShieldCheck } from "lucide-react";

export default function MerchantBusinessInfo({ storeId }) {
  const { user } = useAuth();
  const [app, setApp] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        if (user?.email) {
          const apps = await base44.entities.MerchantApplication.filter({ email: user.email, applicant_type: "merchant" });
          if (apps.length > 0) setApp(apps[0]);
        }
        if (user?.id) {
          const wallets = await base44.entities.MerchantWallet.filter({ merchant_id: user.id });
          if (wallets.length > 0) setWallet(wallets[0]);
        }
      } catch {}
      setLoading(false);
    };
    if (user?.id) load(); else setLoading(false);
  }, [user?.id, user?.email]);

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-saffron animate-spin" /></div>;

  const kycStatus = app?.kyc_status || "pending";
  const kycColor = kycStatus === "approved" ? "bg-terai/10 text-terai" : kycStatus === "rejected" ? "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400" : "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400";

  const items = [
    { icon: FileText, label: "PAN Number", value: app?.pan_number },
    { icon: Building2, label: "Business Registration", value: app?.business_registration_number },
    { icon: CreditCard, label: "Bank Details", value: app?.bank_details },
    { icon: Percent, label: "Commission Rate", value: wallet ? ((wallet.commission_rate || 0.1) * 100) + "%" : "10%" },
  ];

  return (
    <div className="bg-card rounded-3xl border border-border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2"><Building2 className="w-5 h-5 text-saffron" /> Business Information</h2>
        <span className={"text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 " + kycColor}><ShieldCheck className="w-3 h-3" /> KYC: {kycStatus}</span>
      </div>
      <p className="text-xs text-foreground/40">These details require admin approval to change. Contact support to update.</p>
      <div className="grid sm:grid-cols-2 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-start gap-2 p-3 rounded-xl bg-muted/50">
              <Icon className="w-4 h-4 text-saffron mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-foreground/40 font-semibold uppercase">{item.label}</p>
                <p className="text-sm font-semibold text-foreground truncate">{item.value || "Not provided"}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}