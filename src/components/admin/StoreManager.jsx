import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Store, Star, Clock, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import FileUploadField from "@/components/FileUploadField";
import { INDUSTRY_CATEGORIES } from "@/lib/categories";

const categories = INDUSTRY_CATEGORIES.map(c => ({ value: c.slug, label: c.emoji + " " + c.name }));

const emptyForm = {
  name: "", category: "restaurant", description: "", address: "", phone: "",
  delivery_fee: 40, delivery_minutes: 30, min_order: 100, image_url: "",
  logo_url: "", owner_email: "", owner_password: "",
  is_featured: false, free_delivery: false,
};

export default function StoreManager() {
  const { toast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchStores = () => {
    setLoading(true);
    base44.entities.Store.list("-created_date", 30)
      .then(setStores)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(fetchStores, []);

  const generateMerchantCode = async () => {
    const existingApps = await base44.entities.MerchantApplication.filter({ applicant_type: "merchant" }, "-created_date", 200).catch(() => []);
    const existingStores = await base44.entities.Store.list("-created_date", 200).catch(() => []);
    let maxNum = 0;
    for (const a of existingApps) {
      const match = (a.merchant_code || "").match(/DDM0*(\d+)/);
      if (match) { const num = parseInt(match[1]); if (num > maxNum) maxNum = num; }
    }
    for (const s of existingStores) {
      const match = (s.merchant_code || "").match(/DDM0*(\d+)/);
      if (match) { const num = parseInt(match[1]); if (num > maxNum) maxNum = num; }
    }
    return `DDM${String(maxNum + 1).padStart(6, "0")}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Store name is required"); return; }
    if (!form.owner_email.trim()) { setError("Merchant email is required"); return; }
    if (!form.owner_password.trim()) { setError("Temporary password is required"); return; }
    setSubmitting(true);
    setError("");
    try {
      const logo = form.logo_url || form.image_url;
      const merchantCode = await generateMerchantCode();

      const newStore = await base44.entities.Store.create({
        name: form.name, category: form.category, description: form.description,
        address: form.address, phone: form.phone,
        delivery_fee: Number(form.delivery_fee), delivery_minutes: Number(form.delivery_minutes),
        min_order: Number(form.min_order),
        image_url: logo, logo_url: logo, cover_url: logo,
        merchant_code: merchantCode,
        rating: 4.5, reviews_count: 0, is_open: true, is_verified: true,
        is_featured: form.is_featured, free_delivery: form.free_delivery,
      });

      // Create / link merchant account
      const users = await base44.entities.User.filter({ email: form.owner_email }).catch(() => []);
      let merchantUserId = users.length > 0 ? users[0].id : "";
      if (users.length > 0) {
        await base44.entities.User.update(users[0].id, { role: "merchant", store_id: newStore.id }).catch(() => {});
      } else {
        try { await base44.users.inviteUser(form.owner_email, "merchant"); }
        catch {
          await base44.users.inviteUser(form.owner_email, "user");
          const invited = await base44.entities.User.filter({ email: form.owner_email }).catch(() => []);
          if (invited.length > 0) {
            merchantUserId = invited[0].id;
            await base44.entities.User.update(invited[0].id, { role: "merchant", store_id: newStore.id }).catch(() => {});
          }
        }
        const linked = await base44.entities.User.filter({ email: form.owner_email }).catch(() => []);
        if (linked.length > 0) {
          merchantUserId = linked[0].id;
          if (!linked[0].store_id) await base44.entities.User.update(linked[0].id, { store_id: newStore.id }).catch(() => {});
        }
      }
      if (merchantUserId) {
        await base44.entities.Store.update(newStore.id, { merchant_id: merchantUserId }).catch(() => {});
      }

      // Send credentials email
      await base44.integrations.Core.SendEmail({
        to: form.owner_email,
        subject: `Welcome to Dhangadhi Dash - Your Merchant Account`,
        body: `Hello,\n\nYour store "${form.name}" has been created on Dhangadhi Dash.\n\nLogin Email: ${form.owner_email}\nTemporary Password: ${form.owner_password}\nMerchant Code: ${merchantCode}\n\nPlease log in and change your password immediately.\n\nThank you for joining Dhangadhi Dash!`,
      }).catch(() => {});

      toast({ title: "Store & merchant account created!", description: `Code: ${merchantCode}` });
      setForm(emptyForm);
      fetchStores();
    } catch (err) {
      setError(err.message || "Failed to create store. Admin access required.");
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this store?")) return;
    try { await base44.entities.Store.delete(id); fetchStores(); } catch {}
  };

  const inputClass = "w-full h-11 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-saffron/40 focus:border-saffron";
  const labelClass = "text-xs font-bold text-foreground/60 uppercase tracking-wide mb-1.5 block";

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-card rounded-3xl border border-border p-6">
        <h2 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-saffron" /> Add New Store
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Store Name *</label>
            <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Himalayan Kitchen" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Category</label>
              <select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="98XXXXXXXX" />
            </div>
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <textarea rows={2} className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description..." />
          </div>
          <div>
            <label className={labelClass}>Address</label>
            <input className={inputClass} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, Dhangadhi" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Delivery Fee</label>
              <input type="number" className={inputClass} value={form.delivery_fee} onChange={(e) => setForm({ ...form, delivery_fee: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Delivery (min)</label>
              <input type="number" className={inputClass} value={form.delivery_minutes} onChange={(e) => setForm({ ...form, delivery_minutes: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Min Order</label>
              <input type="number" className={inputClass} value={form.min_order} onChange={(e) => setForm({ ...form, min_order: e.target.value })} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Store Logo</label>
            <FileUploadField label="Store Logo" value={form.logo_url} onChange={(v) => setForm({ ...form, logo_url: v, image_url: v })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Merchant Email *</label>
              <input type="email" className={inputClass} value={form.owner_email} onChange={(e) => setForm({ ...form, owner_email: e.target.value })} placeholder="merchant@email.com" />
            </div>
            <div>
              <label className={labelClass}>Temporary Password *</label>
              <input type="text" className={inputClass} value={form.owner_password} onChange={(e) => setForm({ ...form, owner_password: e.target.value })} placeholder="Set temp password" />
            </div>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-foreground/60 cursor-pointer">
              <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="w-4 h-4 accent-saffron" /> Featured
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground/60 cursor-pointer">
              <input type="checkbox" checked={form.free_delivery} onChange={(e) => setForm({ ...form, free_delivery: e.target.checked })} className="w-4 h-4 accent-saffron" /> Free Delivery
            </label>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={submitting} className="w-full h-11 rounded-xl bg-saffron text-white font-bold hover:bg-saffron/90 disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus className="w-4 h-4" /> Create Store</>}
          </button>
        </form>
      </div>

      <div className="bg-card rounded-3xl border border-border p-6">
        <h2 className="font-display font-bold text-lg text-foreground mb-4">Recent Stores ({stores.length})</h2>
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>
        ) : stores.length === 0 ? (
          <p className="text-sm text-foreground/40 text-center py-8">No stores yet. Create one!</p>
        ) : (
          <div className="space-y-2 max-h-[520px] overflow-y-auto">
            {stores.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <div className="w-10 h-10 rounded-lg bg-saffron/10 flex items-center justify-center flex-shrink-0">
                  <Store className="w-5 h-5 text-saffron" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-foreground truncate">{s.name}</p>
                  <div className="flex items-center gap-2 text-xs text-foreground/40">
                    <span className="capitalize">{s.category}</span>
                    {s.rating && <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-saffron fill-saffron" />{s.rating}</span>}
                    {s.delivery_minutes && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{s.delivery_minutes}m</span>}
                  </div>
                </div>
                <button onClick={() => handleDelete(s.id)} className="p-2 text-foreground/30 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}