import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Save, Percent, Bike, Calculator, DollarSign } from "lucide-react";
import { logAdminAction } from "@/lib/adminLog";

export default function CommissionManager() {
  const { toast } = useToast();
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ merchant_commission_rate: "10", rider_base_fare: "30", rider_per_km_charge: "10", rider_peak_multiplier: "1.5" });
  const [calc, setCalc] = useState({ orderAmount: "500", distance: "3", isPeak: false });

  const load = useCallback(async () => {
    try {
      const data = await base44.entities.Setting.filter({ category: "commission" }).catch(() => []);
      setSettings(data);
      const formCopy = { ...form };
      data.forEach(s => { if (s.key in formCopy) formCopy[s.key] = s.value; });
      setForm(formCopy);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(form)) {
        const existing = settings.find(s => s.key === key);
        if (existing) {
          await base44.entities.Setting.update(existing.id, { value });
        } else {
          await base44.entities.Setting.create({ key, value, label: key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()), category: "commission" });
        }
      }
      await logAdminAction("Updated commission settings", "Settings", "Commission", JSON.stringify(form));
      toast({ title: "Commission settings saved!" });
    } catch { toast({ title: "Failed to save", variant: "destructive" }); }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  const inputClass = "w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40";

  const orderAmount = Number(calc.orderAmount) || 0;
  const distance = Number(calc.distance) || 0;
  const commissionRate = Number(form.merchant_commission_rate) / 100;
  const baseFare = Number(form.rider_base_fare);
  const perKm = Number(form.rider_per_km_charge);
  const peakMult = Number(form.rider_peak_multiplier);
  const platformCommission = Math.round(orderAmount * commissionRate);
  const merchantEarning = orderAmount - platformCommission;
  const riderEarning = Math.round((baseFare + distance * perKm) * (calc.isPeak ? peakMult : 1));
  const customerPays = orderAmount + riderEarning;

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-3xl border border-border p-6">
        <h3 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2"><Percent className="w-5 h-5 text-saffron" /> Merchant Commission</h3>
        <div>
          <label className="text-xs font-bold text-foreground/60 mb-1 block">Commission Rate (%)</label>
          <input type="number" value={form.merchant_commission_rate} onChange={(e) => setForm({ ...form, merchant_commission_rate: e.target.value })} className={inputClass} />
          <p className="text-xs text-foreground/40 mt-1">Platform takes {form.merchant_commission_rate}% from each order total.</p>
        </div>
      </div>

      <div className="bg-card rounded-3xl border border-border p-6">
        <h3 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2"><Bike className="w-5 h-5 text-saffron" /> Rider Delivery Fees</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <div><label className="text-xs font-bold text-foreground/60 mb-1 block">Base Fare (Rs)</label><input type="number" value={form.rider_base_fare} onChange={(e) => setForm({ ...form, rider_base_fare: e.target.value })} className={inputClass} /></div>
          <div><label className="text-xs font-bold text-foreground/60 mb-1 block">Per KM Charge (Rs)</label><input type="number" value={form.rider_per_km_charge} onChange={(e) => setForm({ ...form, rider_per_km_charge: e.target.value })} className={inputClass} /></div>
          <div><label className="text-xs font-bold text-foreground/60 mb-1 block">Peak Multiplier</label><input type="number" step="0.1" value={form.rider_peak_multiplier} onChange={(e) => setForm({ ...form, rider_peak_multiplier: e.target.value })} className={inputClass} /></div>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="w-full h-12 rounded-xl bg-saffron text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Settings</>}</button>

      <div className="bg-card rounded-3xl border border-border p-6">
        <h3 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2"><Calculator className="w-5 h-5 text-saffron" /> Commission Calculator</h3>
        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          <div><label className="text-xs font-bold text-foreground/60 mb-1 block">Order Amount (Rs)</label><input type="number" value={calc.orderAmount} onChange={(e) => setCalc({ ...calc, orderAmount: e.target.value })} className={inputClass} /></div>
          <div><label className="text-xs font-bold text-foreground/60 mb-1 block">Distance (km)</label><input type="number" value={calc.distance} onChange={(e) => setCalc({ ...calc, distance: e.target.value })} className={inputClass} /></div>
          <div className="flex items-end">
            <button onClick={() => setCalc({ ...calc, isPeak: !calc.isPeak })} className={"w-full h-10 rounded-xl text-sm font-bold " + (calc.isPeak ? "bg-saffron text-white" : "bg-muted text-foreground/50")}>{calc.isPeak ? "Peak Hours ON" : "Peak Hours OFF"}</button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Customer Pays", value: "Rs " + customerPays.toLocaleString(), color: "text-saffron", icon: DollarSign },
            { label: "Merchant Earns", value: "Rs " + merchantEarning.toLocaleString(), color: "text-terai", icon: DollarSign },
            { label: "Rider Earns", value: "Rs " + riderEarning.toLocaleString(), color: "text-blue-500", icon: Bike },
            { label: "Platform Commission", value: "Rs " + platformCommission.toLocaleString(), color: "text-purple-500", icon: Percent },
          ].map(item => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="p-4 rounded-xl bg-muted/50">
                <div className={"flex items-center gap-1 mb-1 " + item.color}><Icon className="w-3 h-3" /><p className="text-[10px] font-bold uppercase">{item.label}</p></div>
                <p className="text-xl font-display font-extrabold text-foreground">{item.value}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}