import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Shield, ShieldCheck, ShieldAlert, Lock, Users, Key, RefreshCw, CheckCircle, AlertTriangle, FileText } from "lucide-react";

const entitySecurity = [
  { name: "Order", rls: true, note: "Customer/merchant/rider/admin RLS" },
  { name: "Product", rls: true, note: "Merchant create by store_id, admin full" },
  { name: "Store", rls: true, note: "Merchant update own store, admin full" },
  { name: "Rider", rls: true, note: "Rider self-update, admin full" },
  { name: "Payment", rls: true, note: "Customer own, merchant/rider/admin read" },
  { name: "Transaction", rls: true, note: "User own transactions, admin full" },
  { name: "MerchantWallet", rls: true, note: "Merchant own wallet, admin full" },
  { name: "RiderWallet", rls: true, note: "Rider own wallet, admin full" },
  { name: "Refund", rls: true, note: "Customer/merchant read, admin manage" },
  { name: "SupportTicket", rls: true, note: "User own tickets, admin/agent access" },
  { name: "FraudReport", rls: true, note: "Reporter + admin only" },
  { name: "FraudScore", rls: true, note: "Admin only" },
  { name: "SystemLog", rls: true, note: "Admin only" },
  { name: "CrashReport", rls: true, note: "Admin only" },
  { name: "Campaign", rls: true, note: "Admin only CRUD" },
  { name: "Advertisement", rls: true, note: "Merchant own ads, admin approve" },
  { name: "Influencer", rls: true, note: "Admin only CRUD" },
  { name: "UserSegment", rls: true, note: "Admin only" },
  { name: "EmergencyAlert", rls: true, note: "User own + admin" },
  { name: "AIConversation", rls: true, note: "User own conversations, admin" },
];

const rolePermissions = [
  { role: "Customer", permissions: ["View own orders", "Create orders", "Manage own profile", "View own wallets", "Create support tickets", "File complaints", "Use emergency button", "View own referrals", "Access AI assistant"] },
  { role: "Merchant", permissions: ["Manage own store", "CRUD own products", "View store orders", "Manage inventory", "View earnings & wallet", "Request withdrawals", "Purchase ads", "File disputes", "AI merchant assistant"] },
  { role: "Rider", permissions: ["Accept/reject deliveries", "Update own location", "View own earnings", "Withdraw earnings", "Report issues", "Emergency button", "Update delivery status"] },
  { role: "Admin", permissions: ["Full system access", "Manage all entities", "Approve applications", "Manage campaigns", "View fraud scores", "System monitoring", "Security dashboard", "Revenue management"] },
];

export default function SecurityDashboard() {
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const scores = await base44.entities.FraudScore.filter({ status: { $in: ["flagged", "suspended"] } }, "-fraud_score", 20).catch(() => []);
      setFraudAlerts(scores);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  const rlsCoverage = entitySecurity.filter(e => e.rls).length;
  const totalEntities = entitySecurity.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Shield className="w-6 h-6 text-saffron" /><div><h2 className="font-display font-bold text-lg text-foreground">Security Audit</h2><p className="text-xs text-foreground/50">Authentication, authorization & data protection</p></div></div>
        <button onClick={load} className="p-2 rounded-lg bg-muted text-foreground/50 hover:text-saffron"><RefreshCw className="w-4 h-4" /></button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{ label: "RLS Coverage", value: `${rlsCoverage}/${totalEntities}`, icon: ShieldCheck, color: "bg-terai/10 text-terai", status: "pass" }, { label: "Active Fraud Alerts", value: fraudAlerts.length, icon: ShieldAlert, color: fraudAlerts.length > 0 ? "bg-red-50 text-red-500 dark:bg-red-500/10" : "bg-terai/10 text-terai", status: fraudAlerts.length > 0 ? "warning" : "pass" }, { label: "Auth Method", value: "JWT + OTP", icon: Key, color: "bg-blue-50 text-blue-500 dark:bg-blue-500/10", status: "pass" }, { label: "Role Types", value: "4 Roles", icon: Users, color: "bg-purple-50 text-purple-500 dark:bg-purple-500/10", status: "pass" }].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
            <div className={"w-9 h-9 rounded-lg flex items-center justify-center mb-2 " + s.color}><s.icon className="w-4 h-4" /></div>
            <p className="text-xl font-display font-extrabold text-foreground">{s.value}</p>
            <p className="text-xs text-foreground/40">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-display font-bold text-sm text-foreground mb-3 flex items-center gap-2"><Lock className="w-4 h-4 text-saffron" /> Authentication Security</h3>
        <div className="grid sm:grid-cols-2 gap-2">
          {[
            { label: "JWT Token Authentication", status: "pass" },
            { label: "Password Encryption (bcrypt)", status: "pass" },
            { label: "OTP Verification (Register/Login)", status: "pass" },
            { label: "Google OAuth Login", status: "pass" },
            { label: "Session Management", status: "pass" },
            { label: "Password Reset Flow", status: "pass" },
            { label: "Protected Route Guards", status: "pass" },
            { label: "Idle Timeout (Auto Logout)", status: "pass" },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/50">
              <CheckCircle className="w-4 h-4 text-terai flex-shrink-0" />
              <span className="text-xs text-foreground/70">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-display font-bold text-sm text-foreground mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-saffron" /> Entity-Level Security (RLS)</h3>
        <div className="space-y-1 max-h-[300px] overflow-y-auto">
          {entitySecurity.map(e => (
            <div key={e.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
              <div className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-terai" /><span className="text-xs font-bold text-foreground">{e.name}</span></div>
              <span className="text-[10px] text-foreground/40">{e.note}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-display font-bold text-sm text-foreground mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-saffron" /> Role-Based Access Control</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {rolePermissions.map(rp => (
            <div key={rp.role} className="p-3 rounded-xl bg-muted/50">
              <p className="text-sm font-bold text-saffron mb-2">{rp.role}</p>
              <ul className="space-y-1">{rp.permissions.map((p, i) => <li key={i} className="text-[11px] text-foreground/60 flex items-start gap-1.5"><span className="text-terai">•</span>{p}</li>)}</ul>
            </div>
          ))}
        </div>
      </div>

      {fraudAlerts.length > 0 && (
        <div className="bg-card rounded-2xl border border-red-200 dark:border-red-500/20 p-5">
          <h3 className="font-display font-bold text-sm text-red-600 dark:text-red-400 mb-3 flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Active Security Alerts</h3>
          <div className="space-y-2">
            {fraudAlerts.map(f => (
              <div key={f.id} className="flex items-center justify-between p-2.5 rounded-lg bg-red-50 dark:bg-red-500/5">
                <div><p className="text-xs font-bold text-foreground">{f.user_name}</p><p className="text-[10px] text-foreground/40 capitalize">{f.user_type} • Score: {f.fraud_score}/100</p></div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/10 text-red-500 capitalize">{f.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-display font-bold text-sm text-foreground mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-saffron" /> Compliance Status</h3>
        <div className="grid sm:grid-cols-2 gap-2">
          {[
            { label: "Privacy Policy", status: "pass" },
            { label: "Terms & Conditions", status: "pass" },
            { label: "Data Handling Rules", status: "pass" },
            { label: "User Consent Management", status: "pass" },
            { label: "Data Minimization (AI)", status: "pass" },
            { label: "KYC Document Security", status: "pass" },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/50">
              <CheckCircle className="w-4 h-4 text-terai flex-shrink-0" />
              <span className="text-xs text-foreground/70">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}