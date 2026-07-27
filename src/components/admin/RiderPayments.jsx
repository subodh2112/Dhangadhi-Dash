import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { processWithdrawal } from "@/lib/riderWallet";
import { Button } from "@/components/ui/button";
import { Banknote, Check, X, Clock, Loader2, Wallet, AlertCircle } from "lucide-react";

const statusConfig = {
  pending: { label: "Pending", color: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" },
  approved: { label: "Approved", color: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400" },
  rejected: { label: "Rejected", color: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400" },
  paid: { label: "Paid", color: "bg-terai/10 text-terai" },
};

export default function RiderPayments() {
  const { toast } = useToast();
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [txnModal, setTxnModal] = useState(null);
  const [txnRef, setTxnRef] = useState("");
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectNote, setRejectNote] = useState("");

  const loadData = async () => {
    try {
      const data = await base44.entities.Withdrawal.list("-created_date", 200).catch(() => []);
      setWithdrawals(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadData(); const i = setInterval(loadData, 15000); return () => clearInterval(i); }, []);

  const handleAction = async (id, action, note, ref) => {
    setActionLoading(id + action);
    try {
      await processWithdrawal(id, action, note, ref);
      toast({ title: "Withdrawal " + action + "d", description: action === "pay" ? "Rider wallet updated." : action === "reject" ? "Funds returned to rider." : "Status updated." });
      setTxnModal(null); setTxnRef(""); setRejectModal(null); setRejectNote("");
      loadData();
    } catch (e) { toast({ title: e.message || "Action failed", variant: "destructive" }); }
    setActionLoading(null);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  const pending = withdrawals.filter((w) => w.status === "pending");
  const approved = withdrawals.filter((w) => w.status === "approved");
  const paid = withdrawals.filter((w) => w.status === "paid");
  const totalPending = pending.reduce((s, w) => s + w.amount, 0);
  const totalPaid = paid.reduce((s, w) => s + w.amount, 0);

  const stats = [
    { label: "Pending Requests", value: pending.length, sub: "Rs " + totalPending, color: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" },
    { label: "Approved", value: approved.length, sub: "Awaiting payment", color: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400" },
    { label: "Paid Out", value: paid.length, sub: "Rs " + totalPaid, color: "bg-terai/10 text-terai" },
    { label: "Total Requests", value: withdrawals.length, sub: "All time", color: "bg-saffron/10 text-saffron" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card rounded-2xl border border-border p-5">
            <div className={"w-10 h-10 rounded-xl flex items-center justify-center mb-3 " + stat.color}><Wallet className="w-5 h-5" /></div>
            <p className="text-2xl font-display font-extrabold text-foreground">{stat.value}</p>
            <p className="text-xs text-foreground/40">{stat.label}</p>
            <p className="text-xs font-bold text-foreground/60 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-3xl border border-border p-6">
        <h2 className="font-display font-bold text-lg text-foreground mb-4">Withdrawal Requests</h2>
        {withdrawals.length === 0 ? (
          <p className="text-sm text-foreground/40 text-center py-8">No withdrawal requests yet.</p>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((w) => {
              const sc = statusConfig[w.status] || statusConfig.pending;
              return (
                <div key={w.id} className="border border-border rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-foreground">{w.rider_name}</p>
                      <p className="text-xs text-foreground/40">{w.payment_method.replace(/_/g, " ")} · {w.requested_date ? new Date(w.requested_date).toLocaleDateString() : "—"}</p>
                      {w.account_details && <p className="text-xs text-foreground/50 mt-1 truncate">{w.account_details}</p>}
                      {w.transaction_reference && <p className="text-xs text-terai font-mono mt-1">Ref: {w.transaction_reference}</p>}
                      {w.admin_note && <p className="text-xs text-foreground/40 mt-1">Note: {w.admin_note}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-foreground">Rs {w.amount}</p>
                      <span className={"inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 " + sc.color}>{sc.label}</span>
                    </div>
                  </div>
                  {w.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-blue-500 hover:bg-blue-600 h-8 flex-1" onClick={() => handleAction(w.id, "approve")} disabled={actionLoading === w.id + "approve"}>
                        {actionLoading === w.id + "approve" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Approve
                      </Button>
                      <Button size="sm" variant="destructive" className="h-8 flex-1" onClick={() => setRejectModal(w)} disabled={actionLoading === w.id + "reject"}>
                        <X className="w-3.5 h-3.5" /> Reject
                      </Button>
                    </div>
                  )}
                  {(w.status === "approved") && (
                    <Button size="sm" className="bg-terai hover:bg-terai/90 h-8 w-full" onClick={() => { setTxnModal(w); setTxnRef("TXN-" + Date.now()); }} disabled={actionLoading === w.id + "pay"}>
                      {actionLoading === w.id + "pay" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Banknote className="w-3.5 h-3.5" />} Mark as Paid
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {txnModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-carbon/50 backdrop-blur-sm" onClick={() => setTxnModal(null)} />
          <div className="relative bg-card rounded-3xl border border-border p-6 max-w-sm w-full">
            <h3 className="font-display font-bold text-foreground mb-2">Confirm Payment</h3>
            <p className="text-sm text-foreground/60 mb-4">Mark withdrawal of <b>Rs {txnModal.amount}</b> for {txnModal.rider_name} as paid.</p>
            <label className="text-xs text-foreground/50 font-medium">Transaction Reference</label>
            <input className="w-full h-10 px-3 mt-1 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-terai/30" value={txnRef} onChange={(e) => setTxnRef(e.target.value)} />
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setTxnModal(null)}>Cancel</Button>
              <Button className="flex-1 bg-terai hover:bg-terai/90" onClick={() => handleAction(txnModal.id, "pay", null, txnRef)} disabled={actionLoading === txnModal.id + "pay"}>
                {actionLoading === txnModal.id + "pay" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Confirm Paid
              </Button>
            </div>
          </div>
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-carbon/50 backdrop-blur-sm" onClick={() => setRejectModal(null)} />
          <div className="relative bg-card rounded-3xl border border-border p-6 max-w-sm w-full">
            <h3 className="font-display font-bold text-foreground mb-2">Reject Withdrawal</h3>
            <p className="text-sm text-foreground/60 mb-4">Reject withdrawal of Rs {rejectModal.amount} for {rejectModal.rider_name}. Funds will be returned to their wallet.</p>
            <label className="text-xs text-foreground/50 font-medium">Reason (optional)</label>
            <textarea className="w-full h-20 px-3 mt-1 rounded-xl border border-border bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400/30" value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="Reason for rejection..." />
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setRejectModal(null)}>Cancel</Button>
              <Button variant="destructive" className="flex-1" onClick={() => handleAction(rejectModal.id, "reject", rejectNote)} disabled={actionLoading === rejectModal.id + "reject"}>
                {actionLoading === rejectModal.id + "reject" ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />} Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}