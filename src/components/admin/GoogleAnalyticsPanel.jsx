import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Activity, TrendingUp, Eye, Users, RefreshCw, Globe, AlertCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { base44 } from "@/api/base44Client";

export default function GoogleAnalyticsPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await base44.functions.invoke('google_analytics_data', {});
      if (response.data?.error) {
        setError(response.data.error);
      } else {
        setData(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr.length !== 8) return dateStr;
    const day = dateStr.substring(6, 8);
    const month = dateStr.substring(4, 6);
    return `${day}/${month}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />)}
        </div>
        <div className="h-64 rounded-3xl bg-muted animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-3xl border border-border p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="font-display font-bold text-lg text-foreground mb-2">Analytics Connection Issue</h3>
        <p className="text-sm text-foreground/50 mb-6 max-w-md mx-auto">{error}</p>
        <button onClick={fetchData} className="inline-flex items-center gap-2 px-4 py-2 bg-saffron text-white rounded-xl text-sm font-bold hover:bg-saffron/90 transition-colors">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const trendData = (data.trends || []).map(row => ({
    ...row,
    dateLabel: formatDate(row.date)
  }));

  const totalSessions = trendData.reduce((sum, d) => sum + d.sessions, 0);
  const totalUsers = trendData.reduce((sum, d) => sum + d.users, 0);
  const totalPageViews = trendData.reduce((sum, d) => sum + d.pageViews, 0);

  const stats = [
    { label: "Active Users Now", value: data.realtime?.activeUsers || 0, icon: Activity, color: "bg-saffron/10 text-saffron" },
    { label: "7-Day Sessions", value: totalSessions, icon: TrendingUp, color: "bg-terai/10 text-terai" },
    { label: "7-Day Users", value: totalUsers, icon: Users, color: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400" },
    { label: "7-Day Page Views", value: totalPageViews, icon: Eye, color: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400" },
  ];

  const hasRealtimeError = data.errors?.realtime;
  const hasTrendsError = data.errors?.trends;
  const hasPagesError = data.errors?.pages;
  const hasSourcesError = data.errors?.sources;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-lg text-foreground">Google Analytics</h2>
          <p className="text-xs text-foreground/40">{data.property?.name || 'Connected Property'}</p>
        </div>
        <button onClick={fetchData} className="inline-flex items-center gap-2 px-3 py-2 bg-muted text-foreground/70 rounded-xl text-sm font-medium hover:text-foreground transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-2xl border border-border p-5">
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-display font-extrabold text-foreground">{stat.value.toLocaleString()}</p>
              <p className="text-xs text-foreground/40 font-medium">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Traffic Trend Chart */}
      <div className="bg-card rounded-3xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-base text-foreground">Traffic Trend (Last 7 Days)</h3>
          {hasTrendsError && <span className="text-xs text-red-500">Partial data</span>}
        </div>
        {trendData.length === 0 ? (
          <p className="text-sm text-foreground/40 text-center py-8">No traffic data available for this period.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 90%)" className="dark:opacity-10" />
              <XAxis dataKey="dateLabel" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", background: "hsl(0 0% 100%)", color: "hsl(0 0% 7%)" }} />
              <Line type="monotone" dataKey="sessions" name="Sessions" stroke="hsl(13, 100%, 50%)" strokeWidth={3} dot={{ fill: "hsl(13, 100%, 50%)", r: 4 }} />
              <Line type="monotone" dataKey="users" name="Users" stroke="hsl(149, 100%, 27%)" strokeWidth={3} dot={{ fill: "hsl(149, 100%, 27%)", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Pages (Popular Items) */}
        <div className="bg-card rounded-3xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-base text-foreground">Popular Pages</h3>
            {hasPagesError && <span className="text-xs text-red-500">Partial data</span>}
          </div>
          {(data.topPages || []).length === 0 ? (
            <p className="text-sm text-foreground/40 text-center py-8">No page view data available yet.</p>
          ) : (
            <div className="space-y-3">
              {data.topPages.map((page, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-saffron/10 text-saffron text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{page.dimensions[0] || 'Unknown Page'}</p>
                    <p className="text-xs text-foreground/40 truncate">{page.dimensions[1]}</p>
                  </div>
                  <span className="text-sm font-bold text-saffron flex-shrink-0">{parseInt(page.metrics[0]).toLocaleString()} views</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Traffic Sources */}
        <div className="bg-card rounded-3xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-base text-foreground">Traffic Sources</h3>
            {hasSourcesError && <span className="text-xs text-red-500">Partial data</span>}
          </div>
          {(data.trafficSources || []).length === 0 ? (
            <p className="text-sm text-foreground/40 text-center py-8">No traffic source data available yet.</p>
          ) : (
            <div className="space-y-3">
              {data.trafficSources.map((source, i) => {
                const sessions = parseInt(source.metrics[0]);
                const maxSessions = parseInt(data.trafficSources[0].metrics[0]);
                const pct = maxSessions > 0 ? (sessions / maxSessions) * 100 : 0;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-foreground/40 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-foreground truncate">{source.dimensions[0]}</span>
                        <span className="text-xs font-bold text-foreground/60">{sessions.toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-terai rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Real-time Top Pages */}
      {hasRealtimeError === null && (data.realtime?.topPages || []).length > 0 && (
        <div className="bg-card rounded-3xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-saffron opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-saffron"></span>
            </span>
            <h3 className="font-display font-bold text-base text-foreground">Live Active Pages</h3>
          </div>
          <div className="space-y-2">
            {data.realtime.topPages.map((page, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm font-medium text-foreground truncate">{page.dimensions[0] || 'Unknown'}</span>
                <span className="text-sm font-bold text-saffron flex-shrink-0 ml-2">{page.metrics[0]} active</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}