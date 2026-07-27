import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Megaphone, CheckCircle, XCircle, MousePointerClick, Eye, DollarSign } from "lucide-react";

const statusColors = {
  pending: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400",
  active: "bg-terai/10 text-terai",
  expired: "bg-muted text-foreground/40",
  cancelled: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
};

const adTypeLabels = { sponsored_store: "Sponsored Store", featured_product: "Featured Product", top_search: "Top Search" };

export default function AdvertisementManager() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    try { setAds(await base44.entities.Advertisement.filter({}, "-created_date", 100)); } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => { await base44.entities.Advertisement.update(id, { status }); load(); };

  const filtered = filter === "all" ? ads : ads.filter(a => a.status === filter);
  const totalImpressions = ads.reduce((s, a) => s + (a.impressions || 0), 0);
  const totalClicks = ads.reduce((s, a) => s + (a.clicks || 0), 0);
  const totalRevenue = ads.reduce((s, a) => s + (a.cost || 0), 0);
  const pending = ads.filter(a => a.status === "pending").length;

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{ label: "Impressions", value: totalImpressions.toLocaleString(), icon: Eye, color: "bg-blue-50 text-blue-500 dark:bg-blue-500/10" }, { label: "Total Clicks", value: totalClicks.toLocaleString(), icon: MousePointerClick, color: "bg-purple-50 text-purple-500 dark:bg-purple-500/10" }, { label: "Ad Revenue", value: "Rs " + totalRevenue.toLocaleString(), icon: DollarSign, color: "bg-terai/10 text-terai" }, { label: "Pending Approval", value: pending, icon: Megaphone, color: "bg-amber-50 text-amber-500 dark:bg-amber-500/10" }].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
            <div className={"w-9 h-9 rounded-lg flex items-center justify-center mb-2 " + s.color}><s.icon className="w-4 h-4" /></div>
            <p className="text-xl font-display font-extrabold text-foreground">{s.value}</p>
            <p className="text-xs text-foreground/40">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "active", "expired", "cancelled"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${filter === f ? "bg-saffron text-white" : "bg-muted text-foreground/50"}`}>{f}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12"><Megaphone className="w-12 h-12 text-foreground/20 mx-auto mb-2" /><p className="text-sm text-foreground/40">No advertisements found.</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(ad => {
            const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : "0.0";
            return (
              <div key={ad.id} className="bg-card rounded-2xl border border-border p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-foreground">{ad.store_name || "Unknown Store"}</h3>
                      <span className={"text-[9px] font-bold px-2 py-0.5 rounded-full capitalize " + (statusColors[ad.status] || "bg-muted")}>{ad.status}</span>
                    </div>
                    <p className="text-xs text-foreground/40">{adTypeLabels[ad.campaign_type] || ad.campaign_type}{ad.product_name ? ` • ${ad.product_name}` : ""}</p>
                  </div>
                  <p className="text-sm font-bold text-saffron">Rs {ad.cost?.toLocaleString()}</p>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  <div className="text-center p-2 rounded-lg bg-muted/50"><p className="text-sm font-bold">{ad.impressions || 0}</p><p className="text-[10px] text-foreground/40">Impressions</p></div>
                  <div className="text-center p-2 rounded-lg bg-muted/50"><p className="text-sm font-bold">{ad.clicks || 0}</p><p className="text-[10px] text-foreground/40">Clicks</p></div>
                  <div className="text-center p-2 rounded-lg bg-muted/50"><p className="text-sm font-bold">{ctr}%</p><p className="text-[10px] text-foreground/40">CTR</p></div>
                  <div className="text-center p-2 rounded-lg bg-muted/50"><p className="text-sm font-bold">{ad.duration_days || 0}d</p><p className="text-[10px] text-foreground/40">Duration</p></div>
                </div>
                {ad.status === "pending" && (
                  <div className="flex gap-2">
                    <button onClick={() => updateStatus(ad.id, "active")} className="flex-1 h-8 rounded-lg bg-terai text-white text-xs font-bold flex items-center justify-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Approve</button>
                    <button onClick={() => updateStatus(ad.id, "cancelled")} className="flex-1 h-8 rounded-lg bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-1"><XCircle className="w-3.5 h-3.5" /> Reject</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}