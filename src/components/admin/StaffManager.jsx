import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { usePermissions, ROLE_DEFS } from "@/lib/permissions";
import { logAdminAction } from "@/lib/staffActivityLogger";
import { Shield, UserPlus, Search, Ban, CheckCircle, Mail, Loader2, Lock } from "lucide-react";
import StaffInvitationManager from "@/components/admin/StaffInvitationManager";

export default function StaffManager() {
  const { user, isSuperAdmin, staffRoleName } = usePermissions();
  const { toast } = useToast();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);


  useEffect(() => {
    loadStaff();
  }, []);

  async function loadStaff() {
    setLoading(true);
    try {
      const users = await base44.entities.User.list("-created_date", 100);
      setStaff(users.filter((u) => u.role === "admin"));
    } catch (err) {
      toast({ title: "Error", description: "Failed to load staff list", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }



  async function handleStatusToggle(staffMember) {
    const newStatus = staffMember.staff_status === "suspended" ? "active" : "suspended";
    try {
      await base44.entities.User.update(staffMember.id, { staff_status: newStatus });
      await logAdminAction({
        action: `${newStatus === "suspended" ? "Suspended" : "Reactivated"} staff account ${staffMember.full_name || staffMember.email}`,
        module: "staff",
        severity: newStatus === "suspended" ? "warning" : "info",
      });
      toast({ title: `Staff ${newStatus === "suspended" ? "suspended" : "reactivated"}` });
      loadStaff();
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }

  async function handleRoleUpdate(staffMember, newRole) {
    try {
      await base44.entities.User.update(staffMember.id, {
        staff_role: newRole,
        department: ROLE_DEFS[newRole]?.department || "analytics",
      });
      await logAdminAction({
        action: `Changed role of ${staffMember.full_name || staffMember.email} to ${ROLE_DEFS[newRole]?.display_name}`,
        module: "staff",
        severity: "warning",
      });
      toast({ title: "Role updated", description: `${staffMember.full_name} is now ${ROLE_DEFS[newRole]?.display_name}` });
      loadStaff();
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }

  const filtered = staff.filter((s) => {
    const q = search.toLowerCase();
    return (
      (s.full_name || "").toLowerCase().includes(q) ||
      (s.email || "").toLowerCase().includes(q) ||
      (s.staff_role || "super_admin").toLowerCase().includes(q)
    );
  });

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Lock className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="font-display font-bold text-xl text-foreground mb-2">Super Admin Only</h3>
        <p className="text-foreground/50 max-w-sm">Only Super Admin can manage staff accounts. Your role: {staffRoleName}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-xl text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-saffron" /> Staff Management
          </h2>
          <p className="text-foreground/50 text-sm mt-1">Create and manage staff accounts with role-based permissions.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-saffron hover:bg-saffron/90">
          <UserPlus className="w-4 h-4" /> Invite Staff
        </Button>
      </div>

      {showForm && <StaffInvitationManager onClose={() => setShowForm(false)} />}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff by name, email, or role..." className="pl-10" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-saffron animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-foreground/40">
          <Shield className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>No staff members found.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((member) => {
            const roleKey = member.staff_role || "super_admin";
            const roleDef = ROLE_DEFS[roleKey];
            const isSelf = member.id === user?.id;
            const isSuspended = member.staff_status === "suspended";
            return (
              <div key={member.id} className={`bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 ${isSuspended ? "opacity-60" : ""}`}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${roleKey === "super_admin" ? "bg-saffron/10 text-saffron" : "bg-terai/10 text-terai"}`}>
                    {(member.full_name || member.email || "S").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-foreground truncate">{member.full_name || "Unnamed"}</p>
                      {isSelf && <Badge className="bg-saffron/10 text-saffron border-0 text-[10px]">You</Badge>}
                      {isSuspended && <Badge className="bg-red-50 text-red-500 border-0 text-[10px]">Suspended</Badge>}
                    </div>
                    <p className="text-sm text-foreground/50 truncate">{member.email}</p>
                    <p className="text-xs text-foreground/40 mt-0.5">{roleDef?.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {!isSelf && (
                    <select
                      value={roleKey}
                      onChange={(e) => handleRoleUpdate(member, e.target.value)}
                      className="h-9 px-3 rounded-lg border border-input bg-background text-sm font-medium"
                    >
                      {Object.entries(ROLE_DEFS).map(([key, def]) => (
                        <option key={key} value={key}>{def.display_name}</option>
                      ))}
                    </select>
                  )}
                  {isSelf && (
                    <Badge className="bg-saffron/10 text-saffron border-0 whitespace-nowrap">{roleDef?.display_name}</Badge>
                  )}
                  {!isSelf && roleKey !== "super_admin" && (
                    <Button
                      size="sm"
                      variant={isSuspended ? "outline" : "destructive"}
                      onClick={() => handleStatusToggle(member)}
                      className="whitespace-nowrap"
                    >
                      {isSuspended ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                      {isSuspended ? "Reactivate" : "Suspend"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}