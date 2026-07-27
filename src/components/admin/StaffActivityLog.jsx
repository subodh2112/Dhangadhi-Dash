import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { usePermissions } from "@/lib/permissions";
import { ScrollText, Search, Loader2, Shield } from "lucide-react";

const MODULE_LABELS = {
  users: "Users",
  merchants: "Merchants",
  riders: "Riders",
  orders: "Orders",
  payments: "Payments",
  finance: "Finance",
  marketing: "Marketing",
  operations: "Operations",
  support: "Support",
  settings: "Settings",
  staff: "Staff",
  security: "Security",
  analytics: "Analytics",
  system: "System",
};

const SEVERITY_STYLES = {
  info: "bg-blue-50 text-blue-600 border-blue-100",
  warning: "bg-amber-50 text-amber-600 border-amber-100",
  critical: "bg-red-50 text-red-600 border-red-100",
};

export default function StaffActivityLog() {
  const { isSuperAdmin, staffRoleName } = usePermissions();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setLoading(true);
    try {
      const data = await base44.entities.AdminActivityLog.list("-created_date", 100);
      setLogs(data);
    } catch (err) {
      // If entity is empty or error, show empty state
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = logs.filter((log) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (log.action || "").toLowerCase().includes(q) ||
      (log.staff_name || "").toLowerCase().includes(q) ||
      (log.details || "").toLowerCase().includes(q);
    const matchesModule = moduleFilter === "all" || log.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  const modulesPresent = [...new Set(logs.map((l) => l.module))].filter(Boolean);

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="font-display font-bold text-xl text-foreground mb-2">Super Admin Only</h3>
        <p className="text-foreground/50 max-w-sm">Only Super Admin can view staff activity logs. Your role: {staffRoleName}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-extrabold text-xl text-foreground flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-saffron" /> Staff Activity Log
        </h2>
        <p className="text-foreground/50 text-sm mt-1">Track every action performed by staff members across the platform.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by action, staff name, or details..." className="pl-10" />
        </div>
        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="h-10 px-3 rounded-lg border border-input bg-background text-sm font-medium"
        >
          <option value="all">All Modules</option>
          {modulesPresent.map((m) => (
            <option key={m} value={m}>{MODULE_LABELS[m] || m}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-saffron animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-foreground/40">
          <ScrollText className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>No activity logs found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((log) => (
            <div key={log.id} className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-saffron/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Shield className="w-4 h-4 text-saffron" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <p className="font-medium text-sm text-foreground">{log.action}</p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="outline" className="text-[10px]">{MODULE_LABELS[log.module] || log.module}</Badge>
                    {log.severity !== "info" && (
                      <Badge className={`text-[10px] border ${SEVERITY_STYLES[log.severity]}`}>{log.severity}</Badge>
                    )}
                  </div>
                </div>
                {log.details && <p className="text-xs text-foreground/50 mt-1">{log.details}</p>}
                <div className="flex items-center gap-2 mt-2 text-xs text-foreground/40">
                  <span className="font-medium text-foreground/60">{log.staff_name || "Unknown"}</span>
                  {log.staff_role && <span>·</span>}
                  {log.staff_role && <span>{log.staff_role}</span>}
                  {log.timestamp && <span>·</span>}
                  {log.timestamp && <span>{new Date(log.timestamp).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}