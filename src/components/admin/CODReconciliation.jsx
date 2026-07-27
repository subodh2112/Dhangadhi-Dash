import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Banknote, Check, Clock, DollarSign } from "lucide-react";

export default function CODReconciliation() {
  const { toast } = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await base44.entities.Payment.filter({ payment_method: "cod" }, "-created_date", 200);
      setPayments(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const markCollected = async (paymentId) => {
    setProcessing(paymentId);
    try {
      await base44.entities.Payment.update(paymentId, { payment_status: "successful", gateway_response: "COD collected by rider" });
      setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, payment_status: "successful" } : p));
      toast({ title: "Marked as collected" });
    } catch { toast({ title: "Failed", variant: "destructive" }); }
    setProcessing(null);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  const collected = payments.filter(p => p.payment_status === "successful");
  const pending = payments.filter(p => p.payment_status === "pending" || p.payment_status === "processing");
  const collectedAmount = collected.reduce((s, p) => s + (p.amount || 0), 0);
  const pendingAmount = pending.reduce((s, p) => s + (p.amount || 0), 0);

  const stats = [
    { label: "COD Collected", value: "Rs " + collectedAmount.toLocaleString(), sub: collected.length + " orders", icon: Check, color: "bg-terai/10 text-terai" },
    { label: "COD Pending", value: "Rs " + pendingAmount.toLocaleString(), sub: pending.length + " orders", icon: Clock, color: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400" },
    { label: "Total COD Orders", value: payments.length, sub: "All time", icon: Banknote, color: "bg-saffron/10 text-saffron" },
    { label: "Avg COD Value", value: "Rs " + (payments.length > 0 ? Math.round(collectedAmount / Math.max(collected.length, 1)).toLocaleString() : 0), sub: "Per collected order", icon: DollarSign, color: "bg-blue-500/10 text-blue-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
              <div className={"w-9 h-9 rounded-lg flex items-center justify-center mb-2 " + s.color}><Icon className="w-4 h-4" /></div>
              <p className="text-lg font-display font-extrabold text-foreground">{s.value}</p>
              <p className="text-xs text-foreground/40">{s.label}</p>
              <p className="text-[10px] text-foreground/30 mt-0.5">{s.sub}</p>
            </div>
          );
        })}
      </div>

      <div>
        <h3 className="font-display font-bold text-lg text-foreground mb-3">Pending COD Collection</h3>
        {pending.length === 0 ? (
          <p className="text-sm text-foreground/40 text-center py-8">No pending COD payments.</p>
        ) : (
          <div className="space-y-2">
            {pending.map(p => (
              <div key={p.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-foreground">{p.order_number || "N/A"}</p>
                  <p className="text-xs text-foreground/50">{p.customer_name} · {new Date(p.payment_date || p.created_date).toLocaleDateString()}</p>
                </div>
                <p className="text-lg font-display font-extrabold text-saffron">Rs {p.amount?.toLocaleString()}</p>
                <button onClick={() => markCollected(p.id)} disabled={processing === p.id} className="px-4 h-9 rounded-lg bg-terai text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1"><Check className="w-3 h-3" /> Mark Collected</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {collected.length > 0 && (
        <div>
          <h3 className="font-display font-bold text-lg text-foreground mb-3">Collected COD</h3>
          <div className="space-y-2">
            {collected.slice(0, 20).map(p => (
              <div key={p.id} className="bg-card rounded-2xl border border-border p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-terai/10 flex items-center justify-center"><Check className="w-4 h-4 text-terai" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-foreground">{p.order_number || "N/A"}</p>
                  <p className="text-xs text-foreground/40">{p.customer_name}</p>
                </div>
                <p className="text-sm font-bold text-terai">Rs {p.amount?.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}