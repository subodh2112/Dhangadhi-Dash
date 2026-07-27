import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { usePermissions, ROLE_DEFS, PERMISSION_CATALOG } from "@/lib/permissions";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Shield, Activity, Clock, CheckCircle2, ArrowRight, Loader2, Home as HomeIcon, Headphones, User } from "lucide-react";

const PERM_LABELS = {};
PERMISSION_CATALOG.forEach((cat) => {
  cat.permissions.forEach((p) => {
    PERM_LABELS[p.key] = { label: p.label, category: cat.category };
  });
});

const MODULE_COLORS = {
  users: "bg-blue-100 text-blue-700",
  merchants: "bg-purple-100 text-purple-700",
  riders: "bg-orange-100 text-orange-700",
  orders: "bg-saffron/10 text-saffron",
  payments: "bg-green-100 text-green-700",
  finance: "bg-emerald-100 text-emerald-700",
  marketing: "bg-pink-100 text-pink-700",
  operations: "bg-cyan-100 text-cyan-700",
  support: "bg-indigo-100 text-indigo-700",
  settings: "bg-gray-100 text-gray-700",
  staff: "bg-red-100 text-red-700",
  security: "bg-red-100 text-red-700",
  analytics: "bg-teal-100 text-teal-700",
  system: "bg-gray-100 text-gray-600",
};

export default function StaffDashboard() {
  const { user, staffRole, staffRoleName, permissions } = usePermissions();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [user?.id]);

  async function loadLogs() {
    if (!user?.id) return;
    try {
      const data = await base44.entities.AdminActivityLog.filter({ staff_id: user.id }, "-timestamp", 50);
      setLogs(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  const roleDef = ROLE_DEFS[staffRole];

  const permsByCategory = {};
  permissions.forEach((permKey) => {
    const info = PERM_LABELS[permKey];
    if (info) {
      if (!permsByCategory[info.category]) permsByCategory[info.category] = [];
      permsByCategory[info.category].push(info.label);
    }
  });

  const initials = (user?.full_name || user?.email || "S")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const today = new Date();
  const todayLogs = logs.filter((l) => {
    const logDate = new Date(l.timestamp || l.created_date);
    return logDate.toDateString() === today.toDateString();
  });

  const memberSince = user?.created_date ? new Date(user.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
  const lastActive = logs[0]?.timestamp ? new Date(logs[0].timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : memberSince;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 px-4 sm:px-6 pb-12 max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-saffron to-orange-600 rounded-3xl p-6 sm:p-8 text-white mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold truncate">{user?.full_name || "Staff Member"}</h1>
              <p className="text-white/80 text-sm truncate">{user?.email}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge className="bg-white/20 text-white border-0">{staffRoleName}</Badge>
                <Badge className="bg-white/20 text-white border-0 capitalize">{(roleDef?.department || "staff").replace(/_/g, " ")}</Badge>
                <Badge className="bg-white/20 text-white border-0">{user?.staff_status || "active"}</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Link to="/admin" className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-saffron/40 transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-saffron/10 flex items-center justify-center group-hover:bg-saffron/20 transition-colors">
              <Shield className="w-5 h-5 text-saffron" />
            </div>
            <span className="text-xs font-bold text-foreground">Admin Panel</span>
          </Link>
          {permissions.includes("support.view") && (
            <Link to="/support" className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-saffron/40 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                <Headphones className="w-5 h-5 text-indigo-600" />
              </div>
              <span className="text-xs font-bold text-foreground">Support</span>
            </Link>
          )}
          <Link to="/" className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-saffron/40 transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <HomeIcon className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-bold text-foreground">Home</span>
          </Link>
          <Link to="/profile" className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-saffron/40 transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-saffron/10 transition-colors">
              <User className="w-5 h-5 text-foreground/60" />
            </div>
            <span className="text-xs font-bold text-foreground">Profile</span>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-2xl font-extrabold text-saffron">{logs.length}</p>
            <p className="text-xs text-foreground/50 mt-1">Total Actions</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-2xl font-extrabold text-terai">{todayLogs.length}</p>
            <p className="text-xs text-foreground/50 mt-1">Today</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-2xl font-extrabold text-foreground">{Object.keys(permsByCategory).length}</p>
            <p className="text-xs text-foreground/50 mt-1">Access Areas</p>
          </div>
        </div>

        {/* Role Card */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-saffron" />
            <h2 className="font-display font-bold text-lg text-foreground">Your Role</h2>
          </div>
          <p className="text-sm text-foreground/60 mb-4">{roleDef?.description}</p>
          <div className="flex items-center gap-4 mb-5 text-xs text-foreground/50">
            <span>Member since: <span className="font-medium text-foreground/70">{memberSince}</span></span>
            <span>Last active: <span className="font-medium text-foreground/70">{lastActive}</span></span>
          </div>

          <h3 className="text-xs font-bold uppercase tracking-wide text-foreground/40 mb-3">Permissions ({permissions.length})</h3>
          {Object.keys(permsByCategory).length === 0 ? (
            <p className="text-sm text-foreground/40">No specific permissions assigned.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(permsByCategory).map(([category, perms]) => (
                <div key={category}>
                  <p className="text-xs font-bold text-foreground/50 mb-1.5">{category}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {perms.map((p) => (
                      <span key={p} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-saffron/5 text-foreground/70">
                        <CheckCircle2 className="w-3 h-3 text-terai" /> {p}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Log */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-saffron" /> Activity History
          </h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-saffron animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-foreground/40">
              <Activity className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No activity yet. Your actions in the admin panel will appear here.</p>
              <Link to="/admin" className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-saffron hover:underline">
                Go to Admin Panel <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {logs.map((log) => {
                const moduleColor = MODULE_COLORS[log.module] || MODULE_COLORS.system;
                const time = new Date(log.timestamp || log.created_date);
                const isRecent = (Date.now() - time.getTime()) < 3600000;
                return (
                  <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${log.severity === "warning" ? "bg-amber-500" : log.severity === "critical" ? "bg-red-500" : "bg-terai"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{log.action}</p>
                      {log.details && <p className="text-xs text-foreground/50 mt-0.5">{log.details}</p>}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${moduleColor}`}>{log.module}</span>
                        <span className="text-[10px] text-foreground/40 flex items-center gap-0.5">
                          <Clock className="w-3 h-3" /> {isRecent ? time.toLocaleTimeString() : time.toLocaleString()}
                        </span>
                        {log.severity !== "info" && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${log.severity === "critical" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                            {log.severity}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}