import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Package, AlertTriangle, TrendingDown, Save, Power } from "lucide-react";

export default function InventoryManager({ storeId, storeName, merchantId }) {
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState({});
  const [saving, setSaving] = useState(null);

  const load = useCallback(async () => {
    if (!storeId) { setLoading(false); return; }
    try {
      const data = await base44.entities.Product.filter({ store_id: storeId }, "-created_date", 200);
      setProducts(data);
      const initialEditing = {};
      data.forEach(p => { initialEditing[p.id] = { stock: p.stock ?? 0, low_stock_threshold: p.low_stock_threshold ?? 5, is_available: p.is_available ?? true }; });
      setEditing(initialEditing);
    } catch {}
    setLoading(false);
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (productId) => {
    setSaving(productId);
    const ed = editing[productId];
    if (!ed) { setSaving(null); return; }
    try {
      await base44.entities.Product.update(productId, {
        stock: Number(ed.stock) || 0,
        low_stock_threshold: Number(ed.low_stock_threshold) || 5,
        is_available: ed.is_available,
      });
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: Number(ed.stock), low_stock_threshold: Number(ed.low_stock_threshold), is_available: ed.is_available } : p));
      toast({ title: "Inventory updated" });
    } catch { toast({ title: "Failed to update", variant: "destructive" }); }
    setSaving(null);
  };

  const toggleAvailable = async (productId, current) => {
    try {
      await base44.entities.Product.update(productId, { is_available: !current });
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, is_available: !current } : p));
      setEditing(prev => ({ ...prev, [productId]: { ...prev[productId], is_available: !current } }));
    } catch {}
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  const lowStock = products.filter(p => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= (p.low_stock_threshold ?? 5));
  const outOfStock = products.filter(p => (p.stock ?? 0) === 0);

  const stats = [
    { label: "Total Products", value: products.length, icon: Package, color: "bg-saffron/10 text-saffron" },
    { label: "Low Stock", value: lowStock.length, icon: AlertTriangle, color: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400" },
    { label: "Out of Stock", value: outOfStock.length, icon: TrendingDown, color: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400" },
  ];

  const getStockStatus = (product) => {
    const stock = product.stock ?? 0;
    const threshold = product.low_stock_threshold ?? 5;
    if (stock === 0) return { label: "Out of Stock", color: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400" };
    if (stock <= threshold) return { label: "Low Stock", color: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400" };
    return { label: "In Stock", color: "bg-terai/10 text-terai" };
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
              <div className={"w-9 h-9 rounded-lg flex items-center justify-center mb-2 " + s.color}><Icon className="w-4 h-4" /></div>
              <p className="text-xl font-display font-extrabold text-foreground">{s.value}</p>
              <p className="text-xs text-foreground/40">{s.label}</p>
            </div>
          );
        })}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12"><Package className="w-10 h-10 text-foreground/20 mx-auto mb-2" /><p className="text-sm text-foreground/40">No products yet. Add products in the Products tab.</p></div>
      ) : (
        <div className="space-y-2">
          {products.map((p) => {
            const status = getStockStatus(p);
            const ed = editing[p.id] || { stock: p.stock, low_stock_threshold: p.low_stock_threshold, is_available: p.is_available };
            return (
              <div key={p.id} className="bg-card rounded-2xl border border-border p-4">
                <div className="flex items-center gap-3 mb-3">
                  <img src={p.image_url || "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=80"} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">{p.name}</p>
                    <p className="text-xs text-foreground/40">Rs {p.price}</p>
                  </div>
                  <span className={"text-[9px] font-bold px-2 py-0.5 rounded-full " + status.color}>{status.label}</span>
                  <button onClick={() => toggleAvailable(p.id, p.is_available)} className={"w-8 h-8 rounded-lg flex items-center justify-center " + (p.is_available ? "bg-terai/10 text-terai" : "bg-muted text-foreground/30")}><Power className="w-3.5 h-3.5" /></button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-foreground/40 uppercase">Stock Qty</label>
                    <input type="number" value={ed.stock} onChange={(e) => setEditing({ ...editing, [p.id]: { ...ed, stock: e.target.value } })} className="w-full h-9 px-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-foreground/40 uppercase">Low Stock Alert</label>
                    <input type="number" value={ed.low_stock_threshold} onChange={(e) => setEditing({ ...editing, [p.id]: { ...ed, low_stock_threshold: e.target.value } })} className="w-full h-9 px-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40" />
                  </div>
                  <button onClick={() => handleSave(p.id)} disabled={saving === p.id} className="mt-4 h-9 px-3 rounded-lg bg-saffron text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1">
                    {saving === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Save className="w-3 h-3" /> Save</>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}