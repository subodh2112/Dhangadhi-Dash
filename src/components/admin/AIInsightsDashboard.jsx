import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Brain, TrendingUp, Lightbulb, Clock, MapPin, Bike, Sparkles, RefreshCw } from "lucide-react";
import { getBusinessInsights, predictDemand } from "@/lib/aiEngine";

export default function AIInsightsDashboard() {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState(null);
  const [demand, setDemand] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [orders, riders, stores] = await Promise.all([
        base44.entities.Order.filter({ status: "delivered" }, "-created_date", 100).catch(() => []),
        base44.entities.Rider.filter({ status: "available" }, "-created_date", 50).catch(() => []),
        base44.entities.Store.filter({ is_open: true }, "-created_date", 50).catch(() => []),
      ]);
      const revenue = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
      const [bizInsights, demandPred] = await Promise.all([
        getBusinessInsights(orders, revenue, riders, stores),
        predictDemand(orders, riders),
      ]);
      setInsights(bizInsights);
      setDemand(demandPred);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <Loader2 className="w-8 h-8 text-saffron animate-spin" />
      <p className="text-sm text-foreground/50">AI is analyzing platform data...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Brain className="w-6 h-6 text-saffron" /><div><h2 className="font-display font-bold text-lg text-foreground">AI Business Intelligence</h2><p className="text-xs text-foreground/50">AI-powered insights and predictions</p></div></div>
        <button onClick={load} className="p-2 rounded-lg bg-muted text-foreground/50 hover:text-saffron"><RefreshCw className="w-4 h-4" /></button>
      </div>

      {insights && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-terai" /><h3 className="font-bold text-sm text-foreground">Growth Prediction</h3></div>
            <p className="text-sm text-foreground/60">{insights.growth_prediction}</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center gap-2 mb-2"><Sparkles className="w-4 h-4 text-saffron" /><h3 className="font-bold text-sm text-foreground">Revenue Forecast</h3></div>
            <p className="text-sm text-foreground/60">{insights.revenue_forecast}</p>
          </div>
        </div>
      )}

      {demand && (
        <>
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center gap-2 mb-3"><Clock className="w-4 h-4 text-saffron" /><h3 className="font-bold text-sm text-foreground">Demand Forecast</h3></div>
            <p className="text-sm text-foreground/60 mb-3">{demand.forecast_summary}</p>
            <div className="flex gap-1 items-end h-24">
              {demand.busy_hours?.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-full rounded-t transition-all ${h.expected_demand === "high" ? "bg-red-500 h-full" : h.expected_demand === "medium" ? "bg-amber-500 h-2/3" : "bg-terai h-1/3"}`} />
                  <span className="text-[8px] text-foreground/40">{h.hour}:00</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-2 text-[10px]">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-terai" /> Low</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> Medium</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> High</span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center gap-2 mb-2"><MapPin className="w-4 h-4 text-blue-500" /><h3 className="font-bold text-sm text-foreground">Popular Areas</h3></div>
              <div className="flex flex-wrap gap-2">{demand.popular_areas?.map((a, i) => <span key={i} className="text-xs bg-muted px-2.5 py-1 rounded-full text-foreground/60">{a}</span>)}</div>
            </div>
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center gap-2 mb-2"><Bike className="w-4 h-4 text-terai" /><h3 className="font-bold text-sm text-foreground">Rider Recommendation</h3></div>
              <p className="text-sm text-foreground/60">{demand.rider_recommendation}</p>
            </div>
          </div>
        </>
      )}

      {insights && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="font-bold text-sm text-foreground mb-3">Customer Trends</h3>
            <ul className="space-y-2">{insights.customer_trends?.map((t, i) => <li key={i} className="text-sm text-foreground/60 flex items-start gap-2"><span className="text-saffron mt-0.5">•</span>{t}</li>)}</ul>
          </div>
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center gap-2 mb-3"><Lightbulb className="w-4 h-4 text-saffron" /><h3 className="font-bold text-sm text-foreground">AI Recommendations</h3></div>
            <ul className="space-y-2">{insights.recommendations?.map((r, i) => <li key={i} className="text-sm text-foreground/60 flex items-start gap-2"><Sparkles className="w-3 h-3 text-saffron mt-1 flex-shrink-0" />{r}</li>)}</ul>
          </div>
        </div>
      )}

      {demand?.high_demand_stores?.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-bold text-sm text-foreground mb-3">High Demand Stores</h3>
          <div className="flex flex-wrap gap-2">{demand.high_demand_stores.map((s, i) => <span key={i} className="text-xs bg-saffron/10 text-saffron px-3 py-1.5 rounded-full font-bold">{s}</span>)}</div>
        </div>
      )}
    </div>
  );
}