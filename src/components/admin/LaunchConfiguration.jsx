import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Rocket, Save, Loader2, Plus, Trash2, Store, Percent, MapPin, Tag, Users } from "lucide-react";

const launchDefaults = [
  { key: "delivery_zones", label: "Delivery Zones (comma-separated areas)", value: "Dhangadhi Core, Ataria, Campus Road, Hasantola, Bhotipur, Khalanga, Shanti Chowk", category: "launch" },
  { key: "commission_rate_food", label: "Commission Rate - Food (%)", value: "15", category: "launch" },
  { key: "commission_rate_grocery", label: "Commission Rate - Grocery (%)", value: "12", category: "launch" },
  { key: "commission_rate_general", label: "Commission Rate - General (%)", value: "10", category: "launch" },
  { key: "default_delivery_radius_km", label: "Delivery Radius (km)", value: "5", category: "launch" },
  { key: "max_delivery_distance_km", label: "Max Delivery Distance (km)", value: "10", category: "launch" },
  { key: "rider_base_payout", label: "Rider Base Payout per Delivery (Rs)", value: "35", category: "launch" },
  { key: "rider_per_km_rate", label: "Rider Per-KM Rate (Rs)", value: "8", category: "launch" },
  { key: "app_version", label: "Current App Version", value: "1.0.0", category: "launch" },
  { key: "launch_date", label: "Launch Date", value: "2026-07-20", category: "launch" },
  { key: "support_phone", label: "Support Phone Number", value: "+977-9800000000", category: "launch" },
  { key: "support_email", label: "Support Email", value: "support@dhangadhidash.com", category: "launch" },
];

export default function LaunchConfiguration() {
  const { toast } = useToast();
  const [settings, setSettings] = useState(launchDefaults);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [featuredStores, setFeaturedStores] = useState([]);
  const [allStores, setAllStores] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [stored, stores] = await Promise.all([
        base44.entities.Setting.filter({ category: "launch" }, "-created_date", 50).catch(() => []),
        base44.entities.Store.filter({}, "-rating", 50).catch(() => []),
      ]);
      const merged = launchDefaults.map(d => {
        const found = stored.find(s => s.key === d.key);
        return found ? { ...d, value: found.value, id: found.id } : d;
      });
      setSettings(merged);
      setAllStores(stores);
      setFeaturedStores(stores.filter(s => s.is_featured));
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (setting) => {
    setSavingKey(setting.key);
    try {
      if (setting.id) {
        await base44.entities.Setting.update(setting.id, { value: setting.value });
      } else {
        const created = await base44.entities.Setting.create({ key: setting.key, value: setting.value, label: setting.label, category: setting.category });
        setSettings(prev => prev.map(s => s.key === setting.key ? { ...s, id: created.id } : s));
      }
      toast({ title: "Setting saved" });
    } catch { toast({ title: "Failed to save", variant: "destructive" }); }
    finally { setSavingKey(null); }
  };

  const toggleFeatured = async (store) => {
    try {
      await base44.entities.Store.update(store.id, { is_featured: !store.is_featured });
      toast({ title: store.is_featured ? "Removed from featured" : "Added to featured" });
      load();
    } catch { toast({ title: "Failed to update", variant: "destructive" }); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  const categories = [...new Set(settings.map(s => s.category))];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2"><Rocket className="w-6 h-6 text-saffron" /><div><h2 className="font-display font-bold text-lg text-foreground">Launch Configuration</h2><p className="text-xs text-foreground/50">Configure delivery zones, commissions, and launch parameters</p></div></div>

      <div className="bg-gradient-to-br from-saffron/10 to-terai/5 rounded-2xl border border-saffron/20 p-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-saffron flex items-center justify-center"><Rocket className="w-6 h-6 text-white" /></div>
          <div>
            <p className="font-display font-bold text-sm text-foreground">Production Launch Ready</p>
            <p className="text-xs text-foreground/50">Version {settings.find(s => s.key === "app_version")?.value || "1.0.0"} • Launch: {settings.find(s => s.key === "launch_date")?.value || "TBD"}</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-display font-bold text-sm text-foreground mb-4 flex items-center gap-2"><MapPin className="w-4 h-4 text-saffron" /> Delivery & Commission Settings</h3>
        <div className="space-y-3">
          {settings.filter(s => s.key.includes("delivery") || s.key.includes("commission") || s.key.includes("rider")).map(setting => (
            <div key={setting.key} className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex-1"><label className="text-sm font-medium text-foreground">{setting.label}</label></div>
              <div className="flex gap-2">
                <input type="text" value={setting.value} onChange={e => setSettings(prev => prev.map(s => s.key === setting.key ? { ...s, value: e.target.value } : s))} className="flex-1 sm:w-48 h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-saffron/40" />
                <button onClick={() => handleSave(setting)} disabled={savingKey === setting.key} className="h-10 px-4 rounded-xl bg-saffron text-white font-bold text-sm hover:bg-saffron/90 disabled:opacity-50 flex items-center gap-1.5">
                  {savingKey === setting.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-display font-bold text-sm text-foreground mb-4 flex items-center gap-2"><Tag className="w-4 h-4 text-saffron" /> App & Contact Info</h3>
        <div className="space-y-3">
          {settings.filter(s => ["app_version", "launch_date", "support_phone", "support_email"].includes(s.key)).map(setting => (
            <div key={setting.key} className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex-1"><label className="text-sm font-medium text-foreground">{setting.label}</label></div>
              <div className="flex gap-2">
                <input type="text" value={setting.value} onChange={e => setSettings(prev => prev.map(s => s.key === setting.key ? { ...s, value: e.target.value } : s))} className="flex-1 sm:w-48 h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-saffron/40" />
                <button onClick={() => handleSave(setting)} disabled={savingKey === setting.key} className="h-10 px-4 rounded-xl bg-saffron text-white font-bold text-sm hover:bg-saffron/90 disabled:opacity-50 flex items-center gap-1.5">
                  {savingKey === setting.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-display font-bold text-sm text-foreground mb-4 flex items-center gap-2"><Store className="w-4 h-4 text-saffron" /> Featured Stores for Launch</h3>
        {featuredStores.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {featuredStores.map(s => (
              <span key={s.id} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-saffron/10 text-saffron text-xs font-bold">{s.name}<button onClick={() => toggleFeatured(s)} className="ml-1 hover:text-red-500"><Trash2 className="w-3 h-3" /></button></span>
            ))}
          </div>
        )}
        <p className="text-xs text-foreground/40 mb-3">Tap to feature/unfeature stores for launch visibility:</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto">
          {allStores.map(s => (
            <button key={s.id} onClick={() => toggleFeatured(s)} className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${s.is_featured ? "border-saffron bg-saffron/5 text-saffron" : "border-border bg-muted/50 text-foreground/60 hover:border-saffron/40"}`}>
              {s.is_featured ? <Plus className="w-3 h-3 rotate-45" /> : <Plus className="w-3 h-3" />}
              <span className="truncate">{s.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}