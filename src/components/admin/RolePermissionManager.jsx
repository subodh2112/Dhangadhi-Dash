import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { usePermissions, ROLE_DEFS, PERMISSION_CATALOG } from "@/lib/permissions";
import { logAdminAction } from "@/lib/staffActivityLogger";
import { Shield, Lock, Check, Loader2, KeyRound, Users } from "lucide-react";

export default function RolePermissionManager() {
  const { isSuperAdmin, staffRoleName } = usePermissions();
  const { toast } = useToast();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);
  const [customPerms, setCustomPerms] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRoles();
  }, []);

  async function loadRoles() {
    setLoading(true);
    try {
      const dbRoles = await base44.entities.AdminRole.list("-created_date", 50);
      // Merge DB roles with system-defined roles
      const systemRoles = Object.entries(ROLE_DEFS).map(([key, def]) => {
        const dbMatch = dbRoles.find((r) => r.role_name === key);
        return dbMatch || {
          role_name: key,
          display_name: def.display_name,
          description: def.description,
          department: def.department,
          permissions: JSON.stringify(def.permissions),
          is_system_role: true,
          status: "active",
          id: `system_${key}`,
        };
      });
      const customRoles = dbRoles.filter((r) => !ROLE_DEFS[r.role_name]);
      setRoles([...systemRoles, ...customRoles]);
      if (systemRoles.length > 0) setSelectedRole(systemRoles[0]);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load roles", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function getRolePerms(role) {
    if (customPerms[role.role_name]) return customPerms[role.role_name];
    try {
      return JSON.parse(role.permissions || "[]");
    } catch {
      return [];
    }
  }

  function togglePermission(roleKey, permKey) {
    const current = getRolePerms(roles.find((r) => r.role_name === roleKey));
    const updated = current.includes(permKey) ? current.filter((p) => p !== permKey) : [...current, permKey];
    setCustomPerms((prev) => ({ ...prev, [roleKey]: updated }));
  }

  function isSuperAdminRole(role) {
    return role.role_name === "super_admin";
  }

  async function handleSave(role) {
    setSaving(true);
    const perms = getRolePerms(role);
    try {
      if (role.id && !role.id.startsWith("system_")) {
        await base44.entities.AdminRole.update(role.id, {
          permissions: JSON.stringify(perms),
          description: role.description,
          status: role.status,
        });
      } else {
        const created = await base44.entities.AdminRole.create({
          role_name: role.role_name,
          display_name: role.display_name,
          description: role.description,
          department: role.department,
          permissions: JSON.stringify(perms),
          is_system_role: role.is_system_role,
          status: "active",
        });
        setRoles((prev) => prev.map((r) => (r.role_name === role.role_name ? { ...r, ...created } : r)));
      }
      await logAdminAction({
        action: `Updated permissions for role ${role.display_name}`,
        module: "staff",
        details: `${perms.length} permissions assigned`,
      });
      toast({ title: "Role updated", description: `${role.display_name} now has ${perms.length} permissions` });
      setCustomPerms((prev) => {
        const next = { ...prev };
        delete next[role.role_name];
        return next;
      });
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Lock className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="font-display font-bold text-xl text-foreground mb-2">Super Admin Only</h3>
        <p className="text-foreground/50 max-w-sm">Only Super Admin can manage roles and permissions. Your role: {staffRoleName}</p>
      </div>
    );
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-saffron animate-spin" /></div>;
  }

  const currentPerms = selectedRole ? getRolePerms(selectedRole) : [];
  const hasChanges = selectedRole && customPerms[selectedRole.role_name] !== undefined;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-extrabold text-xl text-foreground flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-saffron" /> Roles & Permissions
        </h2>
        <p className="text-foreground/50 text-sm mt-1">Manage what each staff role can access across the platform.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Role List */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-foreground/40 px-1 mb-2">Staff Roles</p>
          {roles.map((role) => {
            const permCount = getRolePerms(role).length;
            const isActive = selectedRole?.role_name === role.role_name;
            return (
              <button
                key={role.role_name}
                onClick={() => setSelectedRole(role)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  isActive ? "bg-saffron/5 border-saffron" : "bg-card border-border hover:border-foreground/20"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Shield className={`w-4 h-4 flex-shrink-0 ${role.role_name === "super_admin" ? "text-saffron" : "text-foreground/40"}`} />
                    <span className="font-bold text-sm text-foreground truncate">{role.display_name}</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] flex-shrink-0">{permCount} perms</Badge>
                </div>
                <p className="text-xs text-foreground/40 mt-1 line-clamp-2">{role.description}</p>
              </button>
            );
          })}
        </div>

        {/* Permission Editor */}
        <div className="lg:col-span-2">
          {selectedRole && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-display font-bold text-lg text-foreground">{selectedRole.display_name}</h3>
                  <p className="text-sm text-foreground/50">{selectedRole.description}</p>
                </div>
                {hasChanges && (
                  <Button onClick={() => handleSave(selectedRole)} disabled={saving} className="bg-saffron hover:bg-saffron/90">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Save Changes
                  </Button>
                )}
              </div>

              {isSuperAdminRole(selectedRole) ? (
                <div className="bg-saffron/5 border border-saffron/20 rounded-xl p-6 text-center">
                  <Shield className="w-8 h-8 text-saffron mx-auto mb-3" />
                  <p className="font-bold text-foreground">Super Admin has all permissions</p>
                  <p className="text-sm text-foreground/50 mt-1">This role cannot be modified. It always has full platform access.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {PERMISSION_CATALOG.map((cat) => (
                    <div key={cat.category}>
                      <p className="text-xs font-bold uppercase tracking-wider text-foreground/40 mb-2">{cat.category}</p>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {cat.permissions.map((perm) => {
                          const checked = currentPerms.includes(perm.key);
                          return (
                            <button
                              key={perm.key}
                              onClick={() => togglePermission(selectedRole.role_name, perm.key)}
                              className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm text-left transition-all ${
                                checked ? "bg-terai/5 border-terai/30 text-foreground" : "bg-background border-border text-foreground/50"
                              }`}
                            >
                              <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${checked ? "bg-terai text-white" : "border border-border"}`}>
                                {checked && <Check className="w-3 h-3" />}
                              </div>
                              <span className="font-medium">{perm.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}