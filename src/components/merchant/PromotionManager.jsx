import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Tag, Power, Trash2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const promoTypes = [
  { id: "percentage", label: "Percentage Off" },
  { id: "fixed", label: "Fixed Amount Off" },
  { id: "bogo", label: "Buy One Get One" },
  { id: "free_delivery", label: "Free Delivery" },
  { id: "featured", label: "Featured Store" },
  { id: "sponsored", label: "Sponsored Listing" },
];

export default function PromotionManager({ storeId, storeName, merchantId }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", promo_type: "percentage", discount_value: "", code: "", description: "", start_date: "", end_date: "", min_order_amount: "" });

  const load = useCallback(async () => {
    if (!merchantId) { setLoading(false); return; }
    try {
      const data = await base44.entities.Promotion.filter({ merchant_id: merchantId }, "-created_date");
      setPromos(data);
    } catch {}
    setLoading(false);
  }, [merchantId]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.discount_value) { toast({ title: "Fill required fields", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const code = form.code || ("PROMO" + Math.floor(1000 + Math.random() * 9000));
      await base44.entities.Promotion.create({
        merchant_id: merchantId,
        store_id: storeId || "",
        store_name: storeName || "",
        title: form.title,
        promo_type: form.promo_type,
        discount_value: Number(form.discount_value) || 0,
        code,
        description: form.description,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
        min_order_amount: Number(form.min_order_amount) || 0,
        is_active: true,
        approval_status: "pending",
      });
      toast({ title: "Promotion created! Awaiting admin approval." });
      setShowForm(false);
      setForm({ title: "", promo_type: "percentage", discount_value: "", code: "", description: "", start_date: "", end_date: "", min_order_amount: "" });
      load();
    } catch { toast({ title: "Failed to create", variant: "destructive" }); }
    setSaving(false);
  };

  const toggleActive = async (id, current) => {
    try { await base44.entities.Promotion.update(id, { is_active: !current }); load(); } catch {}
  };

  const handleDelete = async (id) => {
    try { await base44.entities.Promotion.delete(id); setPromos(promos.filter(p => p.id !== id)); } catch {}
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  const inputClass = "w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-lg text-foreground">Promotions & Offers</h3>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-saffron text-white text-sm font-bold"><Plus className="w-4 h-4" /> New Promotion</button>
      </div>

      {promos.length === 0 ? (
        <div className="text-center py-12"><Tag className="w-10 h-10 text-foreground/20 mx-auto mb-2" /><p className="text-sm text-foreground/40">No promotions yet. Create one to attract more customers!</p></div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {promos.map((p) => (
            <div key={p.id} className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-sm text-foreground">{p.title}</p>
                  <p className="text-xs text-saffron font-mono font-bold">{p.code}</p>
                </div>
                <span className={"text-[9px] font-bold px-2 py-0.5 rounded-full " + (p.approval_status === "approved" ? "bg-terai/10 text-terai" : p.approval_status === "rejected" ? "bg-red-50 text-red-500 dark:bg-red-500/10" : "bg-amber-50 text-amber-500 dark:bg-amber-500/10")}>{p.approval_status}</span>
              </div>
              <p className="text-xs text-foreground/50 mb-2 capitalize">{p.promo_type?.replace(/_/g, " ")} · {p.discount_value}{p.promo_type === "percentage" ? "%" : " Rs"}</p>
              {p.description && <p className="text-xs text-foreground/40 mb-2">{p.description}</p>}
              <div className="flex items-center gap-2 mt-2">
                <button onClick={() => toggleActive(p.id, p.is_active)} className={"flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold " + (p.is_active ? "bg-terai/10 text-terai" : "bg-muted text-foreground/40")}><Power className="w-3 h-3" /> {p.is_active ? "Active" : "Inactive"}</button>
                <button onClick={() => handleDelete(p.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Plus className="w-5 h-5 text-saffron" /> New Promotion</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-xs font-bold text-foreground/60 mb-1 block">Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="Summer Sale 20% Off" /></div>
            <div><label className="text-xs font-bold text-foreground/60 mb-1 block">Type</label>
              <div className="grid grid-cols-2 gap-2">
                {promoTypes.map((t) => <button key={t.id} onClick={() => setForm({ ...form, promo_type: t.id })} className={"py-2 rounded-lg text-xs font-bold " + (form.promo_type === t.id ? "bg-saffron text-white" : "bg-muted text-foreground/50")}>{t.label}</button>)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-bold text-foreground/60 mb-1 block">Value ({form.promo_type === "percentage" ? "%" : "Rs"})</label><input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} className={inputClass} placeholder="20" /></div>
              <div><label className="text-xs font-bold text-foreground/60 mb-1 block">Code (optional)</label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className={inputClass} placeholder="Auto-generated" /></div>
            </div>
            <div><label className="text-xs font-bold text-foreground/60 mb-1 block">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={inputClass + " resize-none"} placeholder="Get 20% off on all items" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-bold text-foreground/60 mb-1 block">Start Date</label><input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className={inputClass} /></div>
              <div><label className="text-xs font-bold text-foreground/60 mb-1 block">End Date</label><input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className={inputClass} /></div>
            </div>
            <div><label className="text-xs font-bold text-foreground/60 mb-1 block">Min Order Amount (Rs, optional)</label><input type="number" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })} className={inputClass} placeholder="0" /></div>
            <button onClick={handleCreate} disabled={saving} className="w-full h-11 rounded-xl bg-saffron text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Promotion"}</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}