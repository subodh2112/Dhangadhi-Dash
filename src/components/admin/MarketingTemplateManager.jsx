import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, Mail, MessageSquare, Bell, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

const templateTypes = ["email", "sms", "push_notification"];
const categories = ["welcome", "otp", "order_update", "promotion", "festival", "receipt", "inactive_reengagement"];

const typeIcons = { email: Mail, sms: MessageSquare, push_notification: Bell };

export default function MarketingTemplateManager() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState({ template_name: "", template_type: "email", category: "promotion", subject: "", body: "", variables: "", status: "active" });

  const load = useCallback(async () => {
    try { setTemplates(await base44.entities.MarketingTemplate.filter({}, "-created_date", 100)); } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!form.template_name || !form.body) return;
    await base44.entities.MarketingTemplate.create(form);
    setForm({ template_name: "", template_type: "email", category: "promotion", subject: "", body: "", variables: "", status: "active" });
    setShowForm(false);
    load();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-lg text-foreground">Marketing Templates</h2>
          <p className="text-sm text-foreground/50">Email, SMS, and push notification templates.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-saffron hover:bg-saffron/90 h-9"><Plus className="w-4 h-4" /> New Template</Button>
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <input placeholder="Template Name" value={form.template_name} onChange={e => setForm({ ...form, template_name: e.target.value })} className="h-10 px-3 rounded-xl border border-border bg-background text-sm" />
            <select value={form.template_type} onChange={e => setForm({ ...form, template_type: e.target.value })} className="h-10 px-3 rounded-xl border border-border bg-background text-sm">{templateTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}</select>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="h-10 px-3 rounded-xl border border-border bg-background text-sm">{categories.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}</select>
          </div>
          {form.template_type === "email" && <input placeholder="Email Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm" />}
          <textarea placeholder="Template Body (use {{variable}} for dynamic content)" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" rows={4} />
          <input placeholder="Variables: name, order_id, amount" value={form.variables} onChange={e => setForm({ ...form, variables: e.target.value })} className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm" />
          <Button onClick={create} className="bg-saffron hover:bg-saffron/90 w-full">Save Template</Button>
        </div>
      )}

      {templates.length === 0 ? (
        <div className="text-center py-12"><Mail className="w-12 h-12 text-foreground/20 mx-auto mb-2" /><p className="text-sm text-foreground/40">No templates yet.</p></div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {templates.map(t => {
            const Icon = typeIcons[t.template_type] || Mail;
            return (
              <div key={t.id} className="bg-card rounded-2xl border border-border p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-saffron/10 flex items-center justify-center"><Icon className="w-4 h-4 text-saffron" /></div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground">{t.template_name}</h3>
                      <p className="text-[10px] text-foreground/40 capitalize">{t.template_type?.replace(/_/g, " ")} • {t.category?.replace(/_/g, " ")}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setPreview(preview === t.id ? null : t.id)} className="p-2 rounded-lg bg-muted text-foreground/50 hover:text-saffron"><Eye className="w-3.5 h-3.5" /></button>
                    <button onClick={() => base44.entities.MarketingTemplate.delete(t.id).then(load)} className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                {preview === t.id && (
                  <div className="mt-2 p-3 rounded-xl bg-muted/50">
                    {t.subject && <p className="text-xs font-bold text-foreground mb-1">Subject: {t.subject}</p>}
                    <p className="text-xs text-foreground/60 whitespace-pre-wrap">{t.body}</p>
                    {t.variables && <p className="text-[10px] text-foreground/40 mt-2">Variables: {t.variables}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}