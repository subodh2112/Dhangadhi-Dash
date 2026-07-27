import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Search, Eye, Ban, CheckCircle, ShoppingBag, DollarSign, Store, Bike, Shield, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { logAdminAction } from "@/lib/adminLog";
import PromoteUserModal from "@/components/admin/PromoteUserModal";
import { getRolesArray, getSuspendedRolesArray } from "@/lib/roles";

const ROLE_ICONS = { customer: ShoppingBag, merchant: Store, rider: Bike, admin: Shield };

export default function CustomerControlPanel() {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [promoteUser, setPromoteUser] = useState(null);
  const [promoteRole, setPromoteRole] = useState(null);

  const load = useCallback(async () => {
    try {
      const [u, o] = await Promise.all([
        base44.entities.User.list("-created_date", 200),
        base44.entities.Order.list("-created_date", 500).catch(() => []),
      ]);
      setUsers(u.filter(x => {
        if (x.role === "admin" || x.staff_status === "active") return false;
        const roles = getRolesArray(x);
        return roles.includes("customer") || x.role === "user";
      }));
      setOrders(o);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleSuspend = async (user, suspend) => {
    try {
      await base44.entities.User.update(user.id, { is_suspended: suspend });
      await logAdminAction(suspend ? "Suspended user" : "Activated user", "User", user.full_name || user.email, "ID: " + user.id);
      toast({ title: "User " + (suspend ? "suspended" : "activated") });
      load();
      if (selected?.id === user.id) setSelected({ ...selected, is_suspended: suspend });
    } catch { toast({ title: "Failed", variant: "destructive" }); }
  };

  const handleRemoveRole = async (user, role) => {
    if (!confirm("Remove " + role + " role from " + (user.full_name || user.email) + "?")) return;
    try {
      await base44.functions.invoke("role_management", { action: "remove_role", userId: user.id, role });
      toast({ title: role + " role removed" });
      load();
      if (selected?.id === user.id) {
        const refreshed = await base44.entities.User.get(user.id);
        setSelected(refreshed);
      }
    } catch (err) {
      toast({ title: err.response?.data?.error || "Failed", variant: "destructive" });
    }
  };

  const handleSuspendRole = async (user, role, suspend) => {
    try {
      await base44.functions.invoke("role_management", { action: "suspend_role", userId: user.id, role, suspend });
      toast({ title: role + " role " + (suspend ? "suspended" : "reinstated") });
      load();
      if (selected?.id === user.id) {
        const refreshed = await base44.entities.User.get(user.id);
        setSelected(refreshed);
      }
    } catch (err) {
      toast({ title: err.response?.data?.error || "Failed", variant: "destructive" });
    }
  };

  const handleResetPassword = async (user) => {
    try {
      await base44.auth.resetPasswordRequest(user.email);
      toast({ title: "Password reset email sent to " + user.email });
    } catch {
      toast({ title: "Failed to send reset email", variant: "destructive" });
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  const filtered = users.filter(u => !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  const getUserStats = (userId) => {
    const userOrders = orders.filter(o => o.created_by_id === userId);
    const delivered = userOrders.filter(o => o.status === "delivered");
    const totalSpent = delivered.reduce((s, o) => s + (o.total_amount || 0), 0);
    return { orderCount: userOrders.length, totalSpent, deliveredCount: delivered.length };
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-foreground/40" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40" />
      </div>

      <p className="text-xs text-foreground/40">{filtered.length} customers</p>

      <div className="space-y-2">
        {filtered.slice(0, 50).map(u => {
          const stats = getUserStats(u.id);
          return (
            <div key={u.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-saffron/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-saffron">{u.full_name?.[0]?.toUpperCase() || "U"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-sm text-foreground truncate">{u.full_name || "Unknown"}</p>
                  {u.is_suspended && <span className="text-[9px] bg-red-50 text-red-500 dark:bg-red-500/10 font-bold px-2 py-0.5 rounded-full">Suspended</span>}
                </div>
                <p className="text-xs text-foreground/40 truncate">{u.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-foreground/50 flex items-center gap-1"><ShoppingBag className="w-3 h-3" /> {stats.orderCount}</span>
                  <span className="text-[10px] text-foreground/50 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Rs {stats.totalSpent.toLocaleString()}</span>
                  {getRolesArray(u).filter(r => r !== "customer").map(r => {
                    const Icon = ROLE_ICONS[r];
                    return Icon ? <span key={r} className="text-[9px] font-bold flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-saffron/10 text-saffron"><Icon className="w-2.5 h-2.5" /> {r}</span> : null;
                  })}
                </div>
              </div>
              <button onClick={() => setSelected(u)} className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-saffron/10 hover:text-saffron"><Eye className="w-4 h-4" /></button>
              {u.is_suspended ? (
                <button onClick={() => toggleSuspend(u, false)} className="w-9 h-9 rounded-lg bg-terai/10 text-terai flex items-center justify-center"><CheckCircle className="w-4 h-4" /></button>
              ) : (
                <button onClick={() => toggleSuspend(u, true)} className="w-9 h-9 rounded-lg bg-red-50 text-red-500 dark:bg-red-500/10 flex items-center justify-center"><Ban className="w-4 h-4" /></button>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && <div className="text-center py-12"><Search className="w-10 h-10 text-foreground/20 mx-auto mb-2" /><p className="text-sm text-foreground/40">No customers found.</p></div>}

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader><DialogTitle>Customer Details</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-saffron/10 flex items-center justify-center"><span className="text-lg font-bold text-saffron">{selected.full_name?.[0]?.toUpperCase() || "U"}</span></div>
                  <div>
                    <p className="font-bold text-foreground">{selected.full_name || "Unknown"}</p>
                    <p className="text-sm text-foreground/40">{selected.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[{ label: "Orders", value: getUserStats(selected.id).orderCount }, { label: "Delivered", value: getUserStats(selected.id).deliveredCount }, { label: "Total Spent", value: "Rs " + getUserStats(selected.id).totalSpent.toLocaleString() }].map(s => (
                    <div key={s.label} className="p-3 rounded-xl bg-muted/50 text-center"><p className="text-sm font-bold text-foreground">{s.value}</p><p className="text-[10px] text-foreground/40">{s.label}</p></div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground/40 uppercase mb-2">Recent Orders</p>
                  {orders.filter(o => o.created_by_id === selected.id).slice(0, 5).map(o => (
                    <div key={o.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50">
                      <span className="text-xs font-mono font-bold text-saffron">{o.order_number}</span>
                      <span className="text-xs text-foreground/50 flex-1 truncate">{o.store_name}</span>
                      <span className="text-xs font-bold text-foreground">Rs {o.total_amount}</span>
                      <span className="text-[10px] text-foreground/40">{o.status}</span>
                    </div>
                  ))}
                  {orders.filter(o => o.created_by_id === selected.id).length === 0 && <p className="text-xs text-foreground/40 text-center py-4">No orders yet.</p>}
                </div>
                {/* Role Management */}
                <div className="border-t border-border pt-3">
                  <p className="text-xs font-bold text-foreground/40 uppercase mb-2">Assigned Roles</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {getRolesArray(selected).map(r => {
                      const Icon = ROLE_ICONS[r];
                      const suspended = getSuspendedRolesArray(selected).includes(r);
                      return (
                        <span key={r} className={`text-[10px] font-bold flex items-center gap-1 px-2 py-1 rounded-full ${suspended ? "bg-red-50 text-red-500 dark:bg-red-500/10" : "bg-saffron/10 text-saffron"}`}>
                          {Icon && <Icon className="w-3 h-3" />} {r} {suspended && "(suspended)"}
                          {r !== "customer" && !suspended && (
                            <button onClick={() => handleSuspendRole(selected, r, true)} className="ml-0.5 hover:text-red-600"><X className="w-2.5 h-2.5" /></button>
                        )}
                          {r !== "customer" && suspended && (
                            <button onClick={() => handleSuspendRole(selected, r, false)} className="ml-0.5 hover:text-terai"><CheckCircle className="w-2.5 h-2.5" /></button>
                          )}
                          {r !== "customer" && (
                            <button onClick={() => handleRemoveRole(selected, r)} className="ml-0.5 hover:text-red-600"><Ban className="w-2.5 h-2.5" /></button>
                          )}
                        </span>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    {!getRolesArray(selected).includes("merchant") && (
                      <button onClick={() => { setPromoteRole("merchant"); setPromoteUser(selected); }} className="flex-1 h-9 rounded-xl bg-terai/10 text-terai text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-terai/20"><Store className="w-3.5 h-3.5" /> Promote to Merchant</button>
                    )}
                    {!getRolesArray(selected).includes("rider") && (
                      <button onClick={() => { setPromoteRole("rider"); setPromoteUser(selected); }} className="flex-1 h-9 rounded-xl bg-blue-50 text-blue-500 dark:bg-blue-500/10 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-blue-100 dark:hover:bg-blue-500/20"><Bike className="w-3.5 h-3.5" /> Promote to Rider</button>
                    )}
                  </div>
                  <button onClick={() => handleResetPassword(selected)} className="w-full h-9 rounded-xl bg-muted text-foreground/70 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-muted/70 mt-2"><Shield className="w-3.5 h-3.5" /> Reset Password</button>
                </div>
                {/* Suspend Account */}
                {selected.is_suspended ? (
                  <button onClick={() => toggleSuspend(selected, false)} className="w-full h-10 rounded-xl bg-terai text-white text-sm font-bold flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4" /> Activate Account</button>
                ) : (
                  <button onClick={() => toggleSuspend(selected, true)} className="w-full h-10 rounded-xl bg-red-500 text-white text-sm font-bold flex items-center justify-center gap-2"><Ban className="w-4 h-4" /> Suspend Entire Account</button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {promoteUser && promoteRole && (
        <PromoteUserModal
          user={promoteUser}
          targetRole={promoteRole}
          onClose={() => { setPromoteUser(null); setPromoteRole(null); }}
          onDone={() => load()}
        />
      )}
    </div>
  );
}