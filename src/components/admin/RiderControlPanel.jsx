import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Search, Eye, Ban, CheckCircle, Bike, Star, MapPin, FileText, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { logAdminAction } from "@/lib/adminLog";

export default function RiderControlPanel() {
  const { toast } = useToast();
  const [riders, setRiders] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    try {
      const [r, a] = await Promise.all([
        base44.entities.Rider.list("-created_date", 200),
        base44.entities.MerchantApplication.filter({ applicant_type: "rider" }).catch(() => []),
      ]);
      setRiders(r); setApps(a);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleSuspend = async (rider) => {
    const suspend = !rider.is_suspended;
    try {
      await base44.entities.Rider.update(rider.id, { is_suspended: suspend, status: suspend ? "offline" : "available" });
      await logAdminAction(suspend ? "Suspended rider" : "Reactivated rider", "Rider", rider.name, "ID: " + rider.id);
      toast({ title: "Rider " + (suspend ? "suspended" : "reactivated") });
      load();
      if (selected?.id === rider.id) setSelected({ ...selected, is_suspended: suspend });
    } catch { toast({ title: "Failed", variant: "destructive" }); }
  };

  const updateKyc = async (rider, status) => {
    try {
      await base44.entities.Rider.update(rider.id, { kyc_status: status });
      await logAdminAction("Updated rider KYC", "Rider", rider.name, "KYC: " + status);
      toast({ title: "KYC " + status });
      load();
      if (selected?.id === rider.id) setSelected({ ...selected, kyc_status: status });
    } catch { toast({ title: "Failed", variant: "destructive" }); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  const filtered = riders.filter(r => !search || r.name?.toLowerCase().includes(search.toLowerCase()) || r.phone?.includes(search));

  const getKycStatus = (riderId) => {
    const app = apps.find(a => a.rider_code && riders.find(r => r.id === riderId && r.rider_code === a.rider_code));
    return app?.status || "unknown";
  };

  const statusColors = { available: "bg-terai/10 text-terai", on_delivery: "bg-saffron/10 text-saffron", busy: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400", on_break: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400", offline: "bg-muted text-foreground/40" };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-foreground/40" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or phone..." className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40" />
      </div>

      <p className="text-xs text-foreground/40">{filtered.length} riders</p>

      <div className="space-y-2">
        {filtered.slice(0, 50).map(r => (
          <div key={r.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-saffron/10 flex items-center justify-center flex-shrink-0"><Bike className="w-5 h-5 text-saffron" /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm text-foreground truncate">{r.name}</p>
                {r.is_suspended && <span className="text-[9px] bg-red-50 text-red-500 dark:bg-red-500/10 font-bold px-2 py-0.5 rounded-full">Suspended</span>}
                <span className={"text-[9px] font-bold px-2 py-0.5 rounded-full capitalize " + (statusColors[r.status] || "bg-muted")}>{r.status?.replace(/_/g, " ")}</span>
              </div>
              <div className="flex gap-3 mt-0.5">
                <span className="text-[10px] text-foreground/50">{r.phone}</span>
                <span className="text-[10px] text-foreground/50 capitalize">{r.vehicle_type}</span>
                <span className="text-[10px] text-foreground/50 flex items-center gap-0.5"><Star className="w-3 h-3" /> {r.rating || "—"}</span>
                <span className="text-[10px] text-foreground/50">{r.total_deliveries || 0} deliveries</span>
              </div>
            </div>
            <button onClick={() => setSelected(r)} className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-saffron/10 hover:text-saffron"><Eye className="w-4 h-4" /></button>
            {r.is_suspended ? (
              <button onClick={() => toggleSuspend(r)} className="w-9 h-9 rounded-lg bg-terai/10 text-terai flex items-center justify-center"><CheckCircle className="w-4 h-4" /></button>
            ) : (
              <button onClick={() => toggleSuspend(r)} className="w-9 h-9 rounded-lg bg-red-50 text-red-500 dark:bg-red-500/10 flex items-center justify-center"><Ban className="w-4 h-4" /></button>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && <div className="text-center py-12"><Bike className="w-10 h-10 text-foreground/20 mx-auto mb-2" /><p className="text-sm text-foreground/40">No riders found.</p></div>}

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader><DialogTitle>{selected.name}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-saffron/10 flex items-center justify-center"><Bike className="w-6 h-6 text-saffron" /></div>
                  <div>
                    <p className="font-bold text-foreground">{selected.name}</p>
                    <p className="text-sm text-foreground/40">{selected.phone} · {selected.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-3 rounded-xl bg-muted/50"><p className="text-[10px] text-foreground/40 uppercase">Vehicle</p><p className="font-semibold capitalize">{selected.vehicle_type}</p></div>
                  <div className="p-3 rounded-xl bg-muted/50"><p className="text-[10px] text-foreground/40 uppercase">Vehicle #</p><p className="font-semibold">{selected.vehicle_number || "—"}</p></div>
                  <div className="p-3 rounded-xl bg-muted/50"><p className="text-[10px] text-foreground/40 uppercase">License</p><p className="font-semibold">{selected.license_number || "—"}</p></div>
                  <div className="p-3 rounded-xl bg-muted/50"><p className="text-[10px] text-foreground/40 uppercase">Area</p><p className="font-semibold">{selected.area || "—"}</p></div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[{ label: "Deliveries", value: selected.total_deliveries || 0 }, { label: "Earnings", value: "Rs " + (selected.total_earnings || 0).toLocaleString() }, { label: "Rating", value: selected.rating || "—" }].map(s => (
                    <div key={s.label} className="p-3 rounded-xl bg-muted/50 text-center"><p className="text-sm font-bold text-foreground">{s.value}</p><p className="text-[10px] text-foreground/40">{s.label}</p></div>
                  ))}
                </div>
                {selected.address && <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50"><MapPin className="w-4 h-4 text-saffron mt-0.5" /><div><p className="text-[10px] text-foreground/40 uppercase">Address</p><p className="text-sm text-foreground/70">{selected.address}</p></div></div>}
                {selected.vehicle_documents_url && <a href={selected.vehicle_documents_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 text-sm font-bold"><FileText className="w-4 h-4" /> View Vehicle Documents</a>}
                <div className="p-4 rounded-xl bg-saffron/5 border border-saffron/10">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-foreground/60 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> KYC Status</p>
                    <span className={"text-[10px] font-bold px-2 py-0.5 rounded-full capitalize " + (selected.kyc_status === "approved" ? "bg-terai/10 text-terai" : selected.kyc_status === "rejected" ? "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400" : "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400")}>{selected.kyc_status || "pending"}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => updateKyc(selected, "approved")} className="flex-1 h-9 rounded-lg bg-terai text-white text-xs font-bold flex items-center justify-center gap-1"><CheckCircle className="w-3 h-3" /> Approve</button>
                    <button onClick={() => updateKyc(selected, "rejected")} className="flex-1 h-9 rounded-lg bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-1"><Ban className="w-3 h-3" /> Reject</button>
                  </div>
                </div>
                {selected.is_suspended ? (
                  <button onClick={() => toggleSuspend(selected)} className="w-full h-10 rounded-xl bg-terai text-white text-sm font-bold flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4" /> Reactivate Rider</button>
                ) : (
                  <button onClick={() => toggleSuspend(selected)} className="w-full h-10 rounded-xl bg-red-500 text-white text-sm font-bold flex items-center justify-center gap-2"><Ban className="w-4 h-4" /> Suspend Rider</button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}