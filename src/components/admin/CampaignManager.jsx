import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, Megaphone, Play, Pause, CheckCircle, Trash2, TrendingUp, Eye, MousePointerClick, ShoppingCart, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

const campaignTypes = ["discount", "cashback", "free_delivery", "referral", "seasonal_offer"];
const audiences = ["all_users", "new_users", "inactive_users", "specific_area"];

const statusColors = {
  draft: "bg-muted text-foreground/50",
  active: "bg-terai/10 text-terai",
  paused: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400",
  completed: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400",
};

export default function CampaignManager() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ campaign_name: "", campaign_type: "discount", target_audience: "all_users", description: "", start_date: "", end_date: "", budget: 0, discount_value: 0, coupon_code: "", target_area: "", festival_name: "" });

  const load = useCallback(async () => {
    try { setCampaigns(await base44.entities.Campaign.filter({}, "-created_date", 100)); } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const createCampaign = async () => {
    if (!form.campaign_name || !form.start_date || !form.end_date) return;
    await base44.entities.Campaign.create({ ...form, campaign_id: "CMP" + Date.now().toString().slice(-6), status: "draft" });
    setForm({ campaign_name: "", campaign_type: "discount", target_audience: "all_users", description: "", start_date: "", end_date: "", budget: 0, discount_value: 0, coupon_code: "", target_area: "", festival_name: "" });
    setShowForm(false);
    load();
  };

  const updateStatus = async (id, status) => { await base44.entities.Campaign.update(id, { status }); load(); };

  const stats = campaigns.length > 0 ? {
    active: campaigns.filter(c => c.status === "active").length,
    views: campaigns.reduce((s, c) => s + (c.total_views || 0), 0),
    orders: campaigns.reduce((s, c) => s + (c.orders_generated || 0), 0),
    revenue: campaigns.reduce((s, c) => s + (c.revenue_generated || 0), 0),
  } : { active: 0, views: 0, orders: 0, revenue: 0 };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{ label: "Active", value: stats.active, icon: Megaphone, color: "bg-terai/10 text-terai" }, { label: "Total Views", value: stats.views, icon: Eye, color: "bg-blue-50 text-blue-500 dark:bg-blue-500/10" }, { label: "Orders", value: stats.orders, icon: ShoppingCart, color: "bg-saffron/10 text-saffron" }, { label: "Revenue", value: "Rs " + stats.revenue.toLocaleString(), icon: DollarSign, color: "bg-purple-50 text-purple-500 dark:bg-purple-500/10" }].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
            <div className={"w-9 h-9 rounded-lg flex items-center justify-center mb-2 " + s.color}><s.icon className="w-4 h-4" /></div>
            <p className="text-xl font-display font-extrabold text-foreground">{s.value}</p>
            <p className="text-xs text-foreground/40">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-lg text-foreground">Campaigns</h2>
        <Button onClick={() => setShowForm(!showForm)} className="bg-saffron hover:bg-saffron/90 h-9"><Plus className="w-4 h-4" /> New Campaign</Button>
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder="Campaign Name" value={form.campaign_name} onChange={e => setForm({ ...form, campaign_name: e.target.value })} className="h-10 px-3 rounded-xl border border-border bg-background text-sm" />
            <select value={form.campaign_type} onChange={e => setForm({ ...form, campaign_type: e.target.value })} className="h-10 px-3 rounded-xl border border-border bg-background text-sm">
              {campaignTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
            </select>
            <select value={form.target_audience} onChange={e => setForm({ ...form, target_audience: e.target.value })} className="h-10 px-3 rounded-xl border border-border bg-background text-sm">
              {audiences.map(a => <option key={a} value={a}>{a.replace(/_/g, " ")}</option>)}
            </select>
            <input placeholder="Festival Name (optional)" value={form.festival_name} onChange={e => setForm({ ...form, festival_name: e.target.value })} className="h-10 px-3 rounded-xl border border-border bg-background text-sm" />
            <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="h-10 px-3 rounded-xl border border-border bg-background text-sm" />
            <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="h-10 px-3 rounded-xl border border-border bg-background text-sm" />
            <input type="number" placeholder="Budget (Rs)" value={form.budget} onChange={e => setForm({ ...form, budget: +e.target.value })} className="h-10 px-3 rounded-xl border border-border bg-background text-sm" />
            <input type="number" placeholder="Discount Value (%)" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: +e.target.value })} className="h-10 px-3 rounded-xl border border-border bg-background text-sm" />
            <input placeholder="Coupon Code" value={form.coupon_code} onChange={e => setForm({ ...form, coupon_code: e.target.value })} className="h-10 px-3 rounded-xl border border-border bg-background text-sm" />
            {form.target_audience === "specific_area" && <input placeholder="Target Area" value={form.target_area} onChange={e => setForm({ ...form, target_area: e.target.value })} className="h-10 px-3 rounded-xl border border-border bg-background text-sm" />}
          </div>
          <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" rows={2} />
          <div className="flex gap-2">
            <Button onClick={createCampaign} className="bg-saffron hover:bg-saffron/90 flex-1">Create Campaign</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {campaigns.length === 0 ? (
        <div className="text-center py-12"><Megaphone className="w-12 h-12 text-foreground/20 mx-auto mb-2" /><p className="text-sm text-foreground/40">No campaigns yet.</p></div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => (
            <div key={c.id} className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display font-bold text-foreground">{c.campaign_name}</h3>
                    <span className={"text-[9px] font-bold px-2 py-0.5 rounded-full capitalize " + (statusColors[c.status] || "bg-muted")}>{c.status}</span>
                  </div>
                  <p className="text-xs text-foreground/40 capitalize">{c.campaign_type?.replace(/_/g, " ")} • {c.target_audience?.replace(/_/g, " ")}{c.festival_name ? ` • ${c.festival_name}` : ""}</p>
                </div>
                <div className="flex gap-1">
                  {c.status === "draft" && <button onClick={() => updateStatus(c.id, "active")} className="p-2 rounded-lg bg-terai/10 text-terai hover:bg-terai/20" title="Activate"><Play className="w-4 h-4" /></button>}
                  {c.status === "active" && <button onClick={() => updateStatus(c.id, "paused")} className="p-2 rounded-lg bg-amber-50 text-amber-500 hover:bg-amber-100 dark:bg-amber-500/10" title="Pause"><Pause className="w-4 h-4" /></button>}
                  {(c.status === "active" || c.status === "paused") && <button onClick={() => updateStatus(c.id, "completed")} className="p-2 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 dark:bg-blue-500/10" title="Complete"><CheckCircle className="w-4 h-4" /></button>}
                  <button onClick={() => base44.entities.Campaign.delete(c.id).then(load)} className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-500/10" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[{ label: "Views", value: c.total_views || 0, icon: Eye }, { label: "Clicks", value: c.total_clicks || 0, icon: MousePointerClick }, { label: "Orders", value: c.orders_generated || 0, icon: ShoppingCart }, { label: "Revenue", value: "Rs " + (c.revenue_generated || 0).toLocaleString(), icon: DollarSign }].map(m => (
                  <div key={m.label} className="text-center p-2 rounded-lg bg-muted/50">
                    <p className="text-sm font-bold text-foreground">{m.value}</p>
                    <p className="text-[10px] text-foreground/40">{m.label}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-foreground/40">
                <span>{c.start_date} → {c.end_date}</span>
                {c.budget > 0 && <span>Budget: Rs {c.budget.toLocaleString()}</span>}
                {c.coupon_code && <span className="font-mono font-bold text-saffron">{c.coupon_code}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}