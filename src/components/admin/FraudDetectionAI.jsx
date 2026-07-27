import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, ShieldAlert, Brain, RefreshCw, AlertTriangle, CheckCircle, Ban, Search } from "lucide-react";
import { calculateFraudScore } from "@/lib/aiEngine";

const riskColors = {
  low: "bg-terai/10 text-terai",
  medium: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400",
  high: "bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400",
  critical: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
};

const statusColors = {
  clear: "bg-terai/10 text-terai",
  flagged: "bg-amber-50 text-amber-500 dark:bg-amber-500/10",
  investigating: "bg-blue-50 text-blue-500 dark:bg-blue-500/10",
  suspended: "bg-red-50 text-red-500 dark:bg-red-500/10",
};

export default function FraudDetectionAI() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try { setScores(await base44.entities.FraudScore.filter({}, "-fraud_score", 100)); } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const runScan = async (userId, userType, userName) => {
    setScanning(true);
    try {
      const entityMap = { customer: "Order", merchant: "Store", rider: "Rider" };
      const orders = await base44.entities[entityMap[userType]]?.filter({ created_by_id: userId }, "-created_date", 10).catch(() => []);
      const complaints = await base44.entities.Complaint.filter({ customer_id: userId }).catch(() => []);
      const refunds = await base44.entities.Refund.filter({ customer_id: userId }).catch(() => []);
      const result = await calculateFraudScore(userId, userType, { name: userName }, orders, complaints, refunds);
      const existing = scores.find(s => s.user_id === userId && s.user_type === userType);
      if (existing) {
        await base44.entities.FraudScore.update(existing.id, { fraud_score: result.fraud_score, risk_level: result.risk_level, factors: JSON.stringify(result.factors), recommendation: result.recommendation, status: result.risk_level === "critical" || result.risk_level === "high" ? "flagged" : "clear" });
      } else {
        await base44.entities.FraudScore.create({ user_id: userId, user_name: userName, user_type: userType, fraud_score: result.fraud_score, risk_level: result.risk_level, factors: JSON.stringify(result.factors), recommendation: result.recommendation, status: result.risk_level === "critical" || result.risk_level === "high" ? "flagged" : "clear" });
      }
      load();
    } catch {}
    setScanning(false);
  };

  const updateStatus = async (id, status) => { await base44.entities.FraudScore.update(id, { status }); load(); };

  const filtered = search ? scores.filter(s => s.user_name?.toLowerCase().includes(search.toLowerCase()) || s.user_id?.includes(search)) : scores;
  const stats = { total: scores.length, flagged: scores.filter(s => s.status === "flagged").length, suspended: scores.filter(s => s.status === "suspended").length, critical: scores.filter(s => s.risk_level === "critical").length };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Brain className="w-6 h-6 text-saffron" /><div><h2 className="font-display font-bold text-lg text-foreground">AI Fraud Detection</h2><p className="text-xs text-foreground/50">AI-powered fraud scoring and monitoring</p></div></div>
        <button onClick={load} className="p-2 rounded-lg bg-muted text-foreground/50 hover:text-saffron"><RefreshCw className="w-4 h-4" /></button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{ label: "Total Scanned", value: stats.total, icon: ShieldAlert, color: "bg-blue-50 text-blue-500 dark:bg-blue-500/10" }, { label: "Flagged", value: stats.flagged, icon: AlertTriangle, color: "bg-amber-50 text-amber-500 dark:bg-amber-500/10" }, { label: "Critical Risk", value: stats.critical, icon: ShieldAlert, color: "bg-orange-50 text-orange-500 dark:bg-orange-500/10" }, { label: "Suspended", value: stats.suspended, icon: Ban, color: "bg-red-50 text-red-500 dark:bg-red-500/10" }].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
            <div className={"w-9 h-9 rounded-lg flex items-center justify-center mb-2 " + s.color}><s.icon className="w-4 h-4" /></div>
            <p className="text-2xl font-display font-extrabold text-foreground">{s.value}</p>
            <p className="text-xs text-foreground/40">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or ID..." className="w-full h-10 pl-10 pr-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12"><ShieldAlert className="w-12 h-12 text-foreground/20 mx-auto mb-2" /><p className="text-sm text-foreground/40">No fraud scores yet. Run an AI scan on a user to generate scores.</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => {
            let factors = [];
            try { factors = JSON.parse(s.factors || "[]"); } catch {}
            return (
              <div key={s.id} className="bg-card rounded-2xl border border-border p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${s.fraud_score >= 70 ? "bg-red-50 text-red-500 dark:bg-red-500/10" : s.fraud_score >= 40 ? "bg-amber-50 text-amber-500 dark:bg-amber-500/10" : "bg-terai/10 text-terai"}`}>{s.fraud_score || 0}</div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground">{s.user_name || "Unknown"}</h3>
                      <p className="text-xs text-foreground/40 capitalize">{s.user_type} • ID: {s.user_id?.slice(-8)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={"text-[9px] font-bold px-2 py-0.5 rounded-full capitalize " + (riskColors[s.risk_level] || "bg-muted")}>{s.risk_level} risk</span>
                    <span className={"text-[9px] font-bold px-2 py-0.5 rounded-full capitalize " + (statusColors[s.status] || "bg-muted")}>{s.status}</span>
                  </div>
                </div>
                {factors.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">{factors.map((f, i) => <span key={i} className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-foreground/50">{f}</span>)}</div>
                )}
                {s.recommendation && <p className="text-xs text-foreground/50 mb-2 italic">{s.recommendation}</p>}
                <div className="flex gap-2">
                  <button onClick={() => runScan(s.user_id, s.user_type, s.user_name)} disabled={scanning} className="flex-1 h-8 rounded-lg bg-saffron text-white text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-40">{scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />} Re-scan</button>
                  {s.status === "flagged" && <button onClick={() => updateStatus(s.id, "suspended")} className="h-8 px-3 rounded-lg bg-red-500 text-white text-xs font-bold flex items-center gap-1"><Ban className="w-3.5 h-3.5" /> Suspend</button>}
                  {s.status !== "clear" && <button onClick={() => updateStatus(s.id, "clear")} className="h-8 px-3 rounded-lg bg-terai text-white text-xs font-bold flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Clear</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}