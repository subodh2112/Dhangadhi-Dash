import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { logAdminAction } from "@/lib/adminLog";
import { resetMerchantPassword, generateStrongPassword } from "@/lib/merchantUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Eye, Ban, CheckCircle, Trash2, KeyRound, Copy, Check, Star, Package, DollarSign,
  Store as StoreIcon, Mail, Phone, MapPin, Shield, Edit3, ExternalLink, UserCheck, Loader2,
} from "lucide-react";

export default function MerchantDetailModal({ store, stats, onClose, onEdit, onToggleSuspend, onDelete, onRefresh }) {
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [copied, setCopied] = useState("");
  const [assignEmail, setAssignEmail] = useState(store.owner_email || "");
  const [assigning, setAssigning] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  if (!store) return null;

  const handleAssign = async () => {
    const email = assignEmail.trim();
    if (!email) { toast({ title: "Enter an email", variant: "destructive" }); return; }
    if (assigning) return;
    setAssigning(true);
    try {
      let users = await base44.entities.User.filter({ email }).catch(() => []);
      let userId = users.length > 0 ? users[0].id : "";

      let assignedPassword = null;
      if (!userId) {
        // Register new user with a generated temp password (not inviteUser — that
        // creates the auth account with a system password the merchant can never know)
        assignedPassword = generateStrongPassword();
        await base44.auth.register({ email, password: assignedPassword });
        const registered = await base44.entities.User.filter({ email }).catch(() => []);
        if (registered.length > 0) userId = registered[0].id;
      }

      if (userId) {
        await base44.entities.User.update(userId, { role: "merchant", store_id: store.id }).catch(() => {});
        await base44.entities.Store.update(store.id, { merchant_id: userId, owner_email: email, temporary_password: assignedPassword || store.temporary_password }).catch(() => {});
      } else {
        await base44.entities.Store.update(store.id, { owner_email: email }).catch(() => {});
      }

      await logAdminAction("Assigned merchant by email", "merchant", store.merchant_code || store.name, email);
      if (assignedPassword) {
        setNewPassword(assignedPassword);
        toast({ title: "Merchant account created", description: `${email} — see temporary password below` });
      } else {
        toast({ title: "Merchant assigned", description: `${email} linked to this store` });
      }
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      toast({ title: "Assignment failed", description: err.message, variant: "destructive" });
    }
    setAssigning(false);
  };

  const handleResetPassword = async () => {
    if (resetting) return;
    setResetting(true);
    try {
      await resetMerchantPassword(store);
      setNewPassword(null);
      setResetSent(true);
      await logAdminAction("Reset merchant password", "merchant", store.merchant_code || store.name, store.owner_email || "");
      toast({ title: "Password reset email sent", description: `Sent to ${store.owner_email}` });
    } catch {
      toast({ title: "Failed to reset", variant: "destructive" });
    }
    setResetting(false);
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(""), 2000);
  };

  const copyAllCredentials = () => {
    const text = `Merchant: ${store.name}\nEmail: ${store.owner_email}\nUsername: ${store.username}\nMerchant Code: ${store.merchant_code}\nStore Code: ${store.store_code}`;
    copyToClipboard(text, "all");
    toast({ title: "Credentials copied!" });
  };

  const infoRow = (icon, label, value) => (
    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
      <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center flex-shrink-0">{icon}</div>
      <div className="min-w-0"><p className="text-[10px] font-bold text-foreground/40 uppercase">{label}</p><p className="text-sm font-semibold text-foreground truncate">{value || "—"}</p></div>
    </div>
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2"><StoreIcon className="w-5 h-5 text-saffron" /> {store.name}</span>
            {store.is_suspended ? <span className="text-[10px] bg-red-50 text-red-500 dark:bg-red-500/10 font-bold px-2 py-1 rounded-full">Suspended</span> : <span className="text-[10px] bg-terai/10 text-terai font-bold px-2 py-1 rounded-full">Active</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Codes */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-saffron/5 rounded-xl p-3 text-center border border-saffron/10">
              <p className="text-[10px] font-bold text-foreground/40 uppercase">Merchant Code</p>
              <p className="text-lg font-mono font-extrabold text-saffron">{store.merchant_code || "—"}</p>
            </div>
            <div className="bg-terai/5 rounded-xl p-3 text-center border border-terai/10">
              <p className="text-[10px] font-bold text-foreground/40 uppercase">Store Code</p>
              <p className="text-lg font-mono font-extrabold text-terai">{store.store_code || "—"}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Orders", value: stats.orderCount, icon: Package },
              { label: "Revenue", value: "Rs " + (stats.revenue || 0).toLocaleString(), icon: DollarSign },
              { label: "Products", value: stats.productCount, icon: StoreIcon },
              { label: "Rating", value: store.rating ? store.rating + " ★" : "—", icon: Star },
            ].map((s) => (
              <div key={s.label} className="bg-muted/50 rounded-xl p-2 text-center">
                <s.icon className="w-3.5 h-3.5 text-foreground/40 mx-auto mb-1" />
                <p className="text-sm font-bold text-foreground">{s.value}</p>
                <p className="text-[9px] text-foreground/40">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Merchant Info */}
          <div className="grid grid-cols-2 gap-2">
            {infoRow(<StoreIcon className="w-4 h-4 text-saffron" />, "Owner", store.owner_name)}
            {infoRow(<Mail className="w-4 h-4 text-saffron" />, "Email", store.owner_email)}
            {infoRow(<Phone className="w-4 h-4 text-saffron" />, "Phone", store.phone)}
            {infoRow(<Shield className="w-4 h-4 text-saffron" />, "Username", store.username)}
            {infoRow(<Shield className="w-4 h-4 text-saffron" />, "PAN", store.pan_number)}
            {infoRow(<MapPin className="w-4 h-4 text-saffron" />, "Category", (store.category || "").replace(/_/g, " "))}
          </div>

          {/* Password Reset Result */}
          {newPassword && (
            <div className="bg-saffron/5 border border-saffron/20 rounded-xl p-4">
              <p className="text-xs font-bold text-foreground/40 uppercase mb-1">Temporary Password</p>
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-saffron text-lg">{newPassword}</span>
                <button onClick={() => copyToClipboard(newPassword, "pwd")} className="text-saffron">{copied === "pwd" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button>
              </div>
              <p className="text-[10px] text-foreground/40 mt-1">The merchant must verify their email (OTP) on first login, then use this password.</p>
            </div>
          )}
          {resetSent && !newPassword && (
            <div className="bg-terai/5 border border-terai/20 rounded-xl p-4">
              <p className="text-sm font-bold text-terai flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> Password reset email sent</p>
              <p className="text-[10px] text-foreground/40 mt-1">A reset link was sent to {store.owner_email}. The merchant sets their own new password.</p>
            </div>
          )}

          {/* Assign Merchant by Email */}
          <div className="bg-muted/50 rounded-xl p-3 space-y-2">
            <p className="text-[10px] font-bold text-foreground/40 uppercase flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5" /> Assign Merchant Account</p>
            {store.merchant_id && (
              <p className="text-[11px] text-terai font-medium">Currently linked to user ID: {store.merchant_id.slice(-8)}</p>
            )}
            <div className="flex gap-2">
              <input
                type="email"
                value={assignEmail}
                onChange={(e) => setAssignEmail(e.target.value)}
                placeholder="merchant@email.com"
                className="flex-1 h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40"
              />
              <button
                onClick={handleAssign}
                disabled={assigning}
                className="h-9 px-3 rounded-lg bg-saffron text-white text-sm font-bold hover:bg-saffron/90 disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0"
              >
                {assigning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                Assign
              </button>
            </div>
            <p className="text-[10px] text-foreground/40">Links an existing user by email, or sends a merchant invite if not registered.</p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button onClick={() => onEdit(store)} className="h-10 rounded-xl border border-border text-sm font-bold text-foreground/70 hover:text-blue-500 hover:border-blue-500/40 flex items-center justify-center gap-1.5"><Edit3 className="w-4 h-4" /> Edit</button>
            <button onClick={handleResetPassword} disabled={resetting} className="h-10 rounded-xl border border-border text-sm font-bold text-foreground/70 hover:text-saffron hover:border-saffron/40 flex items-center justify-center gap-1.5 disabled:opacity-50">
              {resetting ? "Resetting..." : <><KeyRound className="w-4 h-4" /> Reset Password</>}
            </button>
            <button onClick={copyAllCredentials} className="h-10 rounded-xl border border-border text-sm font-bold text-foreground/70 hover:text-saffron hover:border-saffron/40 flex items-center justify-center gap-1.5">
              {copied === "all" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} Copy Credentials
            </button>
            {store.is_suspended ? (
              <button onClick={() => onToggleSuspend(store)} className="h-10 rounded-xl bg-terai/10 text-terai text-sm font-bold flex items-center justify-center gap-1.5"><CheckCircle className="w-4 h-4" /> Activate</button>
            ) : (
              <button onClick={() => onToggleSuspend(store)} className="h-10 rounded-xl bg-red-50 text-red-500 dark:bg-red-500/10 text-sm font-bold flex items-center justify-center gap-1.5"><Ban className="w-4 h-4" /> Suspend</button>
            )}
            <button onClick={() => onDelete(store)} className="h-10 rounded-xl bg-red-50 text-red-500 dark:bg-red-500/10 text-sm font-bold flex items-center justify-center gap-1.5 col-span-2"><Trash2 className="w-4 h-4" /> Delete Merchant</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}