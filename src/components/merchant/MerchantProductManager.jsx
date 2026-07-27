import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Package, Trash2, Pencil, AlertTriangle, Loader2, Power } from "lucide-react";
import CategorySelect from "@/components/CategorySelect";
import CategoryHierarchy from "@/components/CategoryHierarchy";

const emptyForm = { name: "", category: "food", parent_category_id: "", child_category_id: "", description: "", price: 100, discount_percent: 0, image_url: "", stock: 50, low_stock_threshold: 5, food_type: "veg", is_spicy: false, is_available: true, is_popular: false, is_bestseller: false };

export default function MerchantProductManager({ storeId, storeName, merchantId }) {
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!storeId) { setLoading(false); return; }
    try {
      const data = await base44.entities.Product.filter({ store_id: storeId }, "-created_date", 200);
      setProducts(data);
    } catch {} finally { setLoading(false); }
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!modal.name.trim()) { toast({ title: "Product name is required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const payload = {
        ...modal,
        store_id: storeId,
        store_name: storeName,
        merchant_id: merchantId || "",
        price: Number(modal.price),
        discount_percent: Number(modal.discount_percent) || 0,
        stock: Number(modal.stock) || 0,
        low_stock_threshold: Number(modal.low_stock_threshold) || 5,
        is_available: modal.stock > 0 ? modal.is_available : false,
      };
      if (modal.id) {
        await base44.entities.Product.update(modal.id, payload);
        toast({ title: "Product updated" });
      } else {
        await base44.entities.Product.create({ ...payload, rating: 4.5, reviews_count: 0 });
        toast({ title: "Product created" });
      }
      setModal(null);
      load();
    } catch (err) { toast({ title: err.message || "Failed to save", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    try { await base44.entities.Product.delete(id); setProducts((prev) => prev.filter((p) => p.id !== id)); toast({ title: "Product deleted" }); }
    catch { toast({ title: "Failed to delete", variant: "destructive" }); }
  };

  const toggleAvailability = async (product) => {
    try {
      await base44.entities.Product.update(product.id, { is_available: !product.is_available });
      setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, is_available: !p.is_available } : p));
    } catch { toast({ title: "Failed to update", variant: "destructive" }); }
  };

  const updateStock = async (product, newStock) => {
    const stock = Math.max(0, Number(newStock) || 0);
    try {
      await base44.entities.Product.update(product.id, { stock, is_available: stock > 0 ? product.is_available : false });
      setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, stock, is_available: stock > 0 ? p.is_available : false } : p));
    } catch { toast({ title: "Failed to update stock", variant: "destructive" }); }
  };

  const inputClass = "w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-saffron/40 focus:border-saffron";

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= (p.low_stock_threshold || 5)).length;
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-lg text-foreground">Products ({products.length})</h2>
          <div className="flex items-center gap-3 mt-1">
            {lowStockCount > 0 && <span className="text-xs font-bold text-amber-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {lowStockCount} low stock</span>}
            {outOfStockCount > 0 && <span className="text-xs font-bold text-red-500">{outOfStockCount} out of stock</span>}
          </div>
        </div>
        <Button onClick={() => setModal({ ...emptyForm })}><Plus className="w-4 h-4" /> Add Product</Button>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 bg-muted/30 rounded-2xl"><Package className="w-12 h-12 text-foreground/20 mx-auto mb-3" /><p className="text-foreground/40 mb-4">No products yet.</p><Button onClick={() => setModal({ ...emptyForm })}><Plus className="w-4 h-4" /> Add Your First Product</Button></div>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              <div className="w-10 h-10 rounded-lg bg-terai/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-terai" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-foreground truncate">{p.name}</p>
                  {p.stock <= 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500">Out of Stock</span>}
                  {p.stock > 0 && p.stock <= (p.low_stock_threshold || 5) && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500">Low Stock</span>}
                </div>
                <div className="flex items-center gap-3 text-xs text-foreground/40">
                  <span className="font-semibold text-saffron">Rs {p.price}</span>
                  <span>Stock: {p.stock}</span>
                  <span className={`capitalize ${p.is_available ? "text-terai" : "text-foreground/40"}`}>{p.is_available ? "Available" : "Unavailable"}</span>
                </div>
                <CategoryHierarchy
                  parentCategoryId={p.parent_category_id}
                  childCategoryId={p.child_category_id}
                  showIcons
                  className="mt-0.5"
                />
              </div>
              <div className="flex items-center gap-1">
                <input type="number" value={p.stock} onChange={(e) => updateStock(p, e.target.value)} className="w-16 h-8 px-2 rounded-lg border border-border bg-background text-xs text-center" title="Update stock" />
                <button onClick={() => toggleAvailability(p)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${p.is_available ? "bg-terai/10 text-terai hover:bg-terai/20" : "bg-muted text-foreground/40 hover:bg-muted/80"}`} title="Toggle availability"><Power className="w-4 h-4" /></button>
                <button onClick={() => setModal({ ...p })} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center" title="Edit"><Pencil className="w-4 h-4 text-foreground/60" /></button>
                <button onClick={() => handleDelete(p.id)} className="w-8 h-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center" title="Delete"><Trash2 className="w-4 h-4 text-red-500" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!modal} onOpenChange={(open) => !open && setModal(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{modal?.id ? "Edit Product" : "New Product"}</DialogTitle></DialogHeader>
          {modal && (
            <div className="space-y-4">
              <div><Label>Name *</Label><Input value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} placeholder="e.g. Veg Momo" /></div>
              <div>
                <Label>Category Hierarchy</Label>
                <CategorySelect
                  parentCategoryId={modal.parent_category_id}
                  childCategoryId={modal.child_category_id}
                  onParentChange={(val) => setModal({ ...modal, parent_category_id: val })}
                  onChildChange={(val) => setModal({ ...modal, child_category_id: val })}
                  inputClass={inputClass}
                  compact
                />
                {(modal.parent_category_id || modal.child_category_id) && (
                  <div className="mt-1.5 px-2 py-1 rounded-lg bg-muted/50">
                    <CategoryHierarchy
                      parentCategoryId={modal.parent_category_id}
                      childCategoryId={modal.child_category_id}
                      showIcons
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Food Type</Label><select value={modal.food_type} onChange={(e) => setModal({ ...modal, food_type: e.target.value })} className={inputClass}><option value="veg">Veg</option><option value="non_veg">Non-Veg</option></select></div>
              </div>
              <div><Label>Description</Label><textarea rows={2} value={modal.description} onChange={(e) => setModal({ ...modal, description: e.target.value })} placeholder="Short description..." className={`${inputClass} resize-none`} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Price (Rs)</Label><Input type="number" value={modal.price} onChange={(e) => setModal({ ...modal, price: e.target.value })} /></div>
                <div><Label>Discount %</Label><Input type="number" value={modal.discount_percent} onChange={(e) => setModal({ ...modal, discount_percent: e.target.value })} /></div>
                <div><Label>Stock</Label><Input type="number" value={modal.stock} onChange={(e) => setModal({ ...modal, stock: e.target.value })} /></div>
              </div>
              <div><Label>Low Stock Threshold</Label><Input type="number" value={modal.low_stock_threshold} onChange={(e) => setModal({ ...modal, low_stock_threshold: e.target.value })} /></div>
              <div><Label>Image URL</Label><Input value={modal.image_url} onChange={(e) => setModal({ ...modal, image_url: e.target.value })} placeholder="https://..." /></div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-foreground/60 cursor-pointer"><input type="checkbox" checked={modal.is_popular} onChange={(e) => setModal({ ...modal, is_popular: e.target.checked })} className="w-4 h-4 accent-saffron" /> Popular</label>
                <label className="flex items-center gap-2 text-sm text-foreground/60 cursor-pointer"><input type="checkbox" checked={modal.is_bestseller} onChange={(e) => setModal({ ...modal, is_bestseller: e.target.checked })} className="w-4 h-4 accent-saffron" /> Bestseller</label>
                <label className="flex items-center gap-2 text-sm text-foreground/60 cursor-pointer"><input type="checkbox" checked={modal.is_spicy} onChange={(e) => setModal({ ...modal, is_spicy: e.target.checked })} className="w-4 h-4 accent-saffron" /> Spicy</label>
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} {modal.id ? "Update Product" : "Create Product"}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}