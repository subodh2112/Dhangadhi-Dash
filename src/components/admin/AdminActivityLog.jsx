import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Activity, Filter } from "lucide-react";

export default function AdminActivityLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await base44.entities.AuditLog.list("-created_date", 100);
      setLogs(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  const filtered = logs.filter(l => !search || l.action?.toLowerCase().includes(search.toLowerCase()) || l.target_name?.toLowerCase().includes(search.toLowerCase()) || l.details?.toLowerCase().includes(search.toLowerCase()));

  const actionColors = { "Suspended": "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400", "Reactivated": "bg-terai/10 text-terai", "Approved": "bg-terai/10 text-terai", "Rejected": "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400", "Updated": "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400", "Created": "bg-saffron/10 text-saffron", "Changed": "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400" };

  const getColor = (action) => {
    const key = Object.keys(actionColors).find(k => action?.startsWith(k));
    return key ? actionColors[key] : "bg-muted text-foreground/50";
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Filter className="absolute left-3 top-3 w-4 h-4 text-foreground/40" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search activity logs..." className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12"><Activity className="w-10 h-10 text-foreground/20 mx-auto mb-2" /><p className="text-sm text-foreground/40">No activity logs found.</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.map(log => (
            <div key={log.id} className="bg-card rounded-2xl border border-border p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0"><Activity className="w-4 h-4 text-foreground/40" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={"text-[9px] font-bold px-2 py-0.5 rounded-full " + getColor(log.action)}>{log.action}</span>
                  <span className="text-xs text-foreground/40">{log.target_type}</span>
                </div>
                <p className="text-sm font-semibold text-foreground">{log.target_name || "—"}</p>
                {log.details && <p className="text-xs text-foreground/50 truncate">{log.details}</p>}
                <p className="text-[10px] text-foreground/30 mt-1">{new Date(log.created_date).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}