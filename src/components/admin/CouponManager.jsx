import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Ticket, Trash2 } from "lucide-react";

const discountTypes = [
  { value: "percentage", label: "Percentage (%)" },
  { value: "fixed", label: "Fixed Amount (Rs)" },
  { value: "free_delivery", label: "Free Delivery" },
];

const emptyForm = {
  code: "", description: "", discount_type: "percentage",
  discount_value: 10, min_order_amount: 200, max_discount_amount: 100,
  valid_until: "", usage_limit: 100,
};

export default function CouponManager() {
  const [form, setForm] = useState(emptyForm);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchCoupons = () => {
    setLoading(true);
    base44.entities.Coupon.list("-created_date", 30)
      .then(setCoupons)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(fetchCoupons, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code.trim()) { setError("Coupon code is required"); return; }
    setSubmitting(true);
    setError("");
    try {
      await base44.entities.Coupon.create({
        ...form,
        discount_value: Number(form.discount_value),
        min_order_amount: Number(form.min_order_amount),
        max_discount_amount: Number(form.max_discount_amount),
        usage_limit: Number(form.usage_limit),
        is_active: true,
        used_count: 0,
      });
      setForm(emptyForm);
      fetchCoupons();
    } catch {
      setError("Failed to create coupon. Admin access required.");
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this coupon?")) return;
    try { await base44.entities.Coupon.delete(id); fetchCoupons(); } catch {}
  };

  const inputClass = "w-full h-11 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-saffron/40 focus:border-saffron";
  const labelClass = "text-xs font-bold text-foreground/60 uppercase tracking-wide mb-1.5 block";

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-card rounded-3xl border border-border p-6">
        <h2 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-saffron" /> Add New Coupon
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Coupon Code *</label>
              <input className={inputClass} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="DASH10" />
            </div>
            <div>
              <label className={labelClass}>Discount Type</label>
              <select className={inputClass} value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}>
                {discountTypes.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <input className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="10% off on orders above Rs 200" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Discount Value</label>
              <input type="number" className={inputClass} value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Min Order (Rs)</label>
              <input type="number" className={inputClass} value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Max Discount (Rs)</label>
              <input type="number" className={inputClass} value={form.max_discount_amount} onChange={(e) => setForm({ ...form, max_discount_amount: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Usage Limit</label>
              <input type="number" className={inputClass} value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Valid Until</label>
            <input type="date" className={inputClass} value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={submitting} className="w-full h-11 rounded-xl bg-saffron text-white font-bold hover:bg-saffron/90 disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus className="w-4 h-4" /> Create Coupon</>}
          </button>
        </form>
      </div>

      <div className="bg-card rounded-3xl border border-border p-6">
        <h2 className="font-display font-bold text-lg text-foreground mb-4">Active Coupons ({coupons.length})</h2>
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>
        ) : coupons.length === 0 ? (
          <p className="text-sm text-foreground/40 text-center py-8">No coupons yet. Create one!</p>
        ) : (
          <div className="space-y-2 max-h-[520px] overflow-y-auto">
            {coupons.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <div className="w-10 h-10 rounded-lg bg-saffron/10 flex items-center justify-center flex-shrink-0">
                  <Ticket className="w-5 h-5 text-saffron" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-foreground truncate font-mono">{c.code}</p>
                  <div className="flex items-center gap-2 text-xs text-foreground/40">
                    <span className="capitalize">{c.discount_type}</span>
                    <span className="font-semibold text-saffron">
                      {c.discount_type === "percentage" ? `${c.discount_value}%` : c.discount_type === "fixed" ? `Rs ${c.discount_value}` : "Free Delivery"}
                    </span>
                    {c.valid_until && <span>· until {c.valid_until}</span>}
                  </div>
                </div>
                <button onClick={() => handleDelete(c.id)} className="p-2 text-foreground/30 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}