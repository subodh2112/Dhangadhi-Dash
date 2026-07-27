import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Rocket, Star, Search, Eye, MousePointerClick, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

const adTypes = [
  { type: "sponsored_store", label: "Sponsored Store", desc: "Higher visibility on homepage & search", price: 500, icon: Rocket },
  { type: "featured_product", label: "Featured Product", desc: "Promote specific products in listings", price: 300, icon: Star },
  { type: "top_search", label: "Top Search Placement", desc: "Priority listing in search results", price: 200, icon: Search },
];

const statusColors = {
  pending: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400",
  active: "bg-terai/10 text-terai",
  expired: "bg-muted text-foreground/40",
  cancelled: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
};

export default function MerchantAdManager({ merchantId, storeId, storeName }) {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState(null);

  const load = useCallback(async () => {
    if (!storeId) { setLoading(false); return; }
    try { setAds(await base44.entities.Advertisement.filter({ store_id: storeId }, "-created_date", 50)); } catch {}
    setLoading(false);
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  const purchaseAd = async (type, cost) => {
    const startDate = new Date().toISOString().split("T")[0];
    const endDate = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
    await base44.entities.Advertisement.create({
      merchant_id: merchantId,
      store_id: storeId,
      store_name: storeName,
      campaign_type: type,
      duration_days: 30,
      cost,
      status: "pending",
      start_date: startDate,
      end_date: endDate,
      impressions: 0,
      clicks: 0,
      priority: 0,
    });
    setSelectedType(null);
    load();
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-saffron animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display font-bold text-sm text-foreground mb-1">Boost Your Visibility</h3>
        <p className="text-xs text-foreground/50">Purchase advertising to reach more customers.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {adTypes.map(ad => (
          <button key={ad.type} onClick={() => setSelectedType(ad)} className="bg-card rounded-2xl border border-border p-4 text-left hover:border-saffron transition-all">
            <div className="w-9 h-9 rounded-lg bg-saffron/10 flex items-center justify-center mb-2"><ad.icon className="w-4 h-4 text-saffron" /></div>
            <p className="font-bold text-sm text-foreground">{ad.label}</p>
            <p className="text-[10px] text-foreground/40 mb-2">{ad.desc}</p>
            <p className="text-lg font-display font-extrabold text-saffron">Rs {ad.price}<span className="text-[10px] text-foreground/40 font-normal">/month</span></p>
          </button>
        ))}
      </div>

      {selectedType && (
        <div className="bg-card rounded-2xl border border-saffron p-5">
          <div className="flex items-center justify-between mb-3">
            <div><p className="font-bold text-sm text-foreground">{selectedType.label}</p><p className="text-xs text-foreground/50">30-day campaign • Rs {selectedType.price}</p></div>
            <Button onClick={() => purchaseAd(selectedType.type, selectedType.price)} className="bg-saffron hover:bg-saffron/90 h-9">Confirm Purchase</Button>
          </div>
        </div>
      )}

      {ads.length > 0 && (
        <div>
          <h3 className="font-display font-bold text-sm text-foreground mb-2">Your Advertisements</h3>
          <div className="space-y-2">
            {ads.map(ad => {
              const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : "0.0";
              return (
                <div key={ad.id} className="bg-card rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-xs text-foreground capitalize">{ad.campaign_type?.replace(/_/g, " ")}</p>
                    <span className={"text-[9px] font-bold px-2 py-0.5 rounded-full capitalize " + (statusColors[ad.status] || "bg-muted")}>{ad.status}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-1.5 rounded-lg bg-muted/50"><p className="text-xs font-bold">{ad.impressions || 0}</p><p className="text-[9px] text-foreground/40">Impressions</p></div>
                    <div className="text-center p-1.5 rounded-lg bg-muted/50"><p className="text-xs font-bold">{ad.clicks || 0}</p><p className="text-[9px] text-foreground/40">Clicks</p></div>
                    <div className="text-center p-1.5 rounded-lg bg-muted/50"><p className="text-xs font-bold">{ctr}%</p><p className="text-[9px] text-foreground/40">CTR</p></div>
                  </div>
                  <p className="text-[10px] text-foreground/40 mt-1">{ad.start_date} → {ad.end_date}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}