import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Check, X, DollarSign, Clock } from "lucide-react";

const statusColors = { pending: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400", approved: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400", paid: "bg-terai/10 text-terai", rejected: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400" };

export default function MerchantWithdrawalManager() {
  const { toast } = useToast();
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await base44.entities.MerchantWithdrawal.filter({}, "-created_date", 100);
      setWithdrawals(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status, extra = {}) => {
    setProcessing(id);
    try {
      await base44.entities.MerchantWithdrawal.update(id, { status, ...extra, processed_date: new Date().toISOString() });
      const w = withdrawals.find(x => x.id === id);
      if (status === "rejected") {
        const wallets = await base44.entities.MerchantWallet.filter({ merchant_id: w.merchant_id });
        if (wallets.length > 0) {
          await base44.entities.MerchantWallet.update(wallets[0].id, { available_balance: (wallets[0].available_balance || 0) + (w.amount || 0) });
        }
      }
      if (status === "paid") {
        const wallets = await base44.entities.MerchantWallet.filter({ merchant_id: w.merchant_id });
        if (wallets.length > 0) {
          await base44.entities.MerchantWallet.update(wallets[0].id, { withdrawn_amount: (wallets[0].withdrawn_amount || 0) + (w.amount || 0) });
        }
      }
      setWithdrawals(prev => prev.map(x => x.id === id ? { ...x, status, ...extra, processed_date: new Date().toISOString() } : x));
      toast({ title: "Withdrawal " + status });
    } catch { toast({ title: "Failed", variant: "destructive" }); }
    setProcessing(null);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  const pending = withdrawals.filter(w => w.status === "pending");
  const processed = withdrawals.filter(w => w.status !== "pending");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-border p-4"><div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mb-2"><Clock className="w-4 h-4 text-amber-500" /></div><p className="text-xl font-display font-extrabold text-foreground">{pending.length}</p><p className="text-xs text-foreground/40">Pending</p></div>
        <div className="bg-card rounded-2xl border border-border p-4"><div className="w-9 h-9 rounded-lg bg-terai/10 flex items-center justify-center mb-2"><Check className="w-4 h-4 text-terai" /></div><p className="text-xl font-display font-extrabold text-foreground">{withdrawals.filter(w => w.status === "paid").length}</p><p className="text-xs text-foreground/40">Paid</p></div>
        <div className="bg-card rounded-2xl border border-border p-4"><div className="w-9 h-9 rounded-lg bg-saffron/10 flex items-center justify-center mb-2"><DollarSign className="w-4 h-4 text-saffron" /></div><p className="text-xl font-display font-extrabold text-foreground">Rs {withdrawals.filter(w => w.status === "paid").reduce((s, w) => s + (w.amount || 0), 0).toLocaleString()}</p><p className="text-xs text-foreground/40">Total Paid</p></div>
      </div>

      {pending.length > 0 && (
        <div>
          <h3 className="font-display font-bold text-lg text-foreground mb-3">Pending Requests</h3>
          <div className="space-y-2">
            {pending.map(w => (
              <div key={w.id} className="bg-card rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-bold text-sm text-foreground">{w.store_name || "Unknown Store"}</p>
                    <p className="text-xs text-foreground/40">{w.payment_method?.replace(/_/g, " ")} · {new Date(w.requested_date).toLocaleDateString()}</p>
                    {w.account_details && <p className="text-xs text-foreground/50 mt-1">{w.account_details}</p>}
                  </div>
                  <p className="text-lg font-display font-extrabold text-saffron">Rs {w.amount?.toLocaleString()}</p>
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => updateStatus(w.id, "approved")} disabled={processing === w.id} className="flex-1 h-9 rounded-lg bg-blue-500 text-white text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1"><Check className="w-3 h-3" /> Approve</button>
                  <button onClick={() => updateStatus(w.id, "paid")} disabled={processing === w.id} className="flex-1 h-9 rounded-lg bg-terai text-white text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1"><DollarSign className="w-3 h-3" /> Mark Paid</button>
                  <button onClick={() => updateStatus(w.id, "rejected")} disabled={processing === w.id} className="flex-1 h-9 rounded-lg bg-red-500 text-white text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1"><X className="w-3 h-3" /> Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {processed.length > 0 && (
        <div>
          <h3 className="font-display font-bold text-lg text-foreground mb-3">Processed</h3>
          <div className="space-y-2">
            {processed.map(w => (
              <div key={w.id} className="bg-card rounded-2xl border border-border p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-foreground">{w.store_name || "Unknown"}</p>
                  <p className="text-xs text-foreground/40">{new Date(w.requested_date).toLocaleDateString()}</p>
                </div>
                <p className="text-sm font-bold text-foreground">Rs {w.amount?.toLocaleString()}</p>
                <span className={"text-[10px] font-bold px-2 py-1 rounded-full capitalize " + (statusColors[w.status] || "bg-muted")}>{w.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {withdrawals.length === 0 && <div className="text-center py-12"><DollarSign className="w-10 h-10 text-foreground/20 mx-auto mb-2" /><p className="text-sm text-foreground/40">No withdrawal requests yet.</p></div>}
    </div>
  );
}