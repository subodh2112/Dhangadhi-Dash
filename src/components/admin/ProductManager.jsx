import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Package, Trash2 } from "lucide-react";
import CategorySelect from "@/components/CategorySelect";
import CategoryHierarchy from "@/components/CategoryHierarchy";

const emptyForm = {
  name: "", store_name: "", category: "food", parent_category_id: "", child_category_id: "",
  description: "", price: 100, discount_percent: 0, image_url: "", stock: 50,
  is_popular: false, is_bestseller: false, is_flash_sale: false,
};

export default function ProductManager() {
  const [form, setForm] = useState(emptyForm);
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      base44.entities.Product.list("-created_date", 30).catch(() => []),
      base44.entities.Store.list("-created_date", 50).catch(() => []),
    ]).then(([p, s]) => {
      setProducts(p);
      setStores(s);
    }).finally(() => setLoading(false));
  };

  useEffect(fetchData, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Product name is required"); return; }
    if (!form.store_name) { setError("Select a store"); return; }
    setSubmitting(true);
    setError("");
    try {
      await base44.entities.Product.create({
        ...form,
        price: Number(form.price),
        discount_percent: Number(form.discount_percent),
        stock: Number(form.stock),
        rating: 4.5,
        reviews_count: 0,
        is_available: true,
      });
      setForm(emptyForm);
      fetchData();
    } catch {
      setError("Failed to create product. Admin access required.");
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    try { await base44.entities.Product.delete(id); fetchData(); } catch {}
  };

  const inputClass = "w-full h-11 px-3 rounded-xl border border-border bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-saffron/40 focus:border-saffron";
  const labelClass = "text-xs font-bold text-foreground/60 uppercase tracking-wide mb-1.5 block";

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-card rounded-3xl border border-border p-6">
        <h2 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-saffron" /> Add New Product
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Product Name *</label>
            <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Veg Momo" />
          </div>
          <div>
            <label className={labelClass}>Store *</label>
            <select className={inputClass} value={form.store_name} onChange={(e) => setForm({ ...form, store_name: e.target.value })}>
              <option value="">Select store...</option>
              {stores.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Category</label>
            <CategorySelect
              parentCategoryId={form.parent_category_id}
              childCategoryId={form.child_category_id}
              onParentChange={(val) => setForm({ ...form, parent_category_id: val })}
              onChildChange={(val) => setForm({ ...form, child_category_id: val })}
              inputClass={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <textarea rows={2} className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description..." />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Price (Rs)</label>
              <input type="number" className={inputClass} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Discount %</label>
              <input type="number" className={inputClass} value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Stock</label>
              <input type="number" className={inputClass} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Image URL</label>
            <input className={inputClass} value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-foreground/60 cursor-pointer">
              <input type="checkbox" checked={form.is_popular} onChange={(e) => setForm({ ...form, is_popular: e.target.checked })} className="w-4 h-4 accent-saffron" /> Popular
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground/60 cursor-pointer">
              <input type="checkbox" checked={form.is_bestseller} onChange={(e) => setForm({ ...form, is_bestseller: e.target.checked })} className="w-4 h-4 accent-saffron" /> Bestseller
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground/60 cursor-pointer">
              <input type="checkbox" checked={form.is_flash_sale} onChange={(e) => setForm({ ...form, is_flash_sale: e.target.checked })} className="w-4 h-4 accent-saffron" /> Flash Sale
            </label>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={submitting} className="w-full h-11 rounded-xl bg-saffron text-white font-bold hover:bg-saffron/90 disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus className="w-4 h-4" /> Create Product</>}
          </button>
        </form>
      </div>

      <div className="bg-card rounded-3xl border border-border p-6">
        <h2 className="font-display font-bold text-lg text-foreground mb-4">Recent Products ({products.length})</h2>
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>
        ) : products.length === 0 ? (
          <p className="text-sm text-foreground/40 text-center py-8">No products yet. Create one!</p>
        ) : (
          <div className="space-y-2 max-h-[520px] overflow-y-auto">
            {products.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <div className="w-10 h-10 rounded-lg bg-terai/10 flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-terai" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-foreground truncate">{p.name}</p>
                  <div className="flex items-center gap-2 text-xs text-foreground/40">
                    <span className="truncate">{p.store_name}</span>
                    <span className="font-semibold text-saffron">Rs {p.price}</span>
                  </div>
                  <CategoryHierarchy
                    parentCategoryId={p.parent_category_id}
                    childCategoryId={p.child_category_id}
                    showIcons
                    className="mt-0.5"
                  />
                </div>
                <button onClick={() => handleDelete(p.id)} className="p-2 text-foreground/30 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}