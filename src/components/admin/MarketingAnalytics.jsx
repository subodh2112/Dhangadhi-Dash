import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Megaphone, Users, MousePointerClick, DollarSign, TrendingUp, Eye, Gift } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#FF6B00", "#00A862", "#3B82F6", "#A855F7", "#F59E0B"];

export default function MarketingAnalytics() {
  const [campaigns, setCampaigns] = useState([]);
  const [ads, setAds] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [influencers, setInfluencers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [c, a, r, i] = await Promise.all([
        base44.entities.Campaign.filter({}, "-created_date", 100).catch(() => []),
        base44.entities.Advertisement.filter({}, "-created_date", 100).catch(() => []),
        base44.entities.Referral.filter({}, "-created_date", 100).catch(() => []),
        base44.entities.Influencer.filter({}, "-created_date", 100).catch(() => []),
      ]);
      setCampaigns(c); setAds(a); setReferrals(r); setInfluencers(i);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  const totalViews = campaigns.reduce((s, c) => s + (c.total_views || 0), 0);
  const totalClicks = campaigns.reduce((s, c) => s + (c.total_clicks || 0), 0);
  const campaignRevenue = campaigns.reduce((s, c) => s + (c.revenue_generated || 0), 0);
  const campaignOrders = campaigns.reduce((s, c) => s + (c.orders_generated || 0), 0);
  const completedReferrals = referrals.filter(r => r.status === "rewarded" || r.status === "completed").length;
  const referralConversionRate = referrals.length > 0 ? ((completedReferrals / referrals.length) * 100).toFixed(1) : "0.0";
  const adImpressions = ads.reduce((s, a) => s + (a.impressions || 0), 0);
  const adClicks = ads.reduce((s, a) => s + (a.clicks || 0), 0);
  const adRevenue = ads.reduce((s, a) => s + (a.cost || 0), 0);
  const adCTR = adImpressions > 0 ? ((adClicks / adImpressions) * 100).toFixed(1) : "0.0";
  const infConversions = influencers.reduce((s, i) => s + (i.conversions || 0), 0);
  const infRevenue = influencers.reduce((s, i) => s + (i.total_revenue || 0), 0);

  const campaignTypeData = ["discount", "cashback", "free_delivery", "referral", "seasonal_offer"].map(type => ({
    name: type.replace(/_/g, " "),
    value: campaigns.filter(c => c.campaign_type === type).length,
  })).filter(d => d.value > 0);

  const topCampaigns = [...campaigns].sort((a, b) => (b.revenue_generated || 0) - (a.revenue_generated || 0)).slice(0, 5);

  return (
    <div className="space-y-6">
      <h2 className="font-display font-bold text-lg text-foreground">Marketing Analytics</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{ label: "Campaign Views", value: totalViews.toLocaleString(), icon: Eye, color: "bg-blue-50 text-blue-500 dark:bg-blue-500/10" }, { label: "Click-through Rate", value: totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) + "%" : "0%", icon: MousePointerClick, color: "bg-purple-50 text-purple-500 dark:bg-purple-500/10" }, { label: "Orders from Campaigns", value: campaignOrders, icon: TrendingUp, color: "bg-saffron/10 text-saffron" }, { label: "Campaign Revenue", value: "Rs " + campaignRevenue.toLocaleString(), icon: DollarSign, color: "bg-terai/10 text-terai" }].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
            <div className={"w-9 h-9 rounded-lg flex items-center justify-center mb-2 " + s.color}><s.icon className="w-4 h-4" /></div>
            <p className="text-xl font-display font-extrabold text-foreground">{s.value}</p>
            <p className="text-xs text-foreground/40">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-display font-bold text-sm text-foreground mb-3">Referral Performance</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-xl bg-muted/50"><Users className="w-5 h-5 text-blue-500 mx-auto mb-1" /><p className="text-lg font-bold text-foreground">{referrals.length}</p><p className="text-[10px] text-foreground/40">Total Referrals</p></div>
            <div className="text-center p-3 rounded-xl bg-muted/50"><Gift className="w-5 h-5 text-terai mx-auto mb-1" /><p className="text-lg font-bold text-foreground">{completedReferrals}</p><p className="text-[10px] text-foreground/40">Converted</p></div>
            <div className="text-center p-3 rounded-xl bg-muted/50"><TrendingUp className="w-5 h-5 text-saffron mx-auto mb-1" /><p className="text-lg font-bold text-foreground">{referralConversionRate}%</p><p className="text-[10px] text-foreground/40">Conv. Rate</p></div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-display font-bold text-sm text-foreground mb-3">Advertising Metrics</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-xl bg-muted/50"><Eye className="w-5 h-5 text-blue-500 mx-auto mb-1" /><p className="text-lg font-bold text-foreground">{adImpressions.toLocaleString()}</p><p className="text-[10px] text-foreground/40">Impressions</p></div>
            <div className="text-center p-3 rounded-xl bg-muted/50"><MousePointerClick className="w-5 h-5 text-purple-500 mx-auto mb-1" /><p className="text-lg font-bold text-foreground">{adCTR}%</p><p className="text-[10px] text-foreground/40">CTR</p></div>
            <div className="text-center p-3 rounded-xl bg-muted/50"><DollarSign className="w-5 h-5 text-terai mx-auto mb-1" /><p className="text-lg font-bold text-foreground">Rs {adRevenue.toLocaleString()}</p><p className="text-[10px] text-foreground/40">Ad Spend</p></div>
          </div>
        </div>
      </div>

      {campaignTypeData.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-display font-bold text-sm text-foreground mb-3">Campaign Distribution by Type</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie data={campaignTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                  {campaignTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {campaignTypeData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} /><span className="text-xs text-foreground/60 capitalize">{d.name}</span><span className="text-xs font-bold text-foreground">{d.value}</span></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {topCampaigns.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-display font-bold text-sm text-foreground mb-3">Top Campaigns by Revenue</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topCampaigns.map(c => ({ name: c.campaign_name?.slice(0, 12), revenue: c.revenue_generated || 0, orders: c.orders_generated || 0 }))}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="revenue" fill="#FF6B00" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {influencers.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-display font-bold text-sm text-foreground mb-3">Influencer Impact</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-xl bg-muted/50"><Users className="w-5 h-5 text-blue-500 mx-auto mb-1" /><p className="text-lg font-bold text-foreground">{infConversions}</p><p className="text-[10px] text-foreground/40">Conversions</p></div>
            <div className="text-center p-3 rounded-xl bg-muted/50"><DollarSign className="w-5 h-5 text-terai mx-auto mb-1" /><p className="text-lg font-bold text-foreground">Rs {infRevenue.toLocaleString()}</p><p className="text-[10px] text-foreground/40">Revenue</p></div>
            <div className="text-center p-3 rounded-xl bg-muted/50"><Megaphone className="w-5 h-5 text-saffron mx-auto mb-1" /><p className="text-lg font-bold text-foreground">{influencers.length}</p><p className="text-[10px] text-foreground/40">Influencers</p></div>
          </div>
        </div>
      )}
    </div>
  );
}