import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, RotateCcw, Check, X, Eye, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { processRefund } from "@/lib/payments";

const reasons = ["missing_item", "wrong_item", "order_issue", "merchant_cancellation", "delivery_problem", "other"];

export default function RefundManager() {
  const { toast } = useToast();
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [adminNote, setAdminNote] = useState("");
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await base44.entities.Refund.list("-created_date", 100);
      setRefunds(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleProcess = async (status, refundMethod) => {
    setProcessing(true);
    const result = await processRefund(selected.id, status, adminNote, refundMethod);
    if (result.success) {
      toast({ title: "Refund " + status });
      setSelected(null);
      setAdminNote("");
      load();
    } else {
      toast({ title: result.error || "Failed", variant: "destructive" });
    }
    setProcessing(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  const filtered = statusFilter ? refunds.filter(r => r.status === statusFilter) : refunds;
  const statusColors = { requested: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400", under_review: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400", approved: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400", rejected: "bg-muted text-foreground/40", completed: "bg-terai/10 text-terai" };
  const inputClass = "w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40";

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {["", "requested", "under_review", "approved", "completed", "rejected"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={"px-3 py-1.5 rounded-lg text-xs font-bold capitalize " + (statusFilter === s ? "bg-saffron text-white" : "bg-muted text-foreground/50")}>{s || "All"}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12"><RotateCcw className="w-10 h-10 text-foreground/20 mx-auto mb-2" /><p className="text-sm text-foreground/40">No refund requests.</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => (
            <div key={r.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-sm text-foreground">{r.order_number || "N/A"}</p>
                  <span className={"text-[9px] font-bold px-2 py-0.5 rounded-full " + (statusColors[r.status] || "bg-muted")}>{r.status?.replace(/_/g, " ")}</span>
                </div>
                <p className="text-xs text-foreground/50 truncate">{r.customer_name} · {r.store_name}</p>
                <p className="text-xs text-foreground/40 capitalize">{r.reason?.replace(/_/g, " ")} · {new Date(r.requested_date).toLocaleDateString()}</p>
              </div>
              <p className="text-lg font-display font-extrabold text-saffron">Rs {r.amount?.toLocaleString()}</p>
              <button onClick={() => { setSelected(r); setAdminNote(r.admin_note || ""); }} className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-saffron/10 hover:text-saffron"><Eye className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader><DialogTitle>Refund — {selected.order_number}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-3 rounded-xl bg-muted/50"><p className="text-[10px] text-foreground/40 uppercase">Customer</p><p className="font-semibold">{selected.customer_name}</p></div>
                  <div className="p-3 rounded-xl bg-muted/50"><p className="text-[10px] text-foreground/40 uppercase">Amount</p><p className="font-semibold text-saffron">Rs {selected.amount?.toLocaleString()}</p></div>
                  <div className="p-3 rounded-xl bg-muted/50"><p className="text-[10px] text-foreground/40 uppercase">Reason</p><p className="font-semibold capitalize">{selected.reason?.replace(/_/g, " ")}</p></div>
                  <div className="p-3 rounded-xl bg-muted/50"><p className="text-[10px] text-foreground/40 uppercase">Status</p><p className="font-semibold capitalize">{selected.status?.replace(/_/g, " ")}</p></div>
                </div>
                {selected.description && <div className="p-3 rounded-xl bg-muted/50"><p className="text-[10px] text-foreground/40 uppercase mb-1">Description</p><p className="text-sm text-foreground/70">{selected.description}</p></div>}
                <div>
                  <label className="text-xs font-bold text-foreground/60 mb-1 block">Admin Note</label>
                  <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={2} className={inputClass + " resize-none"} placeholder="Add notes about this refund..." />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleProcess("under_review")} disabled={processing} className="h-10 rounded-xl bg-amber-500 text-white text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1"><Clock className="w-3 h-3" /> Under Review</button>
                  <button onClick={() => handleProcess("approved")} disabled={processing} className="h-10 rounded-xl bg-blue-500 text-white text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1"><Check className="w-3 h-3" /> Approve</button>
                  <button onClick={() => handleProcess("completed", "original_method")} disabled={processing} className="h-10 rounded-xl bg-terai text-white text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1"><RotateCcw className="w-3 h-3" /> Complete Refund</button>
                  <button onClick={() => handleProcess("rejected")} disabled={processing} className="h-10 rounded-xl bg-red-500 text-white text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1"><X className="w-3 h-3" /> Reject</button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}