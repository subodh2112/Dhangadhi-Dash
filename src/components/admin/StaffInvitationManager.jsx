import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { ROLE_DEFS } from "@/lib/permissions";
import { logAdminAction } from "@/lib/staffActivityLogger";
import { Copy, Ban, Plus, Loader2, Clock, CheckCircle, XCircle, KeyRound, Shield, Eye, EyeOff } from "lucide-react";

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700", icon: Clock },
  opened: { label: "Opened", color: "bg-blue-100 text-blue-700", icon: KeyRound },
  accepted: { label: "Active", color: "bg-terai/10 text-terai", icon: CheckCircle },
  revoked: { label: "Revoked", color: "bg-red-100 text-red-700", icon: Ban },
  expired: { label: "Expired", color: "bg-muted text-foreground/50", icon: XCircle },
};

export default function StaffInvitationManager({ onClose }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [showPasswords, setShowPasswords] = useState({});
  const [form, setForm] = useState({
    email: "",
    full_name: "",
    staff_role: "marketing_manager",
    password: "",
  });

  useEffect(() => {
    loadInvitations();
  }, []);

  async function loadInvitations() {
    setLoading(true);
    try {
      const data = await base44.entities.StaffInvitation.list("-created_date", 100);
      setInvitations(data);
    } catch {
      toast({ title: "Failed to load staff list", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.email.trim() || !form.full_name.trim() || !form.password.trim()) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }
    if (form.password.length < 6) {
      toast({ title: "Password too short", description: "Use at least 6 characters", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      // Step 1: Register the user account (sends OTP email to staff)
      try {
        await base44.auth.register({ email: form.email.trim(), password: form.password });
      } catch (err) {
        const msg = (err.message || "").toLowerCase();
        if (!msg.includes("already") && !msg.includes("exists") && !msg.includes("registered") && !msg.includes("verified")) {
          throw err;
        }
      }

      // Step 2: Create staff invitation with code + password via backend
      const response = await base44.functions.invoke("staff_invitation", {
        action: "create",
        email: form.email.trim(),
        full_name: form.full_name.trim(),
        staff_role: form.staff_role,
        password: form.password,
      });
      const data = response.data || response;

      if (!data.success) throw new Error(data.error || "Failed to create staff");

      await logAdminAction({
        action: "Created staff account for " + form.full_name + " (" + form.email + ") as " + (ROLE_DEFS[form.staff_role]?.display_name || form.staff_role),
        module: "staff",
        details: "Role: " + form.staff_role + ", Staff Code: " + data.staff_code,
      });

      toast({
        title: "Staff account created!",
        description: "Code: " + data.staff_code + " — Ask staff to activate at /activate-staff",
      });

      // Copy code to clipboard
      try {
        await navigator.clipboard.writeText(data.staff_code);
        toast({ title: "Staff code copied to clipboard" });
      } catch {}

      setForm({ email: "", full_name: "", staff_role: "marketing_manager", password: "" });
      setShowForm(false);
      loadInvitations();
    } catch (err) {
      toast({ title: "Failed to create staff", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }

  function copyText(text, label) {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: label + " copied" });
    }).catch(() => {
      toast({ title: "Copy failed", description: text, variant: "destructive" });
    });
  }

  async function handleRevoke(invitation) {
    if (!confirm("Revoke staff access for " + invitation.full_name + "? They will no longer be able to log in.")) return;
    try {
      await base44.entities.StaffInvitation.update(invitation.id, {
        status: "revoked",
        revoked_at: new Date().toISOString(),
        revoked_by: user?.full_name || user?.email || "Admin",
      });
      await logAdminAction({
        action: "Revoked staff access for " + invitation.full_name + " (" + invitation.email + ")",
        module: "staff",
        severity: "warning",
        details: "Code: " + invitation.staff_code,
      });
      toast({ title: "Staff access revoked" });
      loadInvitations();
    } catch (err) {
      toast({ title: "Failed to revoke", description: err.message, variant: "destructive" });
    }
  }

  function togglePassword(id) {
    setShowPasswords((s) => ({ ...s, [id]: !s[id] }));
  }

  function handleRoleChange(roleKey) {
    setForm((f) => ({ ...f, staff_role: roleKey }));
  }

  const filtered = filter === "all" ? invitations : invitations.filter((i) => i.status === filter);
  const pendingCount = invitations.filter((i) => i.status === "pending" || i.status === "opened").length;
  const acceptedCount = invitations.filter((i) => i.status === "accepted").length;
  const filterOptions = ["all", "pending", "accepted", "revoked"];

  return (
    <div className="space-y-6">
      {/* Create Staff Form */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
            <Plus className="w-5 h-5 text-saffron" /> Create Staff Account
          </h3>
          {onClose && <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>}
        </div>

        {showForm ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invite_name">Full Name</Label>
                <Input id="invite_name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. Sanjay Thapa" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite_email">Email Address</Label>
                <Input id="invite_email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="e.g. sanjay@gmail.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite_role">Staff Role</Label>
                <select id="invite_role" value={form.staff_role} onChange={(e) => handleRoleChange(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm">
                  {Object.entries(ROLE_DEFS).filter(([key]) => key !== "super_admin").map(([key, def]) => (
                    <option key={key} value={key}>{def.display_name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite_password">Set Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="invite_password" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Set a password" className="pl-10 h-10" required />
                </div>
              </div>
            </div>
            {form.staff_role && ROLE_DEFS[form.staff_role] && (
              <div className="p-3 rounded-lg bg-saffron/5 border border-saffron/15">
                <p className="text-xs text-foreground/60 mb-1">Role: <span className="font-bold text-saffron">{ROLE_DEFS[form.staff_role].display_name}</span></p>
                <p className="text-xs text-foreground/50">{ROLE_DEFS[form.staff_role].description}</p>
              </div>
            )}
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-xs text-foreground/60">A unique <strong>Staff Code</strong> will be auto-generated. The staff member will need their code + password + email OTP to activate their account at <code className="text-blue-600">/activate-staff</code></p>
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={creating} className="bg-saffron hover:bg-saffron/90">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Staff Account
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        ) : (
          <Button onClick={() => setShowForm(true)} variant="outline" className="w-full h-10">
            <Plus className="w-4 h-4" /> Create New Staff Account
          </Button>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-extrabold text-amber-600">{pendingCount}</p>
          <p className="text-xs text-foreground/50 mt-1">Pending</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-extrabold text-terai">{acceptedCount}</p>
          <p className="text-xs text-foreground/50 mt-1">Active</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-extrabold text-foreground">{invitations.length}</p>
          <p className="text-xs text-foreground/50 mt-1">Total</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl overflow-x-auto no-scrollbar">
        {filterOptions.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition-all ${filter === f ? "bg-background text-saffron shadow-sm" : "text-foreground/50 hover:text-foreground"}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Staff List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-saffron animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-foreground/40">
          <Shield className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>No {filter !== "all" ? filter : ""} staff accounts found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((inv) => {
            const statusCfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusCfg.icon;
            const isExpanded = expandedId === inv.id;
            const canRevoke = inv.status === "pending" || inv.status === "opened" || inv.status === "accepted";

            return (
              <div key={inv.id} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-4 flex items-center gap-3 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setExpandedId(isExpanded ? null : inv.id)}>
                  <div className="w-10 h-10 rounded-full bg-saffron/10 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-sm text-saffron">{(inv.full_name || "S").charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm text-foreground truncate">{inv.full_name}</p>
                      <Badge className={statusCfg.color + " border-0 text-[10px]"}>
                        <StatusIcon className="w-3 h-3 mr-0.5" />{statusCfg.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <code className="text-xs font-mono font-bold text-saffron">{inv.staff_code}</code>
                      <span className="text-xs text-foreground/40">·</span>
                      <span className="text-xs text-foreground/50 truncate">{inv.email}</span>
                    </div>
                  </div>
                  <div className="hidden sm:block text-right flex-shrink-0">
                    <p className="text-xs font-medium text-foreground/60">{inv.role_display_name}</p>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-border space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-foreground/40 uppercase tracking-wide font-semibold">Staff Code</p>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-sm font-mono font-bold text-saffron">{inv.staff_code}</code>
                          <button onClick={(e) => { e.stopPropagation(); copyText(inv.staff_code, "Staff code"); }} className="text-foreground/40 hover:text-saffron"><Copy className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      <div>
                        <p className="text-foreground/40 uppercase tracking-wide font-semibold">Password</p>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-sm font-mono text-foreground/70">{showPasswords[inv.id] ? inv.password : "••••••••"}</code>
                          <button onClick={(e) => { e.stopPropagation(); togglePassword(inv.id); }} className="text-foreground/40 hover:text-saffron">{showPasswords[inv.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>
                          <button onClick={(e) => { e.stopPropagation(); copyText(inv.password, "Password"); }} className="text-foreground/40 hover:text-saffron"><Copy className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      <div>
                        <p className="text-foreground/40 uppercase tracking-wide font-semibold">Role</p>
                        <p className="text-foreground font-medium">{inv.role_display_name}</p>
                        <p className="text-foreground/40">{inv.department}</p>
                      </div>
                      <div>
                        <p className="text-foreground/40 uppercase tracking-wide font-semibold">Created By</p>
                        <p className="text-foreground font-medium">{inv.invited_by_name}</p>
                      </div>
                      <div>
                        <p className="text-foreground/40 uppercase tracking-wide font-semibold">Created</p>
                        <p className="text-foreground">{inv.created_date ? new Date(inv.created_date).toLocaleDateString() : "—"}</p>
                      </div>
                      <div>
                        <p className="text-foreground/40 uppercase tracking-wide font-semibold">Status</p>
                        <p className="capitalize">{inv.status}</p>
                      </div>
                    </div>

                    {inv.status === "pending" && (
                      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-foreground/60">
                        <strong>Activation needed:</strong> Staff must visit <code className="text-amber-700">/activate-staff</code> and enter their code + the OTP sent to their email.
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-2">
                      {canRevoke && (
                        <Button size="sm" variant="destructive" onClick={() => handleRevoke(inv)}>
                          <Ban className="w-3.5 h-3.5" /> Revoke Access
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}