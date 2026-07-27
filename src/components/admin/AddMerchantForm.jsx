import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { logAdminAction } from "@/lib/adminLog";
import { INDUSTRY_CATEGORIES } from "@/lib/categories";
import {
  generateMerchantCode, generateStoreCode, generateUsername, generateStrongPassword,
  fetchExistingCodes, createMerchantAccount,
} from "@/lib/merchantUtils";
import FileUploadField from "@/components/FileUploadField";
import { RefreshCw, Loader2, Check, Copy, Save, Mail, Store as StoreIcon } from "lucide-react";

const emptyForm = {
  businessName: "", ownerName: "", phone: "", email: "", address: "",
  panNumber: "", businessRegNumber: "", category: "food",
  storeName: "", storeAddress: "", latitude: "", longitude: "",
  deliveryRadius: "", openingTime: "", closingTime: "",
  deliveryFee: "40", deliveryMinutes: "30",
  username: "", password: "", merchantCode: "", storeCode: "",
  status: "active", description: "",
  logo_url: "",
};

export default function AddMerchantForm({ editStore, onSaved, onCancel }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [codes, setCodes] = useState({ stores: [], apps: [] });
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState("");
  const [usernameManual, setUsernameManual] = useState(false);

  useEffect(() => {
    fetchExistingCodes().then(setCodes);
  }, []);

  useEffect(() => {
    if (editStore) {
      setForm({
        businessName: editStore.name || "",
        ownerName: editStore.owner_name || "",
        phone: editStore.phone || "",
        email: editStore.owner_email || "",
        address: editStore.address || "",
        panNumber: editStore.pan_number || "",
        businessRegNumber: editStore.business_registration_number || "",
        category: editStore.category || "food",
        storeName: editStore.name || "",
        storeAddress: editStore.address || "",
        latitude: editStore.latitude || "",
        longitude: editStore.longitude || "",
        deliveryRadius: editStore.delivery_radius || "",
        openingTime: editStore.opening_time || "",
        closingTime: editStore.closing_time || "",
        deliveryFee: String(editStore.delivery_fee || 40),
        deliveryMinutes: String(editStore.delivery_minutes || 30),
        username: editStore.username || "",
        password: editStore.temporary_password || "",
        merchantCode: editStore.merchant_code || "",
        storeCode: editStore.store_code || "",
        status: editStore.is_suspended ? "suspended" : "active",
        description: editStore.description || "",
        logo_url: editStore.logo_url || editStore.image_url || "",
      });
    }
  }, [editStore]);

  // Auto-generate username from business name
  useEffect(() => {
    if (!editStore && !usernameManual && form.businessName) {
      setForm((f) => ({ ...f, username: generateUsername(f.businessName, codes.stores.map((s) => s.username)) }));
    }
  }, [form.businessName, usernameManual, editStore, codes.stores]);

  // Auto-generate codes and password on first load (only for new merchants)
  useEffect(() => {
    if (!editStore && codes.stores.length > 0 && !form.merchantCode) {
      setForm((f) => ({
        ...f,
        merchantCode: generateMerchantCode(codes.stores, codes.apps),
        storeCode: generateStoreCode(codes.stores),
        password: generateStrongPassword(),
      }));
    }
  }, [editStore, codes, form.merchantCode]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (sendEmail) => {
    if (!form.businessName.trim()) { toast({ title: "Business name is required", variant: "destructive" }); return; }
    if (!form.email.trim()) { toast({ title: "Email is required", variant: "destructive" }); return; }
    if (!form.panNumber.trim()) { toast({ title: "PAN number is required", variant: "destructive" }); return; }
    if (submitting) return;
    setSubmitting(true);
    try {
      if (editStore) {
        await base44.entities.Store.update(editStore.id, {
          name: form.storeName || form.businessName,
          category: form.category,
          description: form.description,
          address: form.storeAddress || form.address,
          phone: form.phone,
          owner_name: form.ownerName,
          owner_email: form.email,
          pan_number: form.panNumber,
          business_registration_number: form.businessRegNumber,
          username: form.username,
          opening_time: form.openingTime,
          closing_time: form.closingTime,
          latitude: form.latitude ? Number(form.latitude) : undefined,
          longitude: form.longitude ? Number(form.longitude) : undefined,
          delivery_radius: form.deliveryRadius ? Number(form.deliveryRadius) : undefined,
          delivery_fee: Number(form.deliveryFee) || 40,
          delivery_minutes: Number(form.deliveryMinutes) || 30,
          is_suspended: form.status === "suspended",
          is_open: form.status === "active",
          logo_url: form.logo_url || undefined,
          image_url: form.logo_url || undefined,
        });
        await logAdminAction("Updated merchant: " + form.businessName, "merchant", form.merchantCode, "");
        toast({ title: "Merchant updated" });
        onSaved();
      } else {
        const result = await createMerchantAccount(form, codes, sendEmail);
        await logAdminAction("Created merchant: " + form.businessName, "merchant", result.merchantCode, "");
        setCreated(result);
        toast({ title: "Merchant account created!" });
      }
    } catch (err) {
      toast({ title: err.message || "Failed to save", variant: "destructive" });
    }
    setSubmitting(false);
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(""), 2000);
  };

  const inputClass = "w-full h-11 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-saffron/40 focus:border-saffron";
  const labelClass = "text-xs font-bold text-foreground/60 uppercase tracking-wide mb-1.5 block";

  if (created) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 max-w-lg mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-terai/10 flex items-center justify-center mx-auto mb-3"><Check className="w-8 h-8 text-terai" /></div>
          <h3 className="font-display font-bold text-lg text-foreground">Merchant Account Created!</h3>
          <p className="text-sm text-foreground/50 mt-1">{form.businessName}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-saffron/5 rounded-xl p-3 text-center border border-saffron/10">
            <p className="text-[10px] font-bold text-foreground/40 uppercase">Merchant Code</p>
            <p className="text-lg font-mono font-extrabold text-saffron">{created.merchantCode}</p>
          </div>
          <div className="bg-terai/5 rounded-xl p-3 text-center border border-terai/10">
            <p className="text-[10px] font-bold text-foreground/40 uppercase">Store Code</p>
            <p className="text-lg font-mono font-extrabold text-terai">{created.storeCode}</p>
          </div>
        </div>
        <div className="bg-muted rounded-xl p-4 space-y-2.5">
          <p className="text-xs font-bold text-foreground/40 uppercase mb-1">Login Credentials</p>
          {[
            { label: "Email", value: form.email, key: "email" },
            { label: "Username", value: created.username, key: "user" },
            { label: "Password", value: created.password, key: "pass" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <span className="text-sm text-foreground"><span className="text-foreground/50">{item.label}:</span> <span className="font-mono font-bold">{item.value}</span></span>
              <button onClick={() => copyToClipboard(item.value, item.key)} className="text-saffron hover:text-saffron/70">{copied === item.key ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button>
            </div>
          ))}
        </div>
        <p className="text-xs text-foreground/40 text-center mt-3">An email with credentials has been sent. Merchant must change password on first login.</p>
        <button onClick={onSaved} className="w-full h-11 rounded-xl bg-saffron text-white font-bold mt-4 hover:bg-saffron/90">Done</button>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h3 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2">
        <StoreIcon className="w-5 h-5 text-saffron" /> {editStore ? "Edit Merchant" : "Add New Merchant"}
      </h3>
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Business Info */}
        <div><label className={labelClass}>Business Name *</label><input className={inputClass} value={form.businessName} onChange={(e) => set("businessName", e.target.value)} placeholder="e.g. Old House Restaurant" /></div>
        <div><label className={labelClass}>Owner Name</label><input className={inputClass} value={form.ownerName} onChange={(e) => set("ownerName", e.target.value)} placeholder="Full name" /></div>
        <div><label className={labelClass}>Phone</label><input className={inputClass} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="98XXXXXXXX" /></div>
        <div><label className={labelClass}>Email *</label><input type="email" className={inputClass} value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="merchant@email.com" /></div>
        <div className="sm:col-span-2"><label className={labelClass}>Address</label><input className={inputClass} value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Street, Dhangadhi" /></div>
        <div><label className={labelClass}>PAN Number *</label><input className={inputClass} value={form.panNumber} onChange={(e) => set("panNumber", e.target.value)} placeholder="123456789" /></div>
        <div><label className={labelClass}>Business Reg. Number</label><input className={inputClass} value={form.businessRegNumber} onChange={(e) => set("businessRegNumber", e.target.value)} placeholder="BR-12345" /></div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Category</label>
          <select className={inputClass} value={form.category} onChange={(e) => set("category", e.target.value)}>
            {INDUSTRY_CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.emoji} {c.name}</option>)}
          </select>
        </div>

        {/* Store Details */}
        <div className="sm:col-span-2 pt-2 border-t border-border"><p className="text-xs font-bold text-foreground/40 uppercase">Store Details</p></div>
        <div><label className={labelClass}>Store Name</label><input className={inputClass} value={form.storeName} onChange={(e) => set("storeName", e.target.value)} placeholder="Same as business if empty" /></div>
        <div><label className={labelClass}>Store Address</label><input className={inputClass} value={form.storeAddress} onChange={(e) => set("storeAddress", e.target.value)} placeholder="Store location" /></div>
        <div><label className={labelClass}>Latitude</label><input type="number" step="any" className={inputClass} value={form.latitude} onChange={(e) => set("latitude", e.target.value)} placeholder="28.6969" /></div>
        <div><label className={labelClass}>Longitude</label><input type="number" step="any" className={inputClass} value={form.longitude} onChange={(e) => set("longitude", e.target.value)} placeholder="80.5951" /></div>
        <div><label className={labelClass}>Delivery Radius (km)</label><input type="number" className={inputClass} value={form.deliveryRadius} onChange={(e) => set("deliveryRadius", e.target.value)} placeholder="5" /></div>
        <div><label className={labelClass}>Delivery Fee (Rs)</label><input type="number" className={inputClass} value={form.deliveryFee} onChange={(e) => set("deliveryFee", e.target.value)} /></div>
        <div><label className={labelClass}>Delivery Time (min)</label><input type="number" className={inputClass} value={form.deliveryMinutes} onChange={(e) => set("deliveryMinutes", e.target.value)} /></div>
        <div><label className={labelClass}>Opening Time</label><input type="time" className={inputClass} value={form.openingTime} onChange={(e) => set("openingTime", e.target.value)} /></div>
        <div><label className={labelClass}>Closing Time</label><input type="time" className={inputClass} value={form.closingTime} onChange={(e) => set("closingTime", e.target.value)} /></div>

        {/* Credentials */}
        <div className="sm:col-span-2 pt-2 border-t border-border"><p className="text-xs font-bold text-foreground/40 uppercase">Credentials &amp; Codes</p></div>
        <div>
          <label className={labelClass}>Username</label>
          <div className="flex gap-2">
            <input className={inputClass} value={form.username} onChange={(e) => { set("username", e.target.value); setUsernameManual(true); }} placeholder="auto-generated" />
            <button type="button" onClick={() => { set("username", generateUsername(form.businessName || "merchant", codes.stores.map((s) => s.username))); setUsernameManual(true); }} className="px-3 rounded-xl border border-border text-foreground/60 hover:text-saffron hover:border-saffron/40 flex-shrink-0"><RefreshCw className="w-4 h-4" /></button>
          </div>
        </div>
        <div>
          <label className={labelClass}>Temporary Password</label>
          <div className="flex gap-2">
            <input className={inputClass + " font-mono"} value={form.password} onChange={(e) => set("password", e.target.value)} />
            <button type="button" onClick={() => set("password", generateStrongPassword())} className="px-3 rounded-xl border border-border text-foreground/60 hover:text-saffron hover:border-saffron/40 flex-shrink-0"><RefreshCw className="w-4 h-4" /></button>
          </div>
        </div>
        <div>
          <label className={labelClass}>Merchant Code</label>
          <div className="flex gap-2">
            <input className={inputClass + " font-mono"} value={form.merchantCode} readOnly />
            <button type="button" onClick={() => set("merchantCode", generateMerchantCode(codes.stores, codes.apps))} className="px-3 rounded-xl border border-border text-foreground/60 hover:text-saffron hover:border-saffron/40 flex-shrink-0"><RefreshCw className="w-4 h-4" /></button>
          </div>
        </div>
        <div>
          <label className={labelClass}>Store Code</label>
          <div className="flex gap-2">
            <input className={inputClass + " font-mono"} value={form.storeCode} readOnly />
            <button type="button" onClick={() => set("storeCode", generateStoreCode(codes.stores))} className="px-3 rounded-xl border border-border text-foreground/60 hover:text-saffron hover:border-saffron/40 flex-shrink-0"><RefreshCw className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="sm:col-span-2">
          <FileUploadField label="Store Logo" value={form.logo_url} onChange={(v) => set("logo_url", v)} accept="image/*" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Status</label>
          <select className={inputClass} value={form.status} onChange={(e) => set("status", e.target.value)}>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        {editStore ? (
          <button onClick={() => handleSubmit(false)} disabled={submitting} className="flex-1 h-11 rounded-xl bg-saffron text-white font-bold hover:bg-saffron/90 disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        ) : (
          <>
            <button onClick={() => handleSubmit(false)} disabled={submitting} className="flex-1 h-11 rounded-xl border border-border text-foreground/70 font-bold hover:bg-muted disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save</>}
            </button>
            <button onClick={() => handleSubmit(true)} disabled={submitting} className="flex-1 h-11 rounded-xl bg-saffron text-white font-bold hover:bg-saffron/90 disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Mail className="w-4 h-4" /> Save &amp; Send Credentials</>}
            </button>
          </>
        )}
        <button onClick={onCancel} className="px-4 h-11 rounded-xl border border-border text-foreground/50 font-bold hover:text-foreground">Cancel</button>
      </div>
    </div>
  );
}