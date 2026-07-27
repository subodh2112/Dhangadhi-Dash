import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Megaphone, Plus, Pencil, Trash2, Loader2, Eye, EyeOff } from "lucide-react";

const emptyBanner = { title: "", subtitle: "", image_url: "", cta_text: "", cta_link: "", bg_color: "#FF3D00", is_active: true, display_order: 0 };

export default function BannerManager() {
  const { toast } = useToast();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadBanners(); }, []);

  const loadBanners = async () => {
    try { const b = await base44.entities.Banner.list("display_order", 50); setBanners(b); }
    catch {} finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!modal.title.trim()) return;
    setSaving(true);
    try {
      if (modal.id) { await base44.entities.Banner.update(modal.id, modal); toast({ title: "Banner updated" }); }
      else { await base44.entities.Banner.create(modal); toast({ title: "Banner created" }); }
      setModal(null); loadBanners();
    } catch { toast({ title: "Failed to save", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this banner?")) return;
    try { await base44.entities.Banner.delete(id); setBanners((prev) => prev.filter((b) => b.id !== id)); toast({ title: "Banner deleted" }); }
    catch { toast({ title: "Failed to delete", variant: "destructive" }); }
  };

  const toggleActive = async (banner) => {
    try { await base44.entities.Banner.update(banner.id, { is_active: !banner.is_active }); setBanners((prev) => prev.map((b) => b.id === banner.id ? { ...b, is_active: !b.is_active } : b)); }
    catch {}
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl text-foreground">Promotional Banners</h2>
          <p className="text-sm text-foreground/50">Create banners displayed on the homepage.</p>
        </div>
        <Button onClick={() => setModal({ ...emptyBanner })}><Plus className="w-4 h-4" /> New Banner</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-saffron animate-spin" /></div>
      ) : banners.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-2xl">
          <Megaphone className="w-10 h-10 text-foreground/20 mx-auto mb-2" />
          <p className="text-sm text-foreground/40">No banners yet. Create one to promote seasonal offers.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((banner) => (
            <div key={banner.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: banner.bg_color || "#FF3D00" }}>
                <Megaphone className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-foreground truncate">{banner.title}</p>
                  {!banner.is_active && <span className="text-[10px] font-bold text-foreground/40 bg-muted px-2 py-0.5 rounded-full">Inactive</span>}
                </div>
                {banner.subtitle && <p className="text-xs text-foreground/40 truncate">{banner.subtitle}</p>}
                {banner.cta_text && <p className="text-xs text-saffron mt-0.5">→ {banner.cta_text} · {banner.cta_link || "/"}</p>}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toggleActive(banner)} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center" title={banner.is_active ? "Hide" : "Show"}>
                  {banner.is_active ? <Eye className="w-4 h-4 text-terai" /> : <EyeOff className="w-4 h-4 text-foreground/40" />}
                </button>
                <button onClick={() => setModal({ ...banner })} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center">
                  <Pencil className="w-4 h-4 text-foreground/60" />
                </button>
                <button onClick={() => handleDelete(banner.id)} className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!modal} onOpenChange={(open) => !open && setModal(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{modal?.id ? "Edit Banner" : "New Banner"}</DialogTitle></DialogHeader>
          {modal && (
            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input value={modal.title} onChange={(e) => setModal({ ...modal, title: e.target.value })} placeholder="e.g. Dashain Special Offer" />
              </div>
              <div>
                <Label>Subtitle</Label>
                <Input value={modal.subtitle || ""} onChange={(e) => setModal({ ...modal, subtitle: e.target.value })} placeholder="e.g. 20% off all local restaurants" />
              </div>
              <div>
                <Label>Background Color</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={modal.bg_color || "#FF3D00"} onChange={(e) => setModal({ ...modal, bg_color: e.target.value })} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                  <Input value={modal.bg_color || ""} onChange={(e) => setModal({ ...modal, bg_color: e.target.value })} placeholder="#FF3D00" className="flex-1" />
                </div>
              </div>
              <div>
                <Label>Image URL (optional)</Label>
                <Input value={modal.image_url || ""} onChange={(e) => setModal({ ...modal, image_url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>CTA Text</Label>
                  <Input value={modal.cta_text || ""} onChange={(e) => setModal({ ...modal, cta_text: e.target.value })} placeholder="Shop Now" />
                </div>
                <div>
                  <Label>CTA Link</Label>
                  <Input value={modal.cta_link || ""} onChange={(e) => setModal({ ...modal, cta_link: e.target.value })} placeholder="/#top-partners" />
                </div>
              </div>
              <div>
                <Label>Display Order</Label>
                <Input type="number" value={modal.display_order || 0} onChange={(e) => setModal({ ...modal, display_order: parseInt(e.target.value) || 0 })} />
              </div>
              <Button onClick={handleSave} disabled={!modal.title.trim() || saving} className="w-full">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Banner"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}