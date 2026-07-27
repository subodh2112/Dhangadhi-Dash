import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Phone, Trash2, Star, UserPlus } from "lucide-react";

const relationships = ["parent", "spouse", "sibling", "child", "friend", "relative", "other"];

export default function EmergencyContactManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", relationship: "other", phone_number: "", is_primary: false });
  const [saving, setSaving] = useState(false);
  const inputClass = "w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40";

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const data = await base44.entities.EmergencyContact.filter({ user_id: user.id }, "-is_primary");
      setContacts(data);
    } catch {}
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!form.name.trim() || !form.phone_number.trim()) { toast({ title: "Fill required fields", variant: "destructive" }); return; }
    setSaving(true);
    try {
      if (form.is_primary) {
        for (const c of contacts.filter(c => c.is_primary)) {
          await base44.entities.EmergencyContact.update(c.id, { is_primary: false });
        }
      }
      await base44.entities.EmergencyContact.create({ ...form, user_id: user.id });
      toast({ title: "Emergency contact added!" });
      setForm({ name: "", relationship: "other", phone_number: "", is_primary: false });
      setShowForm(false);
      load();
    } catch { toast({ title: "Failed", variant: "destructive" }); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.EmergencyContact.delete(id);
    toast({ title: "Contact removed" });
    load();
  };

  const handleSetPrimary = async (id) => {
    for (const c of contacts.filter(c => c.is_primary)) {
      await base44.entities.EmergencyContact.update(c.id, { is_primary: false });
    }
    await base44.entities.EmergencyContact.update(id, { is_primary: true });
    load();
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-saffron animate-spin" /></div>;

  return (
    <div className="space-y-3">
      {contacts.length === 0 && !showForm ? (
        <div className="text-center py-8">
          <Phone className="w-10 h-10 text-foreground/20 mx-auto mb-2" />
          <p className="text-sm text-foreground/40 mb-3">No emergency contacts yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {contacts.map(c => (
            <div key={c.id} className="bg-card rounded-2xl border border-border p-3 flex items-center gap-3">
              <div className={"w-9 h-9 rounded-lg flex items-center justify-center " + (c.is_primary ? "bg-saffron/10 text-saffron" : "bg-muted text-foreground/40")}><Phone className="w-4 h-4" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-foreground">{c.name}</p>
                  {c.is_primary && <span className="text-[9px] bg-saffron/10 text-saffron font-bold px-1.5 py-0.5 rounded">PRIMARY</span>}
                </div>
                <p className="text-xs text-foreground/40">{c.phone_number} · {c.relationship}</p>
              </div>
              <a href={"tel:" + c.phone_number} className="w-8 h-8 rounded-lg bg-terai/10 flex items-center justify-center hover:bg-terai/20"><Phone className="w-4 h-4 text-terai" /></a>
              {!c.is_primary && <button onClick={() => handleSetPrimary(c.id)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-saffron/10 hover:text-saffron"><Star className="w-4 h-4" /></button>}
              <button onClick={() => handleDelete(c.id)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <div className="bg-card rounded-2xl border border-saffron/30 p-4 space-y-3">
          <div><label className="text-xs font-bold text-foreground/60 mb-1 block">Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="Contact name" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-bold text-foreground/60 mb-1 block">Relationship</label><select value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} className={inputClass}>{relationships.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
            <div><label className="text-xs font-bold text-foreground/60 mb-1 block">Phone</label><input type="tel" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} className={inputClass} placeholder="+977 98XXXXXXXX" /></div>
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground/60"><input type="checkbox" checked={form.is_primary} onChange={(e) => setForm({ ...form, is_primary: e.target.checked })} className="w-4 h-4 rounded" /> Set as primary contact</label>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving} className="flex-1 h-10 rounded-xl bg-saffron text-white text-sm font-bold disabled:opacity-50">{saving ? "Saving..." : "Save Contact"}</button>
            <button onClick={() => setShowForm(false)} className="px-4 h-10 rounded-xl bg-muted text-sm font-bold text-foreground/60">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} className="w-full p-3 rounded-2xl border border-dashed border-border text-sm text-foreground/40 hover:border-saffron/40 hover:text-saffron flex items-center justify-center gap-1.5"><UserPlus className="w-4 h-4" /> Add Emergency Contact</button>
      )}
    </div>
  );
}