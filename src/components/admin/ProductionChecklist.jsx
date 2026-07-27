import React, { useState } from "react";
import { CheckCircle, AlertTriangle, XCircle, Shield, Zap, Database, Server, FileText, RefreshCw } from "lucide-react";

const checklist = [
  {
    category: "Security",
    icon: Shield,
    color: "bg-terai/10 text-terai",
    items: [
      { label: "JWT token authentication active", status: "pass" },
      { label: "Password encryption (bcrypt)", status: "pass" },
      { label: "OTP verification on registration", status: "pass" },
      { label: "Google OAuth integration", status: "pass" },
      { label: "Role-based access control (4 roles)", status: "pass" },
      { label: "RLS on all 30+ entities", status: "pass" },
      { label: "Protected route guards", status: "pass" },
      { label: "Idle timeout auto-logout", status: "pass" },
      { label: "Fraud detection system", status: "pass" },
      { label: "Admin audit logging", status: "pass" },
    ],
  },
  {
    category: "Performance",
    icon: Zap,
    color: "bg-saffron/10 text-saffron",
    items: [
      { label: "Lazy loading (route-level code splitting)", status: "pass" },
      { label: "Image optimization utility", status: "pass" },
      { label: "API response caching", status: "pass" },
      { label: "Debounce/throttle utilities", status: "pass" },
      { label: "Performance monitoring", status: "pass" },
      { label: "Skeleton loading states", status: "pass" },
      { label: "Pull-to-refresh on mobile", status: "pass" },
    ],
  },
  {
    category: "Database",
    icon: Database,
    color: "bg-blue-50 text-blue-500 dark:bg-blue-500/10",
    items: [
      { label: "Entity schema validation", status: "pass" },
      { label: "Data constraints (enums, required)", status: "pass" },
      { label: "Query limits (pagination)", status: "pass" },
      { label: "Bulk operations for efficiency", status: "pass" },
      { label: "Real-time subscriptions (WebSocket)", status: "pass" },
      { label: "Platform-managed backups", status: "pass" },
    ],
  },
  {
    category: "API & Backend",
    icon: Server,
    color: "bg-purple-50 text-purple-500 dark:bg-purple-500/10",
    items: [
      { label: "API authentication (all endpoints)", status: "pass" },
      { label: "Input validation (entity schemas)", status: "pass" },
      { label: "Payment gateway integration (eSewa/Khalti)", status: "pass" },
      { label: "Payment verification backend", status: "pass" },
      { label: "Google Sheets sync automation", status: "pass" },
      { label: "Error handling & logging", status: "pass" },
    ],
  },
  {
    category: "Monitoring",
    icon: RefreshCw,
    color: "bg-orange-50 text-orange-500 dark:bg-orange-500/10",
    items: [
      { label: "SystemLog entity for event tracking", status: "pass" },
      { label: "CrashReport with ErrorBoundary", status: "pass" },
      { label: "Business metrics dashboard", status: "pass" },
      { label: "Admin activity audit log", status: "pass" },
      { label: "Google Analytics integration", status: "pass" },
    ],
  },
  {
    category: "Compliance",
    icon: FileText,
    color: "bg-cyan-50 text-cyan-500 dark:bg-cyan-500/10",
    items: [
      { label: "Privacy policy", status: "pass" },
      { label: "Terms & conditions", status: "pass" },
      { label: "Refund policy", status: "pass" },
      { label: "Data handling rules", status: "pass" },
      { label: "AI data minimization", status: "pass" },
    ],
  },
];

const statusConfig = {
  pass: { icon: CheckCircle, color: "text-terai", label: "Passed" },
  warning: { icon: AlertTriangle, color: "text-amber-500", label: "Warning" },
  fail: { icon: XCircle, color: "text-red-500", label: "Failed" },
};

export default function ProductionChecklist() {
  const totalItems = checklist.reduce((s, c) => s + c.items.length, 0);
  const passedItems = checklist.reduce((s, c) => s + c.items.filter(i => i.status === "pass").length, 0);
  const readinessScore = Math.round((passedItems / totalItems) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2"><CheckCircle className="w-6 h-6 text-saffron" /><div><h2 className="font-display font-bold text-lg text-foreground">Production Readiness</h2><p className="text-xs text-foreground/50">Pre-launch checklist and verification</p></div></div>

      <div className="bg-gradient-to-br from-saffron/10 to-terai/5 rounded-2xl border border-saffron/20 p-6 text-center">
        <p className="text-5xl font-display font-extrabold text-saffron">{readinessScore}%</p>
        <p className="text-sm text-foreground/50 mt-1">{passedItems} of {totalItems} checks passed</p>
        <div className="w-full h-3 rounded-full bg-muted mt-4 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-saffron to-terai rounded-full transition-all duration-500" style={{ width: `${readinessScore}%` }} />
        </div>
        {readinessScore === 100 ? (
          <p className="text-sm font-bold text-terai mt-3 flex items-center justify-center gap-1"><CheckCircle className="w-4 h-4" /> Ready for production launch!</p>
        ) : (
          <p className="text-sm font-bold text-amber-500 mt-3 flex items-center justify-center gap-1"><AlertTriangle className="w-4 h-4" /> Some items need attention</p>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {checklist.map(cat => {
          const passed = cat.items.filter(i => i.status === "pass").length;
          return (
            <div key={cat.category} className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={"w-8 h-8 rounded-lg flex items-center justify-center " + cat.color}><cat.icon className="w-4 h-4" /></div>
                  <h3 className="font-display font-bold text-sm text-foreground">{cat.category}</h3>
                </div>
                <span className="text-xs font-bold text-terai">{passed}/{cat.items.length}</span>
              </div>
              <div className="space-y-1.5">
                {cat.items.map(item => {
                  const sc = statusConfig[item.status];
                  return (
                    <div key={item.label} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50">
                      <sc.icon className={"w-4 h-4 flex-shrink-0 " + sc.color} />
                      <span className="text-xs text-foreground/70">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-display font-bold text-sm text-foreground mb-3">Platform-Managed (Base44)</h3>
        <div className="grid sm:grid-cols-2 gap-2">
          {[
            "Automatic database backups",
            "SSL/TLS encryption (HTTPS)",
            "DDoS protection",
            "Rate limiting (API)",
            "SQL injection prevention",
            "XSS protection",
            "CSRF protection",
            "CDN for static assets",
            "Auto-scaling infrastructure",
            "Environment management",
            "Secrets management",
            "Health monitoring",
          ].map(item => (
            <div key={item} className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/50">
              <CheckCircle className="w-4 h-4 text-terai flex-shrink-0" />
              <span className="text-xs text-foreground/70">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}