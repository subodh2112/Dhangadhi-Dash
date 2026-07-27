import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Settings as SettingsIcon, Save, Loader2 } from "lucide-react";

const defaultSettings = [
  { key: "tax_rate", label: "Tax Rate (%)", value: "13", category: "pricing" },
  { key: "default_delivery_fee", label: "Default Delivery Fee (Rs)", value: "40", category: "pricing" },
  { key: "free_delivery_threshold", label: "Free Delivery Threshold (Rs)", value: "500", category: "pricing" },
  { key: "min_order_amount", label: "Minimum Order Amount (Rs)", value: "100", category: "pricing" },
  { key: "referral_bonus_points", label: "Referral Bonus Points", value: "50", category: "rewards" },
  { key: "points_per_rupee", label: "Points per Rs Spent", value: "0.1", category: "rewards" },
];

export default function AdminSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await base44.entities.Setting.list("-created_date", 100).catch(() => []);
        const merged = defaultSettings.map((d) => {
          const found = stored.find((s) => s.key === d.key);
          return found ? { ...d, value: found.value, id: found.id } : d;
        });
        setSettings(merged);
      } catch {} finally { setLoading(false); }
    };
    load();
  }, []);

  const handleSave = async (setting) => {
    setSavingKey(setting.key);
    try {
      if (setting.id) {
        await base44.entities.Setting.update(setting.id, { value: setting.value });
      } else {
        const created = await base44.entities.Setting.create({ key: setting.key, value: setting.value, label: setting.label, category: setting.category });
        setSettings((prev) => prev.map((s) => s.key === setting.key ? { ...s, id: created.id } : s));
      }
      toast({ title: "Setting saved" });
    } catch { toast({ title: "Failed to save", variant: "destructive" }); }
    finally { setSavingKey(null); }
  };

  if (loading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>;

  const categories = [...new Set(settings.map((s) => s.category))];

  return (
    <div className="bg-card rounded-3xl border border-border p-6">
      <h2 className="font-display font-bold text-lg text-foreground mb-2 flex items-center gap-2"><SettingsIcon className="w-5 h-5 text-saffron" /> Platform Settings</h2>
      <p className="text-sm text-foreground/50 mb-6">Configure pricing, fees, and reward rates across the platform.</p>
      {categories.map((cat) => (
        <div key={cat} className="mb-6 last:mb-0">
          <h3 className="text-xs font-bold text-foreground/40 uppercase tracking-wide mb-3 capitalize">{cat}</h3>
          <div className="space-y-3">
            {settings.filter((s) => s.category === cat).map((setting) => (
              <div key={setting.key} className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-sm font-medium text-foreground">{setting.label}</label>
                </div>
                <input
                  type="text"
                  value={setting.value}
                  onChange={(e) => setSettings((prev) => prev.map((s) => s.key === setting.key ? { ...s, value: e.target.value } : s))}
                  className="w-32 h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-saffron/40"
                />
                <button
                  onClick={() => handleSave(setting)}
                  disabled={savingKey === setting.key}
                  className="h-10 px-4 rounded-xl bg-saffron text-white font-bold text-sm hover:bg-saffron/90 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingKey === setting.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}