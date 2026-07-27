import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Check, X, FileText, Mail, Phone, MapPin, Building2, User, KeyRound, RefreshCw, Send, ExternalLink, Banknote, Copy, Ban, Power } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import AccountCreationForm from "@/components/admin/AccountCreationForm";

export default function ApplicationManager() {
  const [applications, setApplications] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [createModal, setCreateModal] = useState(null);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [apps, storeList] = await Promise.all([
        base44.entities.MerchantApplication.list("-created_date", 50).catch(() => []),
        base44.entities.Store.list("-created_date", 100).catch(() => []),
      ]);
      setApplications(apps);
      setStores(storeList);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status, extra = {}) => {
    setActionLoading(true);
    try {
      await base44.entities.MerchantApplication.update(id, { status, ...extra });
      await base44.entities.AuditLog.create({ action: `application_${status}`, target_type: selected?.applicant_type || "merchant", target_name: selected?.business_name || "", details: `Application ${status}` });
      load(); setSelected(null);
      toast({ title: `Application ${status}` });
    } catch { toast({ title: "Failed", variant: "destructive" }); }
    finally { setActionLoading(false); }
  };

  const resetPassword = async (app) => {
    setActionLoading(true);
    try {
      await base44.auth.resetPasswordRequest(app.email);
      await base44.entities.AuditLog.create({ action: "password_reset", target_type: app.applicant_type, target_name: app.business_name, details: `Password reset for ${app.email}` });
      toast({ title: "Password reset email sent" });
    } catch { toast({ title: "Failed to send reset", variant: "destructive" }); }
    finally { setActionLoading(false); }
  };

  const toggleSuspend = async (app) => {
    setActionLoading(true);
    try {
      const newSuspended = !app.is_suspended;
      await base44.entities.MerchantApplication.update(app.id, { is_suspended: newSuspended });
      await base44.entities.AuditLog.create({ action: newSuspended ? "account_suspended" : "account_activated", target_type: app.applicant_type, target_name: app.business_name, details: `Account ${newSuspended ? "suspended" : "activated"}` });
      load(); setSelected(null);
      toast({ title: newSuspended ? "Account suspended" : "Account activated" });
    } catch { toast({ title: "Failed", variant: "destructive" }); }
    finally { setActionLoading(false); }
  };

  const resendCredentials = async (app) => {
    setActionLoading(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: app.email,
        subject: `Your Dhangadhi Dash ${app.applicant_type === "rider" ? "Rider" : "Merchant"} Account Credentials`,
        body: `Hello ${app.owner_name},\n\nHere are your login credentials:\n\nEmail: ${app.email}\nUsername: ${app.temporary_username}\nTemporary Password: ${app.temporary_password}\n\nPlease log in and change your password immediately.\n\nDhangadhi Dash Team`,
      });
      toast({ title: "Credentials sent" });
    } catch { toast({ title: "Failed to send", variant: "destructive" }); }
    finally { setActionLoading(false); }
  };

  const copyCredentials = (app) => {
    navigator.clipboard.writeText(`Email: ${app.email}\nUsername: ${app.temporary_username}\nPassword: ${app.temporary_password}`);
    toast({ title: "Credentials copied!" });
  };

  if (loading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}</div>;

  const q = search.toLowerCase();
  const matches = (app) => !q ||
    (app.merchant_code || "").toLowerCase().includes(q) ||
    (app.business_name || "").toLowerCase().includes(q) ||
    (app.owner_name || "").toLowerCase().includes(q) ||
    (app.temporary_username || "").toLowerCase().includes(q) ||
    (app.phone_number || "").toLowerCase().includes(q) ||
    (app.email || "").toLowerCase().includes(q);
  const pending = applications.filter((a) => a.status === "pending").filter(matches);
  const processed = applications.filter((a) => a.status !== "pending").filter(matches);

  const DocLink = ({ label, url }) => (
    url ? (
      <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted hover:bg-saffron/10 text-xs font-medium text-foreground hover:text-saffron transition-colors">
        <ExternalLink className="w-3 h-3" /> {label}
      </a>
    ) : (
      <span className="px-3 py-2 rounded-lg bg-muted/50 text-xs text-foreground/30">{label} (not provided)</span>
    )
  );

  return (
    <div>
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by Merchant Code, Name, Store, Username, Phone..."
          className="w-full h-10 px-4 mb-4 rounded-xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40"
        />
        <h2 className="font-display font-bold text-lg text-foreground mb-4">Pending Applications ({pending.length})</h2>
        {pending.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <FileText className="w-10 h-10 text-foreground/20 mx-auto mb-2" />
            <p className="text-sm text-foreground/40">No pending applications.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
            {pending.map((app) => (
              <div key={app.id} className="bg-card rounded-2xl border border-border p-5 cursor-pointer hover:border-saffron/40 transition-all" onClick={() => { setSelected(app); setNotes(app.internal_notes || ""); }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-foreground">{app.business_name}</h3>
                    <p className="text-xs text-foreground/40">{app.owner_name} · {app.email}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize bg-amber-50 text-amber-500">{app.applicant_type}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-foreground/50">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {app.phone_number}</span>
                  <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> PAN: {app.pan_number}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {processed.length > 0 && (
        <div>
          <h2 className="font-display font-bold text-lg text-foreground mb-4">Processed ({processed.length})</h2>
          <div className="grid lg:grid-cols-2 gap-4">
            {processed.map((app) => (
              <div key={app.id} className={`bg-card rounded-2xl border p-5 cursor-pointer hover:border-saffron/40 transition-all ${app.is_suspended ? "border-red-200 opacity-75" : "border-border"}`} onClick={() => { setSelected(app); setNotes(app.internal_notes || ""); }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-foreground">{app.business_name}</h3>
                    {app.merchant_code && <p className="text-xs font-mono font-bold text-saffron">{app.merchant_code}</p>}
                    <p className="text-xs text-foreground/40">{app.owner_name}{app.temporary_username && ` · @${app.temporary_username}`}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {app.is_suspended && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500">Suspended</span>}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${app.status === "approved" || app.status === "account_created" ? "bg-terai/10 text-terai" : "bg-red-50 text-red-500"}`}>{app.status.replace("_", " ")}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-saffron" />
                  {selected.business_name}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${selected.applicant_type === "rider" ? "bg-blue-50 text-blue-500" : "bg-saffron/10 text-saffron"}`}>{selected.applicant_type}</span>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm"><User className="w-4 h-4 text-foreground/40" /> {selected.owner_name}</div>
                  <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-foreground/40" /> {selected.email}</div>
                  <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-foreground/40" /> {selected.phone_number}</div>
                  <div className="flex items-center gap-2 text-sm"><FileText className="w-4 h-4 text-foreground/40" /> PAN: {selected.pan_number}</div>
                  <div className="flex items-center gap-2 text-sm col-span-2"><MapPin className="w-4 h-4 text-foreground/40" /> {selected.business_address}</div>
                  {selected.google_maps_location && <div className="flex items-center gap-2 text-sm col-span-2"><MapPin className="w-4 h-4 text-foreground/40" /> <a href={selected.google_maps_location} target="_blank" rel="noopener noreferrer" className="text-saffron hover:underline truncate">{selected.google_maps_location}</a></div>}
                  {selected.business_registration_number && <div className="flex items-center gap-2 text-sm"><FileText className="w-4 h-4 text-foreground/40" /> Reg: {selected.business_registration_number}</div>}
                  {selected.vehicle_type && <div className="text-sm"><span className="text-foreground/40">Vehicle:</span> <span className="font-medium capitalize">{selected.vehicle_type.replace(/_/g, " ")}</span></div>}
                  {selected.license_number && selected.license_number !== "N/A" && <div className="text-sm"><span className="text-foreground/40">License:</span> {selected.license_number}</div>}
                  {selected.number_plate && <div className="text-sm"><span className="text-foreground/40">Number Plate:</span> <span className="font-mono">{selected.number_plate}</span></div>}
                  {selected.emergency_contact && <div className="text-sm"><span className="text-foreground/40">Emergency:</span> {selected.emergency_contact}</div>}
                  {selected.bank_details && <div className="flex items-center gap-2 text-sm col-span-2"><Banknote className="w-4 h-4 text-foreground/40" /> {selected.bank_details}</div>}
                </div>

                <div>
                  <h4 className="font-bold text-sm text-foreground mb-2">Documents</h4>
                  <div className="flex flex-wrap gap-2">
                    {selected.applicant_type === "rider" ? (
                      <>
                        <DocLink label="Profile Photo" url={selected.profile_photo_url} />
                        <DocLink label="Citizenship Front" url={selected.citizenship_front_url} />
                        <DocLink label="Citizenship Back" url={selected.citizenship_back_url} />
                        <DocLink label="License Front" url={selected.license_front_url} />
                        <DocLink label="License Back" url={selected.license_back_url} />
                        <DocLink label="Vehicle Bluebook" url={selected.vehicle_bluebook_url} />
                        <DocLink label="Insurance" url={selected.insurance_url} />
                      </>
                    ) : (
                      <>
                        <DocLink label="Logo" url={selected.logo_url} />
                        <DocLink label="Banner" url={selected.banner_url} />
                        <DocLink label="Registration Cert" url={selected.registration_certificate_url} />
                        <DocLink label="PAN Cert" url={selected.pan_certificate_url} />
                        <DocLink label="Citizenship Front" url={selected.citizenship_front_url} />
                        <DocLink label="Citizenship Back" url={selected.citizenship_back_url} />
                      </>
                    )}
                  </div>
                  {selected.applicant_type === "rider" && selected.number_plate && (
                    <p className="text-xs text-foreground/50 mt-2">Number Plate: <span className="font-mono font-bold text-foreground">{selected.number_plate}</span></p>
                  )}
                  {selected.applicant_type === "rider" && selected.emergency_contact && (
                    <p className="text-xs text-foreground/50 mt-1">Emergency Contact: {selected.emergency_contact}</p>
                  )}
                </div>

                <div>
                  <Label>Internal Notes</Label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-xl border border-input bg-card text-sm" placeholder="Add private notes..." />
                </div>

                {selected.status === "pending" && (
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => updateStatus(selected.id, "approved", { internal_notes: notes })} disabled={actionLoading} className="bg-terai hover:bg-terai/90"><Check className="w-4 h-4" /> Approve</Button>
                    <Button onClick={() => updateStatus(selected.id, "rejected", { internal_notes: notes })} disabled={actionLoading} variant="destructive"><X className="w-4 h-4" /> Reject</Button>
                    <Button onClick={() => updateStatus(selected.id, "pending", { internal_notes: notes, requested_documents: "Additional documents requested" })} disabled={actionLoading} variant="outline"><Send className="w-4 h-4" /> Request Documents</Button>
                  </div>
                )}

                {selected.status === "approved" && (
                  <Button onClick={() => { setCreateModal(selected); setSelected(null); }} disabled={actionLoading} className="w-full bg-saffron hover:bg-saffron/90"><KeyRound className="w-4 h-4" /> Create Account</Button>
                )}

                {selected.status === "account_created" && (
                  <div className="space-y-3">
                    <div className="bg-muted/50 rounded-xl p-4">
                      <p className="text-xs font-bold text-foreground/40 uppercase mb-2">Account Credentials</p>
                      <div className="space-y-1 text-sm">
                        {selected.merchant_code && <p><span className="text-foreground/50">Merchant Code:</span> <span className="font-mono font-bold text-saffron">{selected.merchant_code}</span></p>}
                        {selected.rider_code && <p><span className="text-foreground/50">Rider Code:</span> <span className="font-mono font-bold text-blue-500">{selected.rider_code}</span></p>}
                        <p><span className="text-foreground/50">Email:</span> <span className="font-mono text-foreground">{selected.email}</span></p>
                        <p><span className="text-foreground/50">Username:</span> <span className="font-mono text-foreground">{selected.temporary_username || "N/A"}</span></p>
                        <p><span className="text-foreground/50">Temp Password:</span> <span className="font-mono text-foreground">{selected.temporary_password || "N/A"}</span></p>
                        {selected.assigned_store_id && <p><span className="text-foreground/50">Store ID:</span> <span className="font-mono text-foreground text-xs">{selected.assigned_store_id}</span></p>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => copyCredentials(selected)} variant="outline" size="sm"><Copy className="w-3.5 h-3.5" /> Copy Credentials</Button>
                      <Button onClick={() => resendCredentials(selected)} disabled={actionLoading} variant="outline" size="sm"><Send className="w-3.5 h-3.5" /> Resend Email</Button>
                      <Button onClick={() => resetPassword(selected)} disabled={actionLoading} variant="outline" size="sm"><RefreshCw className="w-3.5 h-3.5" /> Reset Password</Button>
                      <Button onClick={() => toggleSuspend(selected)} disabled={actionLoading} variant={selected.is_suspended ? "default" : "destructive"} size="sm" className={selected.is_suspended ? "bg-terai hover:bg-terai/90" : ""}>
                        {selected.is_suspended ? <><Power className="w-3.5 h-3.5" /> Activate</> : <><Ban className="w-3.5 h-3.5" /> Suspend</>}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {createModal && (
        <AccountCreationForm app={createModal} stores={stores} onClose={() => setCreateModal(null)} onCreated={() => { load(); }} />
      )}
    </div>
  );
}