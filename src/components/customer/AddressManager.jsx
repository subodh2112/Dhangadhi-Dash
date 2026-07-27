import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, MapPin, Home, Briefcase, Star, X, Loader2, Navigation, Check } from "lucide-react";

const labelIcons = { home: Home, work: Briefcase, other: MapPin };
const labelOptions = ["home", "work", "other"];

export default function AddressManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ label: "home", full_address: "", delivery_instructions: "", is_default: false, latitude: null, longitude: null });
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.CustomerAddress.filter({ user_id: user.id }, "-is_default");
        setAddresses(data);
      } catch {}
      setLoading(false);
    };
    if (user?.id) load();
  }, [user?.id]);

  const captureLocation = () => {
    setLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setForm((f) => ({ ...f, latitude: pos.coords.latitude, longitude: pos.coords.longitude })); setLocating(false); toast({ title: "Location captured!" }); },
        () => { setLocating(false); toast({ title: "Could not get location", variant: "destructive" }); },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else { setLocating(false); }
  };

  const handleSave = async () => {
    if (!form.full_address.trim()) return;
    setSaving(true);
    try {
      if (form.is_default) {
        for (const a of addresses.filter((a) => a.is_default)) {
          await base44.entities.CustomerAddress.update(a.id, { is_default: false });
        }
      }
      await base44.entities.CustomerAddress.create({ ...form, user_id: user.id });
      const data = await base44.entities.CustomerAddress.filter({ user_id: user.id }, "-is_default");
      setAddresses(data);
      setShowForm(false);
      setForm({ label: "home", full_address: "", delivery_instructions: "", is_default: false, latitude: null, longitude: null });
      toast({ title: "Address saved!" });
    } catch { toast({ title: "Failed to save", variant: "destructive" }); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.CustomerAddress.delete(id);
      setAddresses(addresses.filter((a) => a.id !== id));
      toast({ title: "Address deleted" });
    } catch { toast({ title: "Failed to delete", variant: "destructive" }); }
  };

  const setDefault = async (id) => {
    try {
      for (const a of addresses.filter((a) => a.is_default)) {
        await base44.entities.CustomerAddress.update(a.id, { is_default: false });
      }
      await base44.entities.CustomerAddress.update(id, { is_default: true });
      const data = await base44.entities.CustomerAddress.filter({ user_id: user.id }, "-is_default");
      setAddresses(data);
      toast({ title: "Default address updated!" });
    } catch {}
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-saffron animate-spin" /></div>;

  return (
    <div>
      <div className="space-y-2 mb-3">
        {addresses.length === 0 && !showForm ? (
          <div className="text-center py-8"><MapPin className="w-10 h-10 text-foreground/20 mx-auto mb-2" /><p className="text-sm text-foreground/40">No saved addresses yet.</p></div>
        ) : (
          addresses.map((addr) => {
            const Icon = labelIcons[addr.label] || MapPin;
            return (
              <div key={addr.id} className={"flex items-start gap-3 p-3 rounded-xl border " + (addr.is_default ? "border-saffron/30 bg-saffron/5" : "border-border")}>
                <div className="w-9 h-9 rounded-lg bg-saffron/10 flex items-center justify-center flex-shrink-0"><Icon className="w-4 h-4 text-saffron" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-saffron uppercase">{addr.label}</span>
                    {addr.is_default && <span className="text-[9px] bg-terai/10 text-terai font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5"><Star className="w-2.5 h-2.5" /> DEFAULT</span>}
                  </div>
                  <p className="text-sm text-foreground/70 mt-0.5">{addr.full_address}</p>
                  {addr.delivery_instructions && <p className="text-xs text-foreground/40 mt-1">{addr.delivery_instructions}</p>}
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  {!addr.is_default && <button onClick={() => setDefault(addr.id)} className="text-[10px] text-terai font-bold px-2 py-1 rounded hover:bg-terai/10">Set Default</button>}
                  <button onClick={() => handleDelete(addr.id)} className="text-[10px] text-red-500 font-bold px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showForm ? (
        <div className="p-4 rounded-xl border border-saffron/30 bg-saffron/5 space-y-3">
          <div className="flex gap-2">
            {labelOptions.map((lbl) => {
              const Icon = labelIcons[lbl];
              return (
                <button key={lbl} onClick={() => setForm({ ...form, label: lbl })} className={"flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold capitalize " + (form.label === lbl ? "bg-saffron text-white" : "bg-muted text-foreground/50")}>
                  <Icon className="w-3.5 h-3.5" /> {lbl}
                </button>
              );
            })}
          </div>
          <textarea value={form.full_address} onChange={(e) => setForm({ ...form, full_address: e.target.value })} rows={2} placeholder="Full delivery address" className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40" />
          <input value={form.delivery_instructions} onChange={(e) => setForm({ ...form, delivery_instructions: e.target.value })} placeholder="Delivery instructions (optional)" className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40" />
          <button onClick={captureLocation} disabled={locating} className="w-full py-2 rounded-lg border border-dashed border-border text-xs font-bold text-terai flex items-center justify-center gap-1.5 hover:bg-terai/5 disabled:opacity-50">
            {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : form.latitude ? <><Check className="w-3.5 h-3.5" /> Location captured</> : <><Navigation className="w-3.5 h-3.5" /> Use current location</>}
          </button>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} className="w-4 h-4 rounded accent-saffron" />
            Set as default address
          </label>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg border border-border text-sm font-bold text-foreground/60 hover:bg-muted">Cancel</button>
            <button onClick={handleSave} disabled={!form.full_address.trim() || saving} className="flex-1 py-2 rounded-lg bg-saffron text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-1.5">{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Address"}</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} className="w-full p-3 rounded-xl border border-dashed border-border text-sm text-foreground/40 hover:border-saffron/40 hover:text-saffron flex items-center justify-center gap-1.5">
          <Plus className="w-4 h-4" /> Add New Address
        </button>
      )}
    </div>
  );
}