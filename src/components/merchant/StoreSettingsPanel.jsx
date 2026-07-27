import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Loader2, Store as StoreIcon, Clock, MapPin, Phone, DollarSign, Pause, Plane } from "lucide-react";
import MerchantBusinessInfo from "@/components/merchant/MerchantBusinessInfo";

export default function StoreSettingsPanel({ storeId, onUpdated }) {
  const { toast } = useToast();
  const [store, setStore] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!storeId) { setLoading(false); return; }
    try {
      const s = await base44.entities.Store.get(storeId);
      setStore(s);
      setForm({
        description: s.description || "",
        address: s.address || "",
        phone: s.phone || "",
        opening_time: s.opening_time || "09:00",
        closing_time: s.closing_time || "21:00",
        delivery_fee: s.delivery_fee ?? 40,
        delivery_minutes: s.delivery_minutes ?? 30,
        delivery_radius: s.delivery_radius ?? 5,
        min_order: s.min_order ?? 100,
        is_open: s.is_open ?? true,
        vacation_mode: s.vacation_mode ?? false,
        pause_orders: s.pause_orders ?? false,
        free_delivery: s.free_delivery ?? false,
        latitude: s.latitude || "",
        longitude: s.longitude || "",
        tags: s.tags || "",
      });
    } catch {} finally { setLoading(false); }
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.Store.update(storeId, {
        ...form,
        delivery_fee: Number(form.delivery_fee) || 0,
        delivery_minutes: Number(form.delivery_minutes) || 0,
        delivery_radius: Number(form.delivery_radius) || 0,
        min_order: Number(form.min_order) || 0,
        latitude: form.latitude ? Number(form.latitude) : undefined,
        longitude: form.longitude ? Number(form.longitude) : undefined,
      });
      toast({ title: "Store settings saved" });
      onUpdated?.();
    } catch { toast({ title: "Failed to save settings", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const toggle = (field) => setForm((prev) => ({ ...prev, [field]: !prev[field] }));

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;
  if (!form) return <p className="text-center text-foreground/40 py-20">Store not found.</p>;

  const inputClass = "w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-saffron/40 focus:border-saffron";

  return (
    <div className="space-y-6">
      {store?.store_code && (
        <div className="bg-saffron/5 border border-saffron/20 rounded-2xl p-4 flex items-center gap-3">
          <StoreIcon className="w-5 h-5 text-saffron" />
          <div>
            <p className="text-xs text-foreground/40 uppercase font-bold">Store Code</p>
            <p className="font-mono font-extrabold text-saffron">{store.store_code}</p>
          </div>
        </div>
      )}

      <div className="bg-card rounded-3xl border border-border p-6 space-y-4">
        <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2"><StoreIcon className="w-5 h-5 text-saffron" /> Store Information</h2>
        <div><Label>Description</Label><textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputClass} resize-none`} placeholder="Tell customers about your store..." /></div>
        <div><Label>Address</Label><div className="relative"><MapPin className="absolute left-3 top-3 w-4 h-4 text-foreground/40" /><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={`${inputClass} pl-9`} placeholder="Street, Dhangadhi" /></div></div>
        <div><Label>Phone</Label><div className="relative"><Phone className="absolute left-3 top-3 w-4 h-4 text-foreground/40" /><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={`${inputClass} pl-9`} placeholder="98XXXXXXXX" /></div></div>
      </div>

      <MerchantBusinessInfo storeId={storeId} />

      <div className="bg-card rounded-3xl border border-border p-6 space-y-4">
        <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2"><Clock className="w-5 h-5 text-saffron" /> Hours & Delivery</h2>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Opening Time</Label><Input type="time" value={form.opening_time} onChange={(e) => setForm({ ...form, opening_time: e.target.value })} /></div>
          <div><Label>Closing Time</Label><Input type="time" value={form.closing_time} onChange={(e) => setForm({ ...form, closing_time: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div><Label>Delivery Fee (Rs)</Label><Input type="number" value={form.delivery_fee} onChange={(e) => setForm({ ...form, delivery_fee: e.target.value })} /></div>
          <div><Label>Delivery (min)</Label><Input type="number" value={form.delivery_minutes} onChange={(e) => setForm({ ...form, delivery_minutes: e.target.value })} /></div>
          <div><Label>Radius (km)</Label><Input type="number" value={form.delivery_radius} onChange={(e) => setForm({ ...form, delivery_radius: e.target.value })} /></div>
          <div><Label>Min Order (Rs)</Label><Input type="number" value={form.min_order} onChange={(e) => setForm({ ...form, min_order: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Latitude</Label><Input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="28.7041" /></div>
          <div><Label>Longitude</Label><Input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="80.5998" /></div>
        </div>
        <div><Label>Tags (comma-separated)</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="pure veg, family, breakfast" /></div>
      </div>

      <div className="bg-card rounded-3xl border border-border p-6 space-y-3">
        <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2"><DollarSign className="w-5 h-5 text-saffron" /> Store Status</h2>
        {[
          { field: "is_open", label: "Store Open", desc: "Accept new orders", icon: StoreIcon },
          { field: "vacation_mode", label: "Vacation Mode", desc: "Temporarily hide your store from customers", icon: Plane },
          { field: "pause_orders", label: "Pause Orders", desc: "Stop accepting new orders temporarily", icon: Pause },
          { field: "free_delivery", label: "Free Delivery", desc: "Offer free delivery to customers", icon: DollarSign },
        ].map((toggleItem) => {
          const Icon = toggleItem.icon;
          return (
            <div key={toggleItem.field} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-foreground/40" />
                <div><p className="text-sm font-bold text-foreground">{toggleItem.label}</p><p className="text-xs text-foreground/40">{toggleItem.desc}</p></div>
              </div>
              <button onClick={() => toggle(toggleItem.field)} className={`relative w-12 h-6 rounded-full transition-colors ${form[toggleItem.field] ? "bg-saffron" : "bg-foreground/20"}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${form[toggleItem.field] ? "translate-x-6" : "translate-x-0.5"}`} />
              </button>
            </div>
          );
        })}
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full h-12 text-base">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Settings
      </Button>
    </div>
  );
}