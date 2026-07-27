import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { User, Bike, Shield, Mail, Phone, MapPin, Calendar, Camera, Save, X, Check, AlertCircle, Loader2, Star, Package, Wallet, ChevronLeft, FileText, CreditCard, Car } from "lucide-react";
import { VEHICLE_TYPES, getVehicleConfig } from "@/lib/vehicleKyc";

const kycConfig = {
  pending: { label: "Pending Verification", color: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400", icon: AlertCircle },
  approved: { label: "Verified", color: "bg-terai/10 text-terai", icon: Check },
  rejected: { label: "Rejected", color: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400", icon: X },
  not_required: { label: "Not Required", color: "bg-muted text-foreground/50", icon: Check },
};

function StatusBadge({ status, config }) {
  const c = config[status] || config.pending;
  const Icon = c.icon;
  return <span className={"inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold " + c.color}><Icon className="w-3.5 h-3.5" /> {c.label}</span>;
}

export default function RiderProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rider, setRider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadRider(); }, [user]);

  const loadRider = async () => {
    try {
      const riders = await base44.entities.Rider.list().catch(() => []);
      const matched = riders.find((r) => r.user_id === user?.id || r.name === user?.full_name) || null;
      setRider(matched);
      setForm(matched || {});
    } catch {}
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const vehicleChanged = form.vehicle_number !== rider.vehicle_number || form.license_number !== rider.license_number;
      const updateData = {
        name: form.name, phone: form.phone, email: form.email, address: form.address,
        vehicle_type: form.vehicle_type, vehicle_number: form.vehicle_number, license_number: form.license_number,
      };
      if (vehicleChanged) updateData.kyc_status = "pending";
      await base44.entities.Rider.update(rider.id, updateData);
      await base44.entities.AuditLog.create({ action: "rider_profile_updated", target_type: "rider", target_name: rider.name, details: "Rider updated profile" + (vehicleChanged ? " (KYC reset)" : "") }).catch(() => {});
      setRider({ ...rider, ...updateData });
      setEditing(false);
      toast({ title: "Profile updated!", description: vehicleChanged ? "Vehicle changes require re-verification." : "Changes saved successfully." });
    } catch { toast({ title: "Failed to update profile", variant: "destructive" }); }
    setSaving(false);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !rider?.id) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Rider.update(rider.id, { profile_photo_url: file_url });
      setRider({ ...rider, profile_photo_url: file_url });
      toast({ title: "Photo updated!" });
    } catch { toast({ title: "Upload failed", variant: "destructive" }); }
    setUploading(false);
  };

  const handleDocUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !rider?.id) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Rider.update(rider.id, { vehicle_documents_url: file_url, kyc_status: "pending" });
      setRider({ ...rider, vehicle_documents_url: file_url, kyc_status: "pending" });
      toast({ title: "Document uploaded!", description: "Awaiting admin verification." });
    } catch { toast({ title: "Upload failed", variant: "destructive" }); }
    setUploading(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-background"><Navbar /><div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div><Footer /></div>
  );

  if (!rider) return (
    <div className="min-h-screen bg-background"><Navbar />
      <div className="pt-24 pb-20 px-4 text-center">
        <Bike className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
        <p className="text-foreground/60 mb-4">No rider profile found. Please contact admin to set up your rider account.</p>
        <Link to="/rider"><Button variant="outline">Back to Dashboard</Button></Link>
      </div><Footer />
    </div>
  );

  const vehicleConfig = getVehicleConfig(rider.vehicle_type);
  const inputClass = "w-full h-10 px-3 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-saffron/30 focus:border-saffron";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20 px-4 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <Link to="/rider" className="inline-flex items-center gap-1 text-sm text-foreground/50 hover:text-saffron mb-4"><ChevronLeft className="w-4 h-4" /> Back to Dashboard</Link>

          <div className="bg-card rounded-3xl border border-border p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-saffron/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {rider.profile_photo_url ? <img src={rider.profile_photo_url} alt={rider.name} className="w-full h-full object-cover" /> : <User className="w-10 h-10 text-saffron" />}
                </div>
                <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-saffron text-white flex items-center justify-center cursor-pointer shadow-lg">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                </label>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h1 className="font-display font-extrabold text-2xl text-foreground">{rider.name}</h1>
                {rider.rider_code && <p className="text-sm font-mono text-saffron">{rider.rider_code}</p>}
                <div className="flex flex-wrap items-center gap-2 mt-2 justify-center sm:justify-start">
                  {vehicleConfig && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-saffron/10 text-saffron"><Car className="w-3.5 h-3.5" /> {vehicleConfig.emoji} {vehicleConfig.label}</span>}
                  <StatusBadge status={rider.kyc_status} config={kycConfig} />
                  <StatusBadge status={rider.license_status || (vehicleConfig?.needsLicense === false ? "not_required" : "pending")} config={kycConfig} />
                  <StatusBadge status={rider.vehicle_status || (vehicleConfig?.needsVehicleDocs === false ? "not_required" : "pending")} config={kycConfig} />
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-4 mt-3 text-sm text-foreground/50">
                  <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5" /> {rider.total_deliveries || 0} deliveries</span>
                  <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-saffron" /> {rider.rating?.toFixed(1) || "—"}</span>
                  <span className="flex items-center gap-1"><Wallet className="w-3.5 h-3.5" /> Rs {rider.total_earnings || 0}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-3xl border border-border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2"><User className="w-5 h-5 text-saffron" /> Personal Information</h2>
              {!editing && <Button size="sm" variant="outline" onClick={() => { setForm(rider); setEditing(true); }}>Edit</Button>}
            </div>
            {editing ? (
              <div className="space-y-3">
                <div><label className="text-xs text-foreground/50 font-medium">Full Name</label><input className={inputClass} value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><label className="text-xs text-foreground/50 font-medium">Phone</label><input className={inputClass} value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                  <div><label className="text-xs text-foreground/50 font-medium">Email</label><input className={inputClass} value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                </div>
                <div><label className="text-xs text-foreground/50 font-medium">Address</label><input className={inputClass} value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2 text-foreground/70"><User className="w-4 h-4 text-foreground/40" /> {rider.name}</p>
                <p className="flex items-center gap-2 text-foreground/70"><Phone className="w-4 h-4 text-foreground/40" /> {rider.phone || "Not set"}</p>
                <p className="flex items-center gap-2 text-foreground/70"><Mail className="w-4 h-4 text-foreground/40" /> {rider.email || user?.email || "Not set"}</p>
                <p className="flex items-center gap-2 text-foreground/70"><MapPin className="w-4 h-4 text-foreground/40" /> {rider.address || "Not set"}</p>
              </div>
            )}
          </div>

          <div className="bg-card rounded-3xl border border-border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2"><Bike className="w-5 h-5 text-saffron" /> Vehicle Information</h2>
              {!editing && <Button size="sm" variant="outline" onClick={() => { setForm(rider); setEditing(true); }}>Edit</Button>}
            </div>
            {editing ? (
              <div className="space-y-3">
                <div><label className="text-xs text-foreground/50 font-medium">Vehicle Type</label>
                  <select className={inputClass} value={form.vehicle_type || "motorcycle"} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}>
                    {VEHICLE_TYPES.map((v) => <option key={v.key} value={v.key}>{v.emoji} {v.label}</option>)}
                  </select>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><label className="text-xs text-foreground/50 font-medium">Vehicle Number</label><input className={inputClass} value={form.vehicle_number || ""} onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })} placeholder="e.g. BA 12 PA 3456" /></div>
                  <div><label className="text-xs text-foreground/50 font-medium">License Number</label><input className={inputClass} value={form.license_number || ""} onChange={(e) => setForm({ ...form, license_number: e.target.value })} /></div>
                </div>
                <p className="text-xs text-amber-500 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Changing vehicle details will reset KYC verification.</p>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2 text-foreground/70"><Bike className="w-4 h-4 text-foreground/40" /> {(rider.vehicle_type || "motorcycle").replace(/_/g, " ")}</p>
                {(rider.vehicle_number || rider.number_plate) && <p className="flex items-center gap-2 text-foreground/70"><Car className="w-4 h-4 text-foreground/40" /> {rider.number_plate || rider.vehicle_number}</p>}
                {rider.license_number && <p className="flex items-center gap-2 text-foreground/70"><CreditCard className="w-4 h-4 text-foreground/40" /> License: {rider.license_number}</p>}
                {rider.emergency_contact && <p className="flex items-center gap-2 text-foreground/70"><Phone className="w-4 h-4 text-foreground/40" /> Emergency: {rider.emergency_contact}</p>}
                <div className="pt-2 space-y-1.5">
                  {rider.license_front_url && <DocRow label="License Front" url={rider.license_front_url} />}
                  {rider.license_back_url && <DocRow label="License Back" url={rider.license_back_url} />}
                  {rider.vehicle_bluebook_url && <DocRow label="Vehicle Bluebook" url={rider.vehicle_bluebook_url} />}
                  {rider.insurance_url && <DocRow label="Insurance" url={rider.insurance_url} />}
                  {rider.citizenship_front_url && <DocRow label="Citizenship Front" url={rider.citizenship_front_url} />}
                  {rider.citizenship_back_url && <DocRow label="Citizenship Back" url={rider.citizenship_back_url} />}
                  {rider.vehicle_documents_url && <DocRow label="Other Documents" url={rider.vehicle_documents_url} />}
                </div>
              </div>
            )}
            {editing && (
              <div className="mt-4 pt-4 border-t border-border">
                <label className="text-xs text-foreground/50 font-medium">Upload Vehicle Document</label>
                <label className="mt-1 flex items-center justify-center gap-2 h-10 rounded-xl border border-dashed border-border cursor-pointer hover:bg-muted/50 text-sm text-foreground/50">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><FileText className="w-4 h-4" /> Choose file</>}
                  <input type="file" className="hidden" onChange={handleDocUpload} disabled={uploading} />
                </label>
              </div>
            )}
          </div>

          <div className="bg-card rounded-3xl border border-border p-6 mb-6">
            <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2 mb-4"><Shield className="w-5 h-5 text-saffron" /> Account Information</h2>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-foreground/40">Rider Code</p><p className="text-foreground/70 font-mono text-saffron">{rider.rider_code || "—"}</p></div>
              <div><p className="text-xs text-foreground/40">Vehicle Type</p><p className="text-foreground/70 capitalize">{vehicleConfig ? `${vehicleConfig.emoji} ${vehicleConfig.label}` : (rider.vehicle_type || "—").replace(/_/g, " ")}</p></div>
              <div><p className="text-xs text-foreground/40">KYC Status</p><StatusBadge status={rider.kyc_status} config={kycConfig} /></div>
              <div><p className="text-xs text-foreground/40">License Status</p><StatusBadge status={rider.license_status || (vehicleConfig?.needsLicense === false ? "not_required" : "pending")} config={kycConfig} /></div>
              <div><p className="text-xs text-foreground/40">Vehicle Status</p><StatusBadge status={rider.vehicle_status || (vehicleConfig?.needsVehicleDocs === false ? "not_required" : "pending")} config={kycConfig} /></div>
              <div><p className="text-xs text-foreground/40">Current Status</p><p className="text-foreground/70 capitalize">{(rider.status || "available").replace(/_/g, " ")}</p></div>
              <div><p className="text-xs text-foreground/40">Account Status</p><p className={rider.is_suspended ? "text-red-500 font-medium" : "text-terai font-medium"}>{rider.is_suspended ? "Suspended" : "Active"}</p></div>
              <div><p className="text-xs text-foreground/40">Joining Date</p><p className="text-foreground/70 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {rider.created_date ? new Date(rider.created_date).toLocaleDateString() : "—"}</p></div>
            </div>
          </div>

          {editing && (
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setEditing(false); setForm(rider); }} disabled={saving}>Cancel</Button>
              <Button className="flex-1 bg-saffron hover:bg-saffron/90" onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes</Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function DocRow({ label, url }) {
  return (
    <div className="flex items-center gap-2 text-foreground/70">
      <FileText className="w-4 h-4 text-foreground/40" /> {label}: <a href={url} target="_blank" rel="noopener noreferrer" className="text-saffron underline">View</a>
    </div>
  );
}