import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, DollarSign, TrendingUp, Percent, Truck, Megaphone, Crown, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const COLORS = ["#FF6B00", "#00A862", "#3B82F6", "#A855F7", "#F59E0B"];

export default function RevenueDashboard() {
  const [orders, setOrders] = useState([]);
  const [ads, setAds] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [o, a, c] = await Promise.all([
        base44.entities.Order.filter({ status: "delivered" }, "-created_date", 500).catch(() => []),
        base44.entities.Advertisement.filter({ status: "active" }, "-created_date", 100).catch(() => []),
        base44.entities.Campaign.filter({}, "-created_date", 100).catch(() => []),
      ]);
      setOrders(o); setAds(a); setCampaigns(c);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  const commissionRevenue = orders.reduce((s, o) => s + ((o.subtotal || o.total_amount || 0) * 0.10), 0);
  const deliveryFeeRevenue = orders.reduce((s, o) => s + (o.delivery_fee || 0), 0);
  const adRevenue = ads.reduce((s, a) => s + (a.cost || 0), 0);
  const totalRevenue = commissionRevenue + deliveryFeeRevenue + adRevenue;

  const revenueBySource = [
    { name: "Commission", value: Math.round(commissionRevenue), color: COLORS[0] },
    { name: "Delivery Fees", value: Math.round(deliveryFeeRevenue), color: COLORS[1] },
    { name: "Advertisements", value: Math.round(adRevenue), color: COLORS[2] },
  ].filter(d => d.value > 0);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const dayOrders = orders.filter(o => { const od = new Date(o.delivered_time || o.created_date); return od.toDateString() === d.toDateString(); });
    return {
      day: d.toLocaleDateString("en", { weekday: "short" }),
      revenue: dayOrders.reduce((s, o) => s + ((o.subtotal || o.total_amount || 0) * 0.10) + (o.delivery_fee || 0), 0),
      orders: dayOrders.length,
    };
  });

  const topCampaigns = [...campaigns].sort((a, b) => (b.revenue_generated || 0) - (a.revenue_generated || 0)).slice(0, 5);
  const avgOrderValue = orders.length > 0 ? orders.reduce((s, o) => s + (o.total_amount || 0), 0) / orders.length : 0;
  const forecast = totalRevenue * 1.15;

  return (
    <div className="space-y-6">
      <h2 className="font-display font-bold text-lg text-foreground">Revenue Optimization</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{ label: "Total Revenue", value: "Rs " + Math.round(totalRevenue).toLocaleString(), icon: DollarSign, color: "bg-terai/10 text-terai" }, { label: "Commission (10%)", value: "Rs " + Math.round(commissionRevenue).toLocaleString(), icon: Percent, color: "bg-saffron/10 text-saffron" }, { label: "Delivery Fees", value: "Rs " + Math.round(deliveryFeeRevenue).toLocaleString(), icon: Truck, color: "bg-blue-50 text-blue-500 dark:bg-blue-500/10" }, { label: "Ad Revenue", value: "Rs " + Math.round(adRevenue).toLocaleString(), icon: Megaphone, color: "bg-purple-50 text-purple-500 dark:bg-purple-500/10" }].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
            <div className={"w-9 h-9 rounded-lg flex items-center justify-center mb-2 " + s.color}><s.icon className="w-4 h-4" /></div>
            <p className="text-lg font-display font-extrabold text-foreground">{s.value}</p>
            <p className="text-xs text-foreground/40">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-display font-bold text-sm text-foreground mb-3">Revenue Breakdown</h3>
          {revenueBySource.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={revenueBySource} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                    {revenueBySource.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {revenueBySource.map(d => (
                  <div key={d.name} className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} /><span className="text-xs text-foreground/60">{d.name}</span><span className="text-xs font-bold text-foreground">Rs {d.value.toLocaleString()}</span></div>
                ))}
              </div>
            </div>
          ) : <p className="text-sm text-foreground/40 text-center py-8">No revenue data yet.</p>}
        </div>

        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-display font-bold text-sm text-foreground mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-saffron" /> 7-Day Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={last7Days}>
              <XAxis dataKey="day" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#FF6B00" strokeWidth={2} dot={{ fill: "#FF6B00" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-display font-bold text-sm text-foreground mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-saffron" /> Daily Orders (7 days)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={last7Days}>
              <XAxis dataKey="day" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="orders" fill="#00A862" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-display font-bold text-sm text-foreground mb-3 flex items-center gap-2"><Crown className="w-4 h-4 text-saffron" /> Revenue Insights</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
              <span className="text-xs text-foreground/60">Avg Order Value</span>
              <span className="text-sm font-bold text-foreground">Rs {avgOrderValue.toFixed(0)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
              <span className="text-xs text-foreground/60">Total Delivered Orders</span>
              <span className="text-sm font-bold text-foreground">{orders.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-terai/5">
              <span className="text-xs text-terai font-bold">Forecasted Next Month (+15%)</span>
              <span className="text-sm font-bold text-terai">Rs {Math.round(forecast).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-saffron/5">
              <span className="text-xs text-saffron font-bold">Active Campaigns</span>
              <span className="text-sm font-bold text-saffron">{campaigns.filter(c => c.status === "active").length}</span>
            </div>
          </div>
        </div>
      </div>

      {topCampaigns.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-display font-bold text-sm text-foreground mb-3">Top Campaigns by ROI</h3>
          <div className="space-y-2">
            {topCampaigns.map(c => {
              const roi = c.budget > 0 ? (((c.revenue_generated || 0) - c.budget) / c.budget * 100).toFixed(0) : "∞";
              return (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                  <div><p className="text-sm font-bold text-foreground">{c.campaign_name}</p><p className="text-[10px] text-foreground/40 capitalize">{c.campaign_type?.replace(/_/g, " ")}</p></div>
                  <div className="text-right"><p className="text-sm font-bold text-terai">Rs {(c.revenue_generated || 0).toLocaleString()}</p><p className="text-[10px] text-foreground/40">ROI: {roi}%</p></div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}