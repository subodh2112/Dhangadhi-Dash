import React, { useState, useMemo } from "react";
import { useToast } from "@/components/ui/use-toast";
import { logAdminAction } from "@/lib/adminLog";
import { resetMerchantPassword } from "@/lib/merchantUtils";
import MerchantDetailModal from "@/components/admin/MerchantDetailModal";
import {
  Search, Eye, Ban, CheckCircle, Trash2, KeyRound, Copy, Check, Star,
  Loader2, Store as StoreIcon, ChevronDown, ChevronUp,
} from "lucide-react";
import { Image } from "@/components/ui/image";

export default function MerchantList({ stores, orders, products, loading, onEdit, onRefresh }) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [sortBy, setSortBy] = useState("created");
  const [actionLoading, setActionLoading] = useState(null);
  const [copiedId, setCopiedId] = useState("");

  const getStats = (storeId) => {
    const storeOrders = orders.filter((o) => o.store_id === storeId);
    const delivered = storeOrders.filter((o) => o.status === "delivered");
    const revenue = delivered.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const productCount = products.filter((p) => p.store_id === storeId).length;
    return { orderCount: storeOrders.length, revenue, productCount };
  };

  const filtered = useMemo(() => {
    let result = stores.filter((s) =>
      !search ||
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.owner_email?.toLowerCase().includes(search.toLowerCase()) ||
      s.merchant_code?.toLowerCase().includes(search.toLowerCase()) ||
      s.username?.toLowerCase().includes(search.toLowerCase())
    );
    if (sortBy === "revenue") {
      result = [...result].sort((a, b) => getStats(b.id).revenue - getStats(a.id).revenue);
    } else if (sortBy === "orders") {
      result = [...result].sort((a, b) => getStats(b.id).orderCount - getStats(a.id).orderCount);
    } else if (sortBy === "rating") {
      result = [...result].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    return result;
  }, [stores, orders, products, search, sortBy]);

  const toggleSuspend = async (store) => {
    if (actionLoading) return;
    setActionLoading(store.id);
    const suspend = !store.is_suspended;
    try {
      const { base44 } = await import("@/api/base44Client");
      await base44.entities.Store.update(store.id, { is_suspended: suspend });
      await logAdminAction(suspend ? "Suspended merchant" : "Activated merchant", "merchant", store.merchant_code || store.name, store.owner_email || "");
      toast({ title: "Merchant " + (suspend ? "suspended" : "activated") });
      onRefresh();
      if (selected?.id === store.id) setSelected({ ...selected, is_suspended: suspend });
    } catch {
      toast({ title: "Failed", variant: "destructive" });
    }
    setActionLoading(null);
  };

  const handleDelete = async (store) => {
    if (!confirm(`Delete merchant "${store.name}"? This cannot be undone.`)) return;
    if (actionLoading) return;
    setActionLoading(store.id);
    try {
      const { base44 } = await import("@/api/base44Client");
      await base44.entities.Store.delete(store.id);
      await logAdminAction("Deleted merchant", "merchant", store.merchant_code || store.name, store.owner_email || "");
      toast({ title: "Merchant deleted" });
      setSelected(null);
      onRefresh();
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
    setActionLoading(null);
  };

  const handleQuickResetPassword = async (store) => {
    if (actionLoading) return;
    setActionLoading(store.id);
    try {
      const pwd = await resetMerchantPassword(store);
      await logAdminAction("Reset merchant password", "merchant", store.merchant_code || store.name, store.owner_email || "");
      toast({ title: "Password reset & emailed", description: "New: " + pwd });
    } catch {
      toast({ title: "Failed", variant: "destructive" });
    }
    setActionLoading(null);
  };

  const copyCredentials = (store) => {
    const text = `Merchant: ${store.name}\nEmail: ${store.owner_email}\nUsername: ${store.username}\nMerchant Code: ${store.merchant_code}\nStore Code: ${store.store_code}`;
    navigator.clipboard.writeText(text);
    setCopiedId(store.id);
    setTimeout(() => setCopiedId(""), 2000);
    toast({ title: "Credentials copied!" });
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Search & Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3.5 w-4 h-4 text-foreground/40" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, code, email, username..." className="w-full h-11 pl-9 pr-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40" />
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="h-11 px-3 rounded-xl border border-border bg-background text-sm font-bold text-foreground/70">
          <option value="created">Newest</option>
          <option value="revenue">Revenue</option>
          <option value="orders">Orders</option>
          <option value="rating">Rating</option>
        </select>
      </div>

      <p className="text-xs text-foreground/40">{filtered.length} merchants</p>

      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] font-bold text-foreground/40 uppercase border-b border-border">
              <th className="pb-2 pr-3">Merchant</th>
              <th className="pb-2 px-3">Owner</th>
              <th className="pb-2 px-3">Contact</th>
              <th className="pb-2 px-3 text-right">Orders</th>
              <th className="pb-2 px-3 text-right">Revenue</th>
              <th className="pb-2 px-3">Status</th>
              <th className="pb-2 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 100).map((s) => {
              const stats = getStats(s.id);
              return (
                <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-saffron/10 flex items-center justify-center flex-shrink-0 overflow-hidden">{s.logo_url ? <Image src={s.logo_url} alt={s.name} fittingType="fill" className="w-full h-full" /> : <StoreIcon className="w-4 h-4 text-saffron" />}</div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate">{s.name}</p>
                        <p className="text-[10px] text-foreground/40 font-mono">{s.merchant_code || "—"} · {s.store_code || "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3"><p className="font-medium text-foreground">{s.owner_name || "—"}</p><p className="text-[10px] text-foreground/40 font-mono">{s.username || ""}</p></td>
                  <td className="px-3"><p className="text-foreground/70 truncate max-w-[160px]">{s.owner_email || s.phone || "—"}</p></td>
                  <td className="px-3 text-right font-bold text-foreground">{stats.orderCount}</td>
                  <td className="px-3 text-right font-bold text-foreground">Rs {(stats.revenue || 0).toLocaleString()}</td>
                  <td className="px-3">
                    {s.is_suspended ? <span className="text-[9px] bg-red-50 text-red-500 dark:bg-red-500/10 font-bold px-2 py-0.5 rounded-full">Suspended</span> : <span className="text-[9px] bg-terai/10 text-terai font-bold px-2 py-0.5 rounded-full">Active</span>}
                  </td>
                  <td className="px-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setSelected(s)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-saffron/10 hover:text-saffron" title="View"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => copyCredentials(s)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-saffron/10 hover:text-saffron" title="Copy Credentials">{copiedId === s.id ? <Check className="w-4 h-4 text-terai" /> : <Copy className="w-4 h-4" />}</button>
                      <button onClick={() => handleQuickResetPassword(s)} disabled={actionLoading === s.id} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-saffron/10 hover:text-saffron disabled:opacity-50" title="Reset Password"><KeyRound className="w-4 h-4" /></button>
                      {s.is_suspended ? (
                        <button onClick={() => toggleSuspend(s)} disabled={actionLoading === s.id} className="w-8 h-8 rounded-lg bg-terai/10 text-terai flex items-center justify-center disabled:opacity-50" title="Activate"><CheckCircle className="w-4 h-4" /></button>
                      ) : (
                        <button onClick={() => toggleSuspend(s)} disabled={actionLoading === s.id} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 dark:bg-red-500/10 flex items-center justify-center disabled:opacity-50" title="Suspend"><Ban className="w-4 h-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-2">
        {filtered.slice(0, 50).map((s) => {
          const stats = getStats(s.id);
          return (
            <div key={s.id} className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-saffron/10 flex items-center justify-center flex-shrink-0 overflow-hidden">{s.logo_url ? <Image src={s.logo_url} alt={s.name} fittingType="fill" className="w-full h-full" /> : <StoreIcon className="w-4 h-4 text-saffron" />}</div>
                  <div className="min-w-0"><p className="font-bold text-sm text-foreground truncate">{s.name}</p><p className="text-[10px] text-foreground/40 font-mono">{s.merchant_code} · {s.store_code}</p></div>
                </div>
                {s.is_suspended ? <span className="text-[9px] bg-red-50 text-red-500 dark:bg-red-500/10 font-bold px-2 py-0.5 rounded-full">Suspended</span> : <span className="text-[9px] bg-terai/10 text-terai font-bold px-2 py-0.5 rounded-full">Active</span>}
              </div>
              <div className="flex gap-3 text-xs text-foreground/50 mb-3">
                <span>{stats.orderCount} orders</span>
                <span>Rs {(stats.revenue || 0).toLocaleString()}</span>
                {s.rating && <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-saffron fill-saffron" />{s.rating}</span>}
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => setSelected(s)} className="flex-1 h-9 rounded-lg bg-muted flex items-center justify-center gap-1 text-xs font-bold text-foreground/70"><Eye className="w-3.5 h-3.5" /> View</button>
                <button onClick={() => copyCredentials(s)} className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-foreground/70">{copiedId === s.id ? <Check className="w-4 h-4 text-terai" /> : <Copy className="w-4 h-4" />}</button>
                <button onClick={() => handleQuickResetPassword(s)} disabled={actionLoading === s.id} className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-foreground/70 disabled:opacity-50"><KeyRound className="w-4 h-4" /></button>
                {s.is_suspended ? (
                  <button onClick={() => toggleSuspend(s)} disabled={actionLoading === s.id} className="w-9 h-9 rounded-lg bg-terai/10 text-terai flex items-center justify-center disabled:opacity-50"><CheckCircle className="w-4 h-4" /></button>
                ) : (
                  <button onClick={() => toggleSuspend(s)} disabled={actionLoading === s.id} className="w-9 h-9 rounded-lg bg-red-50 text-red-500 dark:bg-red-500/10 flex items-center justify-center disabled:opacity-50"><Ban className="w-4 h-4" /></button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && <div className="text-center py-12"><StoreIcon className="w-10 h-10 text-foreground/20 mx-auto mb-2" /><p className="text-sm text-foreground/40">No merchants found.</p></div>}

      {selected && (
        <MerchantDetailModal
          store={selected}
          stats={getStats(selected.id)}
          onClose={() => setSelected(null)}
          onEdit={(s) => { setSelected(null); onEdit(s); }}
          onToggleSuspend={toggleSuspend}
          onDelete={handleDelete}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}