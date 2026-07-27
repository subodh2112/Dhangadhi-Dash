import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Search, Eye, Ban, CheckCircle, Store, DollarSign, ShieldCheck, AlertTriangle, Power } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { logAdminAction } from "@/lib/adminLog";

export default function MerchantControlPanel() {
  const { toast } = useToast();
  const [stores, setStores] = useState([]);
  const [orders, setOrders] = useState([]);
  const [apps, setApps] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [commissionRate, setCommissionRate] = useState("");

  const load = useCallback(async () => {
    try {
      const [s, o, a, w] = await Promise.all([
        base44.entities.Store.list("-created_date", 200),
        base44.entities.Order.list("-created_date", 500).catch(() => []),
        base44.entities.MerchantApplication.filter({ applicant_type: "merchant" }).catch(() => []),
        base44.entities.MerchantWallet.list("-created_date", 100).catch(() => []),
      ]);
      setStores(s); setOrders(o); setApps(a); setWallets(w);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleSuspend = async (store) => {
    const suspend = !store.is_suspended;
    try {
      await base44.entities.Store.update(store.id, { is_suspended: suspend });
      await logAdminAction(suspend ? "Suspended store" : "Reactivated store", "Store", store.name, "ID: " + store.id);
      toast({ title: "Store " + (suspend ? "suspended" : "reactivated") });
      load();
      if (selected?.id === store.id) setSelected({ ...selected, is_suspended: suspend });
    } catch { toast({ title: "Failed", variant: "destructive" }); }
  };

  const toggleVisibility = async (store) => {
    try {
      await base44.entities.Store.update(store.id, { is_open: !store.is_open });
      await logAdminAction("Toggled store visibility", "Store", store.name, "is_open: " + !store.is_open);
      load();
    } catch {}
  };

  const updateCommission = async (storeId, storeName) => {
    try {
      const storeWallets = wallets.filter(w => w.store_id === storeId);
      if (storeWallets.length > 0) {
        await base44.entities.MerchantWallet.update(storeWallets[0].id, { commission_rate: Number(commissionRate) / 100 });
      }
      await logAdminAction("Updated commission rate", "Store", storeName, "Rate: " + commissionRate + "%");
      toast({ title: "Commission updated to " + commissionRate + "%" });
      setSelected(null);
      load();
    } catch { toast({ title: "Failed", variant: "destructive" }); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  const filtered = stores.filter(s => !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.category?.toLowerCase().includes(search.toLowerCase()));

  const getStoreStats = (storeId) => {
    const storeOrders = orders.filter(o => o.store_id === storeId);
    const delivered = storeOrders.filter(o => o.status === "delivered");
    const revenue = delivered.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const wallet = wallets.find(w => w.store_id === storeId);
    return { orderCount: storeOrders.length, revenue, available: wallet?.available_balance || 0, commissionRate: wallet?.commission_rate || 0.1 };
  };

  const getKycStatus = (storeId) => {
    const app = apps.find(a => a.assigned_store_id === storeId);
    return app?.status || "unknown";
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-foreground/40" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search stores by name or category..." className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40" />
      </div>

      <p className="text-xs text-foreground/40">{filtered.length} stores</p>

      <div className="space-y-2">
        {filtered.slice(0, 50).map(s => {
          const stats = getStoreStats(s.id);
          const kyc = getKycStatus(s.id);
          return (
            <div key={s.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-saffron/10 flex items-center justify-center flex-shrink-0"><Store className="w-5 h-5 text-saffron" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-foreground truncate">{s.name}</p>
                  {s.is_suspended && <span className="text-[9px] bg-red-50 text-red-500 dark:bg-red-500/10 font-bold px-2 py-0.5 rounded-full">Suspended</span>}
                  {!s.is_open && <span className="text-[9px] bg-muted text-foreground/40 font-bold px-2 py-0.5 rounded-full">Closed</span>}
                </div>
                <div className="flex gap-3 mt-0.5">
                  <span className="text-[10px] text-foreground/50 capitalize">{s.category}</span>
                  <span className="text-[10px] text-foreground/50 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Rs {stats.revenue.toLocaleString()}</span>
                  <span className="text-[10px] text-foreground/50">{stats.orderCount} orders</span>
                  <span className={"text-[10px] font-bold flex items-center gap-1 " + (kyc === "approved" || kyc === "account_created" ? "text-terai" : kyc === "rejected" ? "text-red-500" : "text-amber-500")}><ShieldCheck className="w-3 h-3" /> {kyc}</span>
                </div>
              </div>
              <button onClick={() => { setSelected(s); setCommissionRate(String(stats.commissionRate * 100)); }} className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-saffron/10 hover:text-saffron"><Eye className="w-4 h-4" /></button>
              <button onClick={() => toggleVisibility(s)} className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-saffron/10 hover:text-saffron"><Power className="w-4 h-4" /></button>
              {s.is_suspended ? (
                <button onClick={() => toggleSuspend(s)} className="w-9 h-9 rounded-lg bg-terai/10 text-terai flex items-center justify-center"><CheckCircle className="w-4 h-4" /></button>
              ) : (
                <button onClick={() => toggleSuspend(s)} className="w-9 h-9 rounded-lg bg-red-50 text-red-500 dark:bg-red-500/10 flex items-center justify-center"><Ban className="w-4 h-4" /></button>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && <div className="text-center py-12"><Store className="w-10 h-10 text-foreground/20 mx-auto mb-2" /><p className="text-sm text-foreground/40">No stores found.</p></div>}

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader><DialogTitle>{selected.name}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-3 rounded-xl bg-muted/50"><p className="text-[10px] text-foreground/40 uppercase">Category</p><p className="font-semibold capitalize">{selected.category}</p></div>
                  <div className="p-3 rounded-xl bg-muted/50"><p className="text-[10px] text-foreground/40 uppercase">Phone</p><p className="font-semibold">{selected.phone || "—"}</p></div>
                  <div className="p-3 rounded-xl bg-muted/50"><p className="text-[10px] text-foreground/40 uppercase">Rating</p><p className="font-semibold">{selected.rating || "—"} ★</p></div>
                  <div className="p-3 rounded-xl bg-muted/50"><p className="text-[10px] text-foreground/40 uppercase">KYC</p><p className="font-semibold capitalize">{getKycStatus(selected.id)}</p></div>
                </div>
                {selected.address && <div><p className="text-xs text-foreground/40">Address</p><p className="text-sm text-foreground/70">{selected.address}</p></div>}
                <div className="grid grid-cols-3 gap-2">
                  {[{ label: "Orders", value: getStoreStats(selected.id).orderCount }, { label: "Revenue", value: "Rs " + getStoreStats(selected.id).revenue.toLocaleString() }, { label: "Available", value: "Rs " + getStoreStats(selected.id).available.toLocaleString() }].map(s => (
                    <div key={s.label} className="p-3 rounded-xl bg-muted/50 text-center"><p className="text-sm font-bold text-foreground">{s.value}</p><p className="text-[10px] text-foreground/40">{s.label}</p></div>
                  ))}
                </div>
                <div className="p-4 rounded-xl bg-saffron/5 border border-saffron/10">
                  <label className="text-xs font-bold text-foreground/60 mb-1 block">Commission Rate (%)</label>
                  <div className="flex gap-2">
                    <input type="number" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} className="flex-1 h-10 px-3 rounded-xl border border-border bg-background text-sm" />
                    <button onClick={() => updateCommission(selected.id, selected.name)} className="px-4 rounded-xl bg-saffron text-white text-sm font-bold">Update</button>
                  </div>
                </div>
                {selected.is_suspended ? (
                  <button onClick={() => toggleSuspend(selected)} className="w-full h-10 rounded-xl bg-terai text-white text-sm font-bold flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4" /> Reactivate Store</button>
                ) : (
                  <button onClick={() => toggleSuspend(selected)} className="w-full h-10 rounded-xl bg-red-500 text-white text-sm font-bold flex items-center justify-center gap-2"><Ban className="w-4 h-4" /> Suspend Store</button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}