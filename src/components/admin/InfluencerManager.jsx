import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, Users, DollarSign, TrendingUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const platforms = ["instagram", "facebook", "tiktok", "youtube", "twitter", "other"];

export default function InfluencerManager() {
  const [influencers, setInfluencers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ influencer_name: "", platform: "instagram", referral_code: "", commission_percentage: 5, followers_count: 0, contact_number: "", email: "" });

  const load = useCallback(async () => {
    try { setInfluencers(await base44.entities.Influencer.filter({}, "-created_date", 100)); } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!form.influencer_name || !form.referral_code) return;
    await base44.entities.Influencer.create({ ...form, status: "active" });
    setForm({ influencer_name: "", platform: "instagram", referral_code: "", commission_percentage: 5, followers_count: 0, contact_number: "", email: "" });
    setShowForm(false);
    load();
  };

  const totalConversions = influencers.reduce((s, i) => s + (i.conversions || 0), 0);
  const totalRevenue = influencers.reduce((s, i) => s + (i.total_revenue || 0), 0);
  const totalEarnings = influencers.reduce((s, i) => s + (i.earnings || 0), 0);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[{ label: "Total Conversions", value: totalConversions, icon: Users, color: "bg-blue-50 text-blue-500 dark:bg-blue-500/10" }, { label: "Revenue Generated", value: "Rs " + totalRevenue.toLocaleString(), icon: DollarSign, color: "bg-terai/10 text-terai" }, { label: "Commission Paid", value: "Rs " + totalEarnings.toLocaleString(), icon: TrendingUp, color: "bg-purple-50 text-purple-500 dark:bg-purple-500/10" }].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
            <div className={"w-9 h-9 rounded-lg flex items-center justify-center mb-2 " + s.color}><s.icon className="w-4 h-4" /></div>
            <p className="text-lg font-display font-extrabold text-foreground">{s.value}</p>
            <p className="text-xs text-foreground/40">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-lg text-foreground">Influencers</h2>
        <Button onClick={() => setShowForm(!showForm)} className="bg-saffron hover:bg-saffron/90 h-9"><Plus className="w-4 h-4" /> Add Influencer</Button>
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder="Influencer Name" value={form.influencer_name} onChange={e => setForm({ ...form, influencer_name: e.target.value })} className="h-10 px-3 rounded-xl border border-border bg-background text-sm" />
            <select value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })} className="h-10 px-3 rounded-xl border border-border bg-background text-sm">{platforms.map(p => <option key={p} value={p}>{p}</option>)}</select>
            <input placeholder="Referral Code" value={form.referral_code} onChange={e => setForm({ ...form, referral_code: e.target.value.toUpperCase() })} className="h-10 px-3 rounded-xl border border-border bg-background text-sm font-mono" />
            <input type="number" placeholder="Commission %" value={form.commission_percentage} onChange={e => setForm({ ...form, commission_percentage: +e.target.value })} className="h-10 px-3 rounded-xl border border-border bg-background text-sm" />
            <input type="number" placeholder="Followers" value={form.followers_count} onChange={e => setForm({ ...form, followers_count: +e.target.value })} className="h-10 px-3 rounded-xl border border-border bg-background text-sm" />
            <input placeholder="Contact Number" value={form.contact_number} onChange={e => setForm({ ...form, contact_number: e.target.value })} className="h-10 px-3 rounded-xl border border-border bg-background text-sm" />
            <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="h-10 px-3 rounded-xl border border-border bg-background text-sm" />
          </div>
          <Button onClick={create} className="bg-saffron hover:bg-saffron/90 w-full">Add Influencer</Button>
        </div>
      )}

      {influencers.length === 0 ? (
        <div className="text-center py-12"><Users className="w-12 h-12 text-foreground/20 mx-auto mb-2" /><p className="text-sm text-foreground/40">No influencers yet.</p></div>
      ) : (
        <div className="space-y-3">
          {influencers.map(inf => (
            <div key={inf.id} className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-saffron/10 flex items-center justify-center text-saffron font-bold text-sm">{inf.influencer_name?.charAt(0)}</div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">{inf.influencer_name}</h3>
                    <p className="text-xs text-foreground/40 capitalize">{inf.platform} • {inf.followers_count?.toLocaleString() || 0} followers</p>
                    <span className="text-[10px] font-mono font-bold text-saffron bg-saffron/10 px-2 py-0.5 rounded-full">{inf.referral_code}</span>
                  </div>
                </div>
                <button onClick={() => base44.entities.Influencer.delete(inf.id).then(load)} className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-500/10"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-3">
                <div className="text-center p-2 rounded-lg bg-muted/50"><p className="text-sm font-bold">{inf.conversions || 0}</p><p className="text-[10px] text-foreground/40">Conversions</p></div>
                <div className="text-center p-2 rounded-lg bg-muted/50"><p className="text-sm font-bold">Rs {(inf.total_revenue || 0).toLocaleString()}</p><p className="text-[10px] text-foreground/40">Revenue</p></div>
                <div className="text-center p-2 rounded-lg bg-muted/50"><p className="text-sm font-bold">{inf.commission_percentage}%</p><p className="text-[10px] text-foreground/40">Commission</p></div>
                <div className="text-center p-2 rounded-lg bg-muted/50"><p className="text-sm font-bold">Rs {(inf.earnings || 0).toLocaleString()}</p><p className="text-[10px] text-foreground/40">Earned</p></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}