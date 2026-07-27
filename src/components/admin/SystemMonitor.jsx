import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Activity, AlertTriangle, AlertCircle, Info, RefreshCw, CheckCircle, XCircle, TrendingDown, Clock } from "lucide-react";

const severityColors = {
  low: "bg-muted text-foreground/50",
  medium: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400",
  high: "bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400",
  critical: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
};

const typeIcons = { info: Info, warning: AlertTriangle, error: AlertCircle, critical: AlertCircle, business: TrendingDown };

export default function SystemMonitor() {
  const [logs, setLogs] = useState([]);
  const [crashes, setCrashes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [businessMetrics, setBusinessMetrics] = useState({ failedOrders: 0, paymentFailures: 0, deliveryDelays: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sysLogs, crashReports, orders, payments] = await Promise.all([
        base44.entities.SystemLog.filter({}, "-created_date", 100).catch(() => []),
        base44.entities.CrashReport.filter({}, "-created_date", 20).catch(() => []),
        base44.entities.Order.filter({ status: "rejected" }, "-created_date", 50).catch(() => []),
        base44.entities.Payment.filter({ payment_status: "failed" }, "-created_date", 50).catch(() => []),
      ]);
      setLogs(sysLogs);
      setCrashes(crashReports);
      setBusinessMetrics({
        failedOrders: orders.length,
        paymentFailures: payments.length,
        deliveryDelays: sysLogs.filter(l => l.event_type === "business" && l.action?.includes("delivery_delay")).length,
      });
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateLogStatus = async (id, status) => { await base44.entities.SystemLog.update(id, { status }); load(); };

  const filtered = filter === "all" ? logs : logs.filter(l => l.event_type === filter);
  const stats = {
    total: logs.length,
    errors: logs.filter(l => l.event_type === "error" || l.event_type === "critical").length,
    warnings: logs.filter(l => l.event_type === "warning").length,
    crashes: crashes.length,
    newIssues: logs.filter(l => l.status === "new").length + crashes.filter(c => c.status === "new").length,
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  const systemHealth = stats.errors === 0 && stats.crashes === 0 ? "healthy" : stats.critical > 0 ? "critical" : "degraded";
  const healthColor = systemHealth === "healthy" ? "bg-terai" : systemHealth === "degraded" ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Activity className="w-6 h-6 text-saffron" /><div><h2 className="font-display font-bold text-lg text-foreground">System Monitor</h2><p className="text-xs text-foreground/50">Real-time system health and monitoring</p></div></div>
        <button onClick={load} className="p-2 rounded-lg bg-muted text-foreground/50 hover:text-saffron"><RefreshCw className="w-4 h-4" /></button>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full ${healthColor} animate-pulse`} />
          <div>
            <p className="font-display font-bold text-sm text-foreground capitalize">System Status: {systemHealth}</p>
            <p className="text-xs text-foreground/40">{stats.newIssues} new issues need attention</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[{ label: "Total Events", value: stats.total, icon: Activity, color: "bg-blue-50 text-blue-500 dark:bg-blue-500/10" }, { label: "Errors", value: stats.errors, icon: AlertCircle, color: "bg-red-50 text-red-500 dark:bg-red-500/10" }, { label: "Warnings", value: stats.warnings, icon: AlertTriangle, color: "bg-amber-50 text-amber-500 dark:bg-amber-500/10" }, { label: "Crashes", value: stats.crashes, icon: XCircle, color: "bg-orange-50 text-orange-500 dark:bg-orange-500/10" }, { label: "New Issues", value: stats.newIssues, icon: Clock, color: "bg-purple-50 text-purple-500 dark:bg-purple-500/10" }].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
            <div className={"w-9 h-9 rounded-lg flex items-center justify-center mb-2 " + s.color}><s.icon className="w-4 h-4" /></div>
            <p className="text-2xl font-display font-extrabold text-foreground">{s.value}</p>
            <p className="text-xs text-foreground/40">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-display font-bold text-sm text-foreground mb-3">Business Metrics</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-xl bg-muted/50"><p className="text-lg font-bold text-red-500">{businessMetrics.failedOrders}</p><p className="text-[10px] text-foreground/40">Failed Orders</p></div>
          <div className="text-center p-3 rounded-xl bg-muted/50"><p className="text-lg font-bold text-red-500">{businessMetrics.paymentFailures}</p><p className="text-[10px] text-foreground/40">Payment Failures</p></div>
          <div className="text-center p-3 rounded-xl bg-muted/50"><p className="text-lg font-bold text-amber-500">{businessMetrics.deliveryDelays}</p><p className="text-[10px] text-foreground/40">Delivery Delays</p></div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", "info", "warning", "error", "critical", "business"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${filter === f ? "bg-saffron text-white" : "bg-muted text-foreground/50"}`}>{f}</button>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-display font-bold text-sm text-foreground mb-3">Recent System Logs</h3>
        {filtered.length === 0 ? (
          <p className="text-sm text-foreground/40 text-center py-4">No logs found.</p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filtered.slice(0, 30).map(log => {
              const Icon = typeIcons[log.event_type] || Info;
              return (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${severityColors[log.severity] || "bg-muted"}`}><Icon className="w-4 h-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground">{log.action}</p>
                      <span className={"text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize " + (severityColors[log.severity] || "bg-muted")}>{log.severity}</span>
                      {log.status === "new" && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-500 dark:bg-blue-500/10">New</span>}
                    </div>
                    {log.details && <p className="text-xs text-foreground/50 mt-0.5 break-all line-clamp-2">{log.details}</p>}
                    <p className="text-[10px] text-foreground/30 mt-0.5">{log.timestamp ? new Date(log.timestamp).toLocaleString() : new Date(log.created_date).toLocaleString()}</p>
                  </div>
                  {log.status === "new" && <button onClick={() => updateLogStatus(log.id, "acknowledged")} className="p-1.5 rounded-lg bg-terai/10 text-terai hover:bg-terai/20" title="Acknowledge"><CheckCircle className="w-3.5 h-3.5" /></button>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {crashes.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-display font-bold text-sm text-foreground mb-3">Recent Crashes</h3>
          <div className="space-y-2">
            {crashes.slice(0, 10).map(crash => (
              <div key={crash.id} className="p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-bold text-red-600 dark:text-red-400 line-clamp-1">{crash.error_message}</p>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/10 text-red-500 capitalize flex-shrink-0">{crash.status}</span>
                </div>
                {crash.url && <p className="text-[10px] text-foreground/40 font-mono truncate">{crash.url}</p>}
                <p className="text-[10px] text-foreground/30">{new Date(crash.created_date).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}