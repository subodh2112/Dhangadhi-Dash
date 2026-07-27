import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { logAdminAction } from "@/lib/adminLog";
import MerchantList from "@/components/admin/MerchantList";
import AddMerchantForm from "@/components/admin/AddMerchantForm";
import { INDUSTRY_CATEGORIES } from "@/lib/categories";
import {
  Store as StoreIcon, UserPlus, ClipboardList, Link2, Loader2, FileText, KeyRound, RefreshCw,
} from "lucide-react";

const subTabs = [
  { key: "list", label: "All Merchants", icon: StoreIcon },
  { key: "add", label: "Add Merchant", icon: UserPlus },
  { key: "applications", label: "Applications", icon: ClipboardList },
  { key: "assignment", label: "Store Assignment", icon: Link2 },
];

export default function MerchantManagement() {
  const { toast } = useToast();
  const [subTab, setSubTab] = useState("list");
  const [stores, setStores] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [apps, setApps] = useState([]);
  const [unlinkedStores, setUnlinkedStores] = useState([]);
  const [merchantUsers, setMerchantUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editStore, setEditStore] = useState(null);

  const load = useCallback(async () => {
    try {
      const [s, o, p, a] = await Promise.all([
        base44.entities.Store.list("-created_date", 500),
        base44.entities.Order.list("-created_date", 1000).catch(() => []),
        base44.entities.Product.list("-created_date", 500).catch(() => []),
        base44.entities.MerchantApplication.filter({ applicant_type: "merchant" }, "-created_date", 100).catch(() => []),
      ]);
      setStores(s); setOrders(o); setProducts(p); setApps(a);
      setUnlinkedStores(s.filter((st) => !st.merchant_id));
      const users = await base44.entities.User.filter({ role: "merchant" }, "-created_date", 200).catch(() => []);
      setMerchantUsers(users.filter((u) => !u.store_id));
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAssignStore = async (userId, storeId) => {
    try {
      await base44.entities.User.update(userId, { store_id: storeId });
      await base44.entities.Store.update(storeId, { merchant_id: userId });
      await logAdminAction("Assigned store to merchant", "merchant", storeId, userId);
      toast({ title: "Store assigned!" });
      load();
    } catch {
      toast({ title: "Failed to assign", variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-xl text-foreground flex items-center gap-2">
          <StoreIcon className="w-5 h-5 text-saffron" /> Merchant Management
        </h2>
        <p className="text-sm text-foreground/50 mt-0.5">Create merchants, generate credentials, assign stores, and manage accounts.</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl overflow-x-auto no-scrollbar">
        {subTabs.map((t) => (
          <button key={t.key} onClick={() => { setSubTab(t.key); if (t.key === "add") setEditStore(null); }} className={"px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1.5 " + (subTab === t.key ? "bg-background text-saffron shadow-sm" : "text-foreground/50")}>
            <t.icon className="w-4 h-4" /> {t.label}
            {t.key === "applications" && apps.filter((a) => a.status === "pending").length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-saffron/10 text-saffron text-[9px] font-bold">{apps.filter((a) => a.status === "pending").length}</span>
            )}
            {t.key === "assignment" && unlinkedStores.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[9px] font-bold">{unlinkedStores.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* All Merchants */}
      {subTab === "list" && (
        <MerchantList
          stores={stores}
          orders={orders}
          products={products}
          loading={loading}
          onEdit={(s) => { setEditStore(s); setSubTab("add"); }}
          onRefresh={load}
        />
      )}

      {/* Add/Edit Merchant */}
      {subTab === "add" && (
        <AddMerchantForm
          editStore={editStore}
          onSaved={() => { setEditStore(null); setSubTab("list"); load(); }}
          onCancel={() => { setEditStore(null); setSubTab("list"); }}
        />
      )}

      {/* Applications */}
      {subTab === "applications" && (
        <div className="space-y-3">
          {apps.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-12 text-center">
              <ClipboardList className="w-10 h-10 text-foreground/20 mx-auto mb-2" />
              <p className="text-sm text-foreground/40">No merchant applications.</p>
            </div>
          ) : (
            apps.map((app) => (
              <div key={app.id} className="bg-card rounded-2xl border border-border p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-sm text-foreground">{app.business_name}</p>
                  <p className="text-xs text-foreground/50">{app.owner_name} · {app.email} · {app.phone_number}</p>
                  <p className="text-[10px] text-foreground/40 mt-0.5">PAN: {app.pan_number} · Category: {app.store_category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={"text-[9px] font-bold px-2 py-1 rounded-full " + (app.status === "pending" ? "bg-amber-500/10 text-amber-500" : app.status === "approved" || app.status === "account_created" ? "bg-terai/10 text-terai" : "bg-red-50 text-red-500 dark:bg-red-500/10")}>{app.status?.replace(/_/g, " ")}</span>
                  {app.status === "pending" && (
                    <button onClick={async () => {
                      try {
                        await base44.entities.MerchantApplication.update(app.id, { status: "approved" });
                        await logAdminAction("Approved merchant application", "merchant", app.business_name, app.email);
                        toast({ title: "Application approved" });
                        load();
                      } catch { toast({ title: "Failed", variant: "destructive" }); }
                    }} className="px-3 h-8 rounded-lg bg-terai text-white text-xs font-bold">Approve</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Store Assignment */}
      {subTab === "assignment" && (
        <div className="space-y-6">
          {/* Unlinked Stores */}
          <div>
            <h3 className="font-bold text-sm text-foreground/60 mb-3 flex items-center gap-2"><StoreIcon className="w-4 h-4" /> Stores Without Merchant ({unlinkedStores.length})</h3>
            {unlinkedStores.length === 0 ? (
              <p className="text-sm text-foreground/40 bg-card rounded-xl border border-border p-6 text-center">All stores have merchants assigned.</p>
            ) : (
              <div className="space-y-2">
                {unlinkedStores.map((s) => (
                  <div key={s.id} className="bg-card rounded-2xl border border-border p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-foreground">{s.name}</p>
                      <p className="text-xs text-foreground/40">{s.store_code || "No code"} · {s.category}</p>
                    </div>
                    <select onChange={(e) => e.target.value && handleAssignStore(e.target.value, s.id)} defaultValue="" className="h-9 px-3 rounded-lg border border-border bg-background text-sm font-bold text-foreground/70">
                      <option value="" disabled>Assign merchant...</option>
                      {merchantUsers.map((u) => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Unlinked Merchant Users */}
          <div>
            <h3 className="font-bold text-sm text-foreground/60 mb-3 flex items-center gap-2"><UserPlus className="w-4 h-4" /> Merchant Users Without Store ({merchantUsers.length})</h3>
            {merchantUsers.length === 0 ? (
              <p className="text-sm text-foreground/40 bg-card rounded-xl border border-border p-6 text-center">All merchants have stores assigned.</p>
            ) : (
              <div className="space-y-2">
                {merchantUsers.map((u) => (
                  <div key={u.id} className="bg-card rounded-2xl border border-border p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-foreground">{u.full_name || "Unknown"}</p>
                      <p className="text-xs text-foreground/40">{u.email}</p>
                    </div>
                    <select onChange={async (e) => {
                      const storeId = e.target.value;
                      if (!storeId) return;
                      await handleAssignStore(u.id, storeId);
                    }} defaultValue="" className="h-9 px-3 rounded-lg border border-border bg-background text-sm font-bold text-foreground/70">
                      <option value="" disabled>Assign store...</option>
                      {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}