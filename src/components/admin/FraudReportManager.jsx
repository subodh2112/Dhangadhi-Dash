import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ShieldAlert, Eye, CheckCircle, XCircle, Ban } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { logAdminAction } from "@/lib/adminLog";

const fraudTypes = ["fake_refund", "multiple_accounts", "coupon_abuse", "fake_order", "wrong_pricing", "fake_delivery", "location_manipulation", "spam_review", "other"];
const statuses = ["flagged", "investigating", "confirmed", "dismissed", "action_taken"];

export default function FraudReportManager() {
  const { toast } = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [adminAction, setAdminAction] = useState("");
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await base44.entities.FraudReport.list("-created_date", 100);
      setReports(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpdate = async (status, action) => {
    setProcessing(true);
    try {
      await base44.entities.FraudReport.update(selected.id, { status, admin_action: action || adminAction });
      await logAdminAction("Updated fraud report", "FraudReport", selected.reported_user_name, "Status: " + status + ", Action: " + (action || adminAction));
      toast({ title: "Fraud report updated" });
      setSelected(null);
      setAdminAction("");
      load();
    } catch { toast({ title: "Failed", variant: "destructive" }); }
    setProcessing(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  const filtered = filter ? reports.filter(r => r.status === filter) : reports;
  const statusColors = { flagged: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400", investigating: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400", confirmed: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400", dismissed: "bg-muted text-foreground/40", action_taken: "bg-terai/10 text-terai" };

  const stats = [
    { label: "Flagged", value: reports.filter(r => r.status === "flagged").length, color: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400" },
    { label: "Investigating", value: reports.filter(r => r.status === "investigating").length, color: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400" },
    { label: "Confirmed", value: reports.filter(r => r.status === "confirmed").length, color: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400" },
    { label: "Action Taken", value: reports.filter(r => r.status === "action_taken").length, color: "bg-terai/10 text-terai" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
            <div className={"w-9 h-9 rounded-lg flex items-center justify-center mb-2 " + s.color}><ShieldAlert className="w-4 h-4" /></div>
            <p className="text-lg font-display font-extrabold text-foreground">{s.value}</p>
            <p className="text-xs text-foreground/40">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {["", ...statuses].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={"px-3 py-1.5 rounded-lg text-xs font-bold capitalize " + (filter === s ? "bg-saffron text-white" : "bg-muted text-foreground/50")}>{s || "All"}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12"><ShieldAlert className="w-10 h-10 text-foreground/20 mx-auto mb-2" /><p className="text-sm text-foreground/40">No fraud reports.</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => (
            <div key={r.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
              <div className={"w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 " + (statusColors[r.status] || "bg-muted")}><ShieldAlert className="w-4 h-4" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-foreground truncate">{r.reported_user_name || "Unknown"}</p>
                  <span className={"text-[9px] font-bold px-2 py-0.5 rounded-full capitalize " + (statusColors[r.status] || "bg-muted")}>{r.status?.replace(/_/g, " ")}</span>
                </div>
                <p className="text-xs text-foreground/50 capitalize truncate">{r.fraud_type?.replace(/_/g, " ")} · {r.user_type}</p>
                <p className="text-xs text-foreground/40 truncate">{r.reason}</p>
              </div>
              <button onClick={() => { setSelected(r); setAdminAction(r.admin_action || ""); }} className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-saffron/10 hover:text-saffron"><Eye className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader><DialogTitle className="flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-red-500" /> Fraud Report</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-3 rounded-xl bg-muted/50"><p className="text-[10px] text-foreground/40 uppercase">Reported User</p><p className="font-semibold">{selected.reported_user_name}</p></div>
                  <div className="p-3 rounded-xl bg-muted/50"><p className="text-[10px] text-foreground/40 uppercase">Type</p><p className="font-semibold capitalize">{selected.fraud_type?.replace(/_/g, " ")}</p></div>
                  <div className="p-3 rounded-xl bg-muted/50"><p className="text-[10px] text-foreground/40 uppercase">User Type</p><p className="font-semibold capitalize">{selected.user_type}</p></div>
                  <div className="p-3 rounded-xl bg-muted/50"><p className="text-[10px] text-foreground/40 uppercase">Reported By</p><p className="font-semibold">{selected.reporter_name}</p></div>
                </div>
                <div className="p-3 rounded-xl bg-muted/50"><p className="text-[10px] text-foreground/40 uppercase mb-1">Reason</p><p className="text-sm text-foreground/70">{selected.reason}</p></div>
                {selected.evidence && <div className="p-3 rounded-xl bg-muted/50"><p className="text-[10px] text-foreground/40 uppercase mb-1">Evidence</p><p className="text-sm text-foreground/70">{selected.evidence}</p></div>}
                <div>
                  <label className="text-xs font-bold text-foreground/60 mb-1 block">Admin Action</label>
                  <textarea value={adminAction} onChange={(e) => setAdminAction(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-saffron/40" placeholder="Describe the action taken..." />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleUpdate("investigating")} disabled={processing} className="h-10 rounded-xl bg-amber-500 text-white text-xs font-bold disabled:opacity-50">Investigate</button>
                  <button onClick={() => handleUpdate("confirmed")} disabled={processing} className="h-10 rounded-xl bg-blue-500 text-white text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1"><CheckCircle className="w-3 h-3" /> Confirm</button>
                  <button onClick={() => handleUpdate("action_taken", "Account suspended")} disabled={processing} className="h-10 rounded-xl bg-red-500 text-white text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1"><Ban className="w-3 h-3" /> Suspend</button>
                  <button onClick={() => handleUpdate("dismissed")} disabled={processing} className="h-10 rounded-xl bg-muted text-foreground/60 text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1"><XCircle className="w-3 h-3" /> Dismiss</button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}