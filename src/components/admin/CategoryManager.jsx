import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { logAdminAction } from "@/lib/adminLog";
import { useAuth } from "@/lib/AuthContext";
import { Plus, Tags, Trash2, Edit3, Star, Eye, EyeOff, ChevronDown, ChevronRight, ChevronUp, X, Loader2, FolderTree, Folder, Upload, Image as ImageIcon } from "lucide-react";
import { CATEGORY_HIERARCHY } from "@/lib/categories";
import { useCategories } from "@/hooks/useCategories";
import CategorySelect from "@/components/CategorySelect";

const emptyForm = {
  name: "", slug: "", parent_category_id: "", industry_group: "food", icon: "📦",
  image: "", banner_url: "", color_gradient: "from-slate-400 to-slate-600", display_order: 0,
  is_featured: false, is_active: true, description: "",
};

export default function CategoryManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { categories, parents, childrenByParent, refetch, loading } = useCategories();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedParents, setExpandedParents] = useState({});
  const [filterParent, setFilterParent] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

  // --- Validation ---
  const validateForm = () => {
    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return false;
    }
    // Circular reference: can't set parent to self
    if (editingId && form.parent_category_id === editingId) {
      toast({ title: "A category cannot be its own parent", variant: "destructive" });
      return false;
    }
    // Circular reference: can't set parent to a descendant
    if (editingId && form.parent_category_id) {
      const isDescendant = (checkId, ancestorId) => {
        let current = checkId;
        const visited = new Set();
        while (current && !visited.has(current)) {
          if (current === ancestorId) return true;
          visited.add(current);
          const cat = categories.find((c) => c.id === current);
          current = cat?.parent_category_id;
        }
        return false;
      };
      if (isDescendant(form.parent_category_id, editingId)) {
        toast({ title: "Cannot set a child category as parent (circular reference)", variant: "destructive" });
        return false;
      }
    }
    // Duplicate name under same parent
    const dupName = categories.find((c) =>
      c.name.toLowerCase().trim() === form.name.toLowerCase().trim() &&
      (c.parent_category_id || "") === (form.parent_category_id || "") &&
      c.id !== editingId
    );
    if (dupName) {
      toast({
        title: "Duplicate category name",
        description: "A category with this name already exists under the same parent.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    const payload = {
      ...form,
      parent_category_id: form.parent_category_id || null,
      slug: form.slug.trim() || slugify(form.name),
      display_order: Number(form.display_order) || 0,
      image: form.image || "",
      banner_url: form.banner_url || "",
    };
    try {
      if (editingId) {
        await base44.entities.Category.update(editingId, payload);
        await logAdminAction("Updated category: " + form.name, "category", form.name, "");
        toast({ title: "Category updated" });
      } else {
        await base44.entities.Category.create(payload);
        await logAdminAction("Created category: " + form.name, "category", form.name, "");
        toast({ title: "Category created" });
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      refetch();
    } catch (err) {
      toast({ title: err.message || "Failed to save", variant: "destructive" });
    }
    setSubmitting(false);
  };

  const handleEdit = (cat) => {
    setForm({
      name: cat.name || "", slug: cat.slug || "", parent_category_id: cat.parent_category_id || "",
      industry_group: cat.industry_group || "food", icon: cat.icon || "📦",
      image: cat.image || "", banner_url: cat.banner_url || "",
      color_gradient: cat.color_gradient || "from-slate-400 to-slate-600",
      display_order: cat.display_order || 0, is_featured: cat.is_featured || false,
      is_active: cat.is_active !== false, description: cat.description || "",
    });
    setEditingId(cat.id);
    setShowForm(true);
  };

  // --- File Upload ---
  const handleFileUpload = async (field, file) => {
    if (!file) return;
    setUploading(field);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setForm((prev) => ({ ...prev, [field]: result.file_url }));
      toast({ title: field === "image" ? "Icon uploaded" : "Banner uploaded" });
    } catch (err) {
      toast({ title: "Upload failed", variant: "destructive" });
    }
    setUploading(null);
  };

  // --- Reorder ---
  const moveOrder = async (cat, direction, siblings) => {
    const sorted = [...siblings].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    const idx = sorted.findIndex((c) => c.id === cat.id);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === sorted.length - 1) return;
    const swapWith = direction === "up" ? sorted[idx - 1] : sorted[idx + 1];
    try {
      await base44.entities.Category.update(cat.id, { display_order: swapWith.display_order });
      await base44.entities.Category.update(swapWith.id, { display_order: cat.display_order });
      refetch();
    } catch {
      toast({ title: "Failed to reorder", variant: "destructive" });
    }
  };

  // --- Delete with reassign ---
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const { id, isParent } = deleteTarget;
    const kids = childrenByParent[id] || [];
    setSubmitting(true);
    try {
      if (isParent && kids.length > 0 && deleteTarget.action === "reassign") {
        // Reassign children to new parent
        const newParentId = deleteTarget.reassignTo || null;
        for (const kid of kids) {
          await base44.entities.Category.update(kid.id, { parent_category_id: newParentId });
        }
      } else if (isParent && kids.length > 0 && deleteTarget.action === "cascade") {
        // Delete all children
        for (const kid of kids) {
          await base44.entities.Category.delete(kid.id);
        }
      } else if (isParent && kids.length > 0) {
        // No action chosen — can't delete
        toast({ title: "Please choose an action for child categories", variant: "destructive" });
        setSubmitting(false);
        return;
      }
      await base44.entities.Category.delete(id);
      await logAdminAction("Deleted category", "category", "", "");
      toast({ title: "Category deleted" });
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast({ title: err.message || "Failed to delete", variant: "destructive" });
    }
    setSubmitting(false);
  };

  const toggleField = async (id, field, value) => {
    try {
      await base44.entities.Category.update(id, { [field]: value });
      refetch();
    } catch {}
  };

  const toggleExpand = (id) => {
    setExpandedParents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const seedHierarchy = async () => {
    if (!confirm("Seed the full parent-child category hierarchy? This will create " +
      CATEGORY_HIERARCHY.length + " parent categories and their children.")) return;
    setSubmitting(true);
    try {
      const existingSlugs = new Set(categories.map((c) => c.slug));
      let created = 0;

      for (let pIdx = 0; pIdx < CATEGORY_HIERARCHY.length; pIdx++) {
        const parent = CATEGORY_HIERARCHY[pIdx];
        if (existingSlugs.has(parent.slug)) {
          const existingParent = categories.find((c) => c.slug === parent.slug);
          for (const child of parent.children) {
            if (!existingSlugs.has(child.slug)) {
              await base44.entities.Category.create({
                name: child.name, slug: child.slug, parent_category_id: existingParent.id,
                industry_group: parent.group, icon: child.emoji, image: "", banner_url: "",
                color_gradient: child.color, display_order: pIdx * 100,
                is_featured: false, is_active: true,
              });
              created++;
            }
          }
        } else {
          const parentRec = await base44.entities.Category.create({
            name: parent.name, slug: parent.slug, parent_category_id: null,
            industry_group: parent.group, icon: parent.emoji, image: "", banner_url: "",
            color_gradient: parent.color, display_order: pIdx * 100,
            is_featured: pIdx < 6, is_active: true,
          });
          created++;

          for (let cIdx = 0; cIdx < parent.children.length; cIdx++) {
            const child = parent.children[cIdx];
            if (!existingSlugs.has(child.slug)) {
              await base44.entities.Category.create({
                name: child.name, slug: child.slug, parent_category_id: parentRec.id,
                industry_group: parent.group, icon: child.emoji, image: "", banner_url: "",
                color_gradient: child.color, display_order: pIdx * 100 + cIdx + 1,
                is_featured: false, is_active: true,
              });
              created++;
            }
          }
        }
      }

      await logAdminAction("Seeded " + created + " hierarchical categories", "category", "", "");
      toast({ title: created + " categories seeded" });
      refetch();
    } catch (err) {
      toast({ title: err.message || "Failed to seed", variant: "destructive" });
    }
    setSubmitting(false);
  };

  const inputClass = "w-full h-11 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-saffron/40 focus:border-saffron";
  const labelClass = "text-xs font-bold text-foreground/60 uppercase tracking-wide mb-1.5 block";

  const filteredParents = filterParent
    ? parents.filter((p) => p.id === filterParent)
    : parents;

  const sortedParents = [...filteredParents].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display font-bold text-xl text-foreground flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-saffron" /> Category Management
          </h2>
          <p className="text-sm text-foreground/50 mt-0.5">Manage parent &amp; child categories across all industries.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={seedHierarchy} disabled={submitting} className="px-4 h-10 rounded-xl border border-border text-sm font-bold text-foreground/60 hover:text-saffron hover:border-saffron/40 disabled:opacity-50">
            Seed Hierarchy
          </button>
          <button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(!showForm); }} className="px-4 h-10 rounded-xl bg-saffron text-white text-sm font-bold flex items-center gap-1.5 hover:bg-saffron/90">
            <Plus className="w-4 h-4" /> {showForm ? "Cancel" : "Add Category"}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              {form.parent_category_id ? <Folder className="w-4 h-4 text-terai" /> : <FolderTree className="w-4 h-4 text-saffron" />}
              {editingId ? "Edit Category" : "New Category"}
              <span className="text-xs font-normal text-foreground/40">
                {form.parent_category_id ? "(Child)" : "(Parent)"}
              </span>
            </h3>
            <button onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }} className="p-1 text-foreground/40 hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>Parent Category (leave empty for parent category)</label>
              <select className={inputClass} value={form.parent_category_id} onChange={(e) => setForm({ ...form, parent_category_id: e.target.value })}>
                <option value="">— No parent (Parent Category) —</option>
                {parents.filter((p) => p.id !== editingId).map((p) => (
                  <option key={p.id} value={p.id}>{p.icon ? p.icon + " " : ""}{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Name *</label>
              <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })} placeholder="e.g. Fast Food" />
            </div>
            <div>
              <label className={labelClass}>Slug</label>
              <input className={inputClass} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated" />
            </div>
            <div>
              <label className={labelClass}>Industry Group</label>
              <select className={inputClass} value={form.industry_group} onChange={(e) => setForm({ ...form, industry_group: e.target.value })}>
                {["food", "grocery", "fashion", "electronics", "beauty", "health", "home", "pets", "gifts", "books", "auto", "sports", "toys"].map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Icon (Emoji)</label>
              <input className={inputClass} value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="📦" />
            </div>

            {/* Icon Image Upload */}
            <div>
              <label className={labelClass}>Category Icon Image</label>
              <div className="flex items-center gap-2">
                <div className="w-14 h-14 rounded-xl bg-muted border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                  {form.image ? <img src={form.image} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl">{form.icon || "📦"}</span>}
                </div>
                <label className="flex-1 h-11 rounded-xl border border-dashed border-border flex items-center justify-center gap-2 text-sm text-foreground/50 hover:border-saffron hover:text-saffron cursor-pointer transition-colors">
                  {uploading === "image" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4" /> Upload Icon</>}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && handleFileUpload("image", e.target.files[0])} />
                </label>
                {form.image && (
                  <button type="button" onClick={() => setForm({ ...form, image: "" })} className="p-2 text-foreground/40 hover:text-red-500"><X className="w-4 h-4" /></button>
                )}
              </div>
            </div>

            {/* Banner Image Upload */}
            <div>
              <label className={labelClass}>Category Banner</label>
              <div className="flex items-center gap-2">
                <div className="w-20 h-14 rounded-xl bg-muted border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                  {form.banner_url ? <img src={form.banner_url} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-foreground/20" />}
                </div>
                <label className="flex-1 h-11 rounded-xl border border-dashed border-border flex items-center justify-center gap-2 text-sm text-foreground/50 hover:border-saffron hover:text-saffron cursor-pointer transition-colors">
                  {uploading === "banner_url" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4" /> Upload Banner</>}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && handleFileUpload("banner_url", e.target.files[0])} />
                </label>
                {form.banner_url && (
                  <button type="button" onClick={() => setForm({ ...form, banner_url: "" })} className="p-2 text-foreground/40 hover:text-red-500"><X className="w-4 h-4" /></button>
                )}
              </div>
            </div>

            <div>
              <label className={labelClass}>Color Gradient</label>
              <input className={inputClass} value={form.color_gradient} onChange={(e) => setForm({ ...form, color_gradient: e.target.value })} placeholder="from-blue-500 to-cyan-500" />
            </div>
            <div>
              <label className={labelClass}>Display Order</label>
              <input type="number" className={inputClass} value={form.display_order} onChange={(e) => setForm({ ...form, display_order: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Description</label>
              <textarea rows={2} className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description..." />
            </div>
            <div className="flex gap-4 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm text-foreground/60 cursor-pointer">
                <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="w-4 h-4 accent-saffron" /> Featured
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground/60 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 accent-saffron" /> Active
              </label>
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <div className={"w-14 h-14 rounded-xl bg-gradient-to-br " + (form.color_gradient || "from-slate-400 to-slate-600") + " flex items-center justify-center flex-shrink-0 overflow-hidden"}>
                {form.image ? <img src={form.image} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl">{form.icon || "📦"}</span>}
              </div>
              <button type="submit" disabled={submitting} className="flex-1 h-11 rounded-xl bg-saffron text-white font-bold hover:bg-saffron/90 disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{editingId ? "Update" : "Create"} Category</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter by parent */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-foreground/40 uppercase tracking-wide">Filter:</span>
        <select className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground" value={filterParent} onChange={(e) => setFilterParent(e.target.value)}>
          <option value="">All Categories</option>
          {parents.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : sortedParents.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <FolderTree className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-foreground/40 mb-2">No categories yet.</p>
          <button onClick={seedHierarchy} className="text-sm font-bold text-saffron hover:underline">Seed hierarchy →</button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedParents.map((parent) => {
            const kids = (childrenByParent[parent.id] || []).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
            const isExpanded = expandedParents[parent.id] !== false;
            return (
              <div key={parent.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                {/* Parent row */}
                <div className={"p-4 flex items-center gap-3 " + (parent.is_active === false ? "opacity-50" : "")}>
                  <button onClick={() => toggleExpand(parent.id)} className="p-1 text-foreground/40 hover:text-foreground" title={isExpanded ? "Collapse" : "Expand"}>
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <div className={"w-12 h-12 rounded-xl bg-gradient-to-br " + (parent.color_gradient || "from-slate-400 to-slate-600") + " flex items-center justify-center flex-shrink-0 overflow-hidden"}>
                    {parent.image ? <img src={parent.image} alt="" className="w-full h-full object-cover" /> : <span className="text-xl">{parent.icon || "📦"}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-sm text-foreground truncate">{parent.name}</p>
                      {parent.is_featured && <Star className="w-3 h-3 text-saffron fill-saffron flex-shrink-0" />}
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-saffron/10 text-saffron">PARENT</span>
                    </div>
                    <p className="text-xs text-foreground/40">{parent.industry_group || "uncategorized"} · {kids.length} children · order: {parent.display_order || 0}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => moveOrder(parent, "up", sortedParents)} disabled={sortedParents.indexOf(parent) === 0} className="p-1.5 text-foreground/40 hover:text-saffron disabled:opacity-20" title="Move up"><ChevronUp className="w-4 h-4" /></button>
                    <button onClick={() => moveOrder(parent, "down", sortedParents)} disabled={sortedParents.indexOf(parent) === sortedParents.length - 1} className="p-1.5 text-foreground/40 hover:text-saffron disabled:opacity-20" title="Move down"><ChevronDown className="w-4 h-4" /></button>
                    <button onClick={() => toggleField(parent.id, "is_active", !parent.is_active)} className="p-1.5 text-foreground/40 hover:text-saffron" title={parent.is_active === false ? "Enable" : "Disable"}>
                      {parent.is_active === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={() => toggleField(parent.id, "is_featured", !parent.is_featured)} className={"p-1.5 " + (parent.is_featured ? "text-saffron" : "text-foreground/40 hover:text-saffron")} title="Toggle featured">
                      <Star className={"w-4 h-4 " + (parent.is_featured ? "fill-saffron" : "")} />
                    </button>
                    <button onClick={() => handleEdit(parent)} className="p-1.5 text-foreground/40 hover:text-blue-500"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteTarget({ id: parent.id, name: parent.name, isParent: true, childCount: kids.length, action: kids.length > 0 ? "" : "none" })} className="p-1.5 text-foreground/40 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                {/* Children */}
                {isExpanded && kids.length > 0 && (
                  <div className="border-t border-border bg-muted/20">
                    {kids.map((cat) => (
                      <div key={cat.id} className={"px-4 py-3 flex items-center gap-3 border-b border-border/50 last:border-b-0 " + (cat.is_active === false ? "opacity-50" : "")}>
                        <div className="w-8 ml-6" />
                        <div className={"w-9 h-9 rounded-lg bg-gradient-to-br " + (cat.color_gradient || "from-slate-400 to-slate-600") + " flex items-center justify-center flex-shrink-0 overflow-hidden"}>
                          {cat.image ? <img src={cat.image} alt="" className="w-full h-full object-cover" /> : <span className="text-base">{cat.icon || "📦"}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-sm text-foreground truncate">{cat.name}</p>
                            {cat.is_featured && <Star className="w-3 h-3 text-saffron fill-saffron flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-foreground/40">order: {cat.display_order || 0}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => moveOrder(cat, "up", kids)} disabled={kids.indexOf(cat) === 0} className="p-1.5 text-foreground/40 hover:text-saffron disabled:opacity-20" title="Move up"><ChevronUp className="w-4 h-4" /></button>
                          <button onClick={() => moveOrder(cat, "down", kids)} disabled={kids.indexOf(cat) === kids.length - 1} className="p-1.5 text-foreground/40 hover:text-saffron disabled:opacity-20" title="Move down"><ChevronDown className="w-4 h-4" /></button>
                          <button onClick={() => toggleField(cat.id, "is_active", !cat.is_active)} className="p-1.5 text-foreground/40 hover:text-saffron" title={cat.is_active === false ? "Enable" : "Disable"}>
                            {cat.is_active === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button onClick={() => toggleField(cat.id, "is_featured", !cat.is_featured)} className={"p-1.5 " + (cat.is_featured ? "text-saffron" : "text-foreground/40 hover:text-saffron")} title="Toggle featured">
                            <Star className={"w-4 h-4 " + (cat.is_featured ? "fill-saffron" : "")} />
                          </button>
                          <button onClick={() => handleEdit(cat)} className="p-1.5 text-foreground/40 hover:text-blue-500"><Edit3 className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteTarget({ id: cat.id, name: cat.name, isParent: false, childCount: 0, action: "none" })} className="p-1.5 text-foreground/40 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {isExpanded && kids.length === 0 && (
                  <div className="border-t border-border bg-muted/20 px-4 py-3 ml-6">
                    <p className="text-xs text-foreground/30">No child categories yet.</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-carbon/50 backdrop-blur-sm" onClick={() => !submitting && setDeleteTarget(null)}>
          <div className="bg-card rounded-2xl border border-border p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="font-bold text-lg text-foreground">Delete "{deleteTarget.name}"?</h3>
            </div>
            {deleteTarget.isParent && deleteTarget.childCount > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-foreground/60">This parent category has <strong>{deleteTarget.childCount} child categor{deleteTarget.childCount === 1 ? "y" : "ies"}</strong>. Choose an action:</p>
                <div className="space-y-2">
                  <label className={"flex items-start gap-2 p-3 rounded-xl border cursor-pointer transition-colors " + (deleteTarget.action === "reassign" ? "border-saffron bg-saffron/5" : "border-border hover:border-saffron/40")}>
                    <input type="radio" checked={deleteTarget.action === "reassign"} onChange={() => setDeleteTarget({ ...deleteTarget, action: "reassign" })} className="mt-0.5 accent-saffron" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">Reassign children</p>
                      <p className="text-xs text-foreground/40">Move children to another parent or make them parent categories.</p>
                      {deleteTarget.action === "reassign" && (
                        <select className="w-full h-10 px-3 mt-2 rounded-xl border border-border bg-background text-sm text-foreground" value={deleteTarget.reassignTo || ""} onChange={(e) => setDeleteTarget({ ...deleteTarget, reassignTo: e.target.value })}>
                          <option value="">— Make them Parent Categories —</option>
                          {parents.filter((p) => p.id !== deleteTarget.id).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      )}
                    </div>
                  </label>
                  <label className={"flex items-start gap-2 p-3 rounded-xl border cursor-pointer transition-colors " + (deleteTarget.action === "cascade" ? "border-red-500 bg-red-500/5" : "border-border hover:border-red-500/40")}>
                    <input type="radio" checked={deleteTarget.action === "cascade"} onChange={() => setDeleteTarget({ ...deleteTarget, action: "cascade" })} className="mt-0.5 accent-red-500" />
                    <div>
                      <p className="text-sm font-bold text-red-500">Delete all children too</p>
                      <p className="text-xs text-foreground/40">Permanently delete this category and all its children.</p>
                    </div>
                  </label>
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground/60">Are you sure you want to delete this category? This action cannot be undone.</p>
            )}
            <div className="flex gap-2 mt-6">
              <button onClick={() => setDeleteTarget(null)} disabled={submitting} className="flex-1 h-10 rounded-xl border border-border text-sm font-bold text-foreground/60 hover:text-foreground">Cancel</button>
              <button onClick={handleDeleteConfirm} disabled={submitting || (deleteTarget.isParent && deleteTarget.childCount > 0 && !deleteTarget.action)} className="flex-1 h-10 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}