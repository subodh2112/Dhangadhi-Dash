import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, User, Banknote, Loader2, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FileUploadField from "@/components/FileUploadField";
import { useToast } from "@/components/ui/use-toast";
import MobileBackButton from "@/components/MobileBackButton";
import BottomSheetSelect from "@/components/BottomSheetSelect";

const categories = [
  "restaurant", "grocery", "bakery", "cakes", "fast_food", "flower_shop", "stationery", "pet_shop", "household",
];

export default function Apply() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [applicantType, setApplicantType] = useState("merchant");
  const [form, setForm] = useState({
    business_name: "", owner_name: "", phone_number: "", email: "",
    pan_number: "", business_registration_number: "", business_address: "",
    google_maps_location: "", store_category: "restaurant",
    logo_url: "", banner_url: "", registration_certificate_url: "",
    pan_certificate_url: "", citizenship_front_url: "", citizenship_back_url: "",
    bank_details: "", vehicle_type: "", license_number: "",
  });

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.business_name || !form.owner_name || !form.phone_number || !form.email || !form.pan_number || !form.business_address) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await base44.entities.MerchantApplication.create({ ...form, applicant_type: applicantType, status: "pending" });
      await base44.entities.AuditLog.create({ action: "application_submitted", target_type: applicantType, target_name: form.business_name, details: `Application submitted by ${form.email}` });
      setSubmitted(true);
    } catch {
      toast({ title: "Submission failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-20 px-4 flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <CheckCircle className="w-16 h-16 text-terai mx-auto mb-4" />
            <h1 className="font-display font-extrabold text-2xl text-foreground mb-2">Application Submitted!</h1>
            <p className="text-foreground/50 text-sm mb-6">Your application is now pending review. Our team will contact you within 2-3 business days.</p>
            <Button onClick={() => navigate("/")} className="bg-saffron hover:bg-saffron/90">Back to Home</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20 px-4 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <MobileBackButton />
          <div className="mb-8 text-center">
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground">Join Dhangadhi Dash</h1>
            <p className="text-foreground/50 text-sm mt-1">Apply to become a merchant or rider partner.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {["merchant", "rider"].map((type) => (
              <button key={type} type="button" onClick={() => setApplicantType(type)} className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${applicantType === type ? "border-saffron bg-saffron/5 text-saffron" : "border-border text-foreground/50"}`}>
                {type === "merchant" ? "Become a Merchant" : "Become a Rider"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-card rounded-3xl border border-border p-6 space-y-4">
              <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2"><Building2 className="w-5 h-5 text-saffron" /> Business Information</h2>
              <div><Label>Business Name *</Label><Input value={form.business_name} onChange={(e) => set("business_name", e.target.value)} className="h-12" required /></div>
              <div>
                <Label>Store Category *</Label>
                <BottomSheetSelect
                  value={form.store_category}
                  onChange={(val) => set("store_category", val)}
                  options={categories.map((c) => ({ value: c, label: c.replace("_", " ") }))}
                  placeholder="Select category"
                  label="Store Category"
                />
              </div>
              <div><Label>Business Address *</Label><Input value={form.business_address} onChange={(e) => set("business_address", e.target.value)} className="h-12" required /></div>
              <div><Label>Google Maps Location</Label><Input value={form.google_maps_location} onChange={(e) => set("google_maps_location", e.target.value)} placeholder="Paste Google Maps link" className="h-12" /></div>
              <div><Label>Business Registration Number</Label><Input value={form.business_registration_number} onChange={(e) => set("business_registration_number", e.target.value)} className="h-12" /></div>
              {applicantType === "rider" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Vehicle Type</Label>
                    <BottomSheetSelect
                      value={form.vehicle_type}
                      onChange={(val) => set("vehicle_type", val)}
                      options={[
                        { value: "cycle", label: "Cycle (Bicycle)" },
                        { value: "bike", label: "Bike" },
                        { value: "scooter", label: "Scooter" },
                        { value: "motorcycle", label: "Motorcycle" },
                      ]}
                      placeholder="Select vehicle"
                      label="Vehicle Type"
                    />
                  </div>
                  {form.vehicle_type && form.vehicle_type !== "cycle" && (
                    <div><Label>License Number *</Label><Input value={form.license_number} onChange={(e) => set("license_number", e.target.value)} placeholder="Driving license no." className="h-12" /></div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-card rounded-3xl border border-border p-6 space-y-4">
              <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2"><User className="w-5 h-5 text-saffron" /> Owner Information</h2>
              <div><Label>Owner Name *</Label><Input value={form.owner_name} onChange={(e) => set("owner_name", e.target.value)} className="h-12" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Phone Number *</Label><Input type="tel" value={form.phone_number} onChange={(e) => set("phone_number", e.target.value)} className="h-12" required /></div>
                <div><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="h-12" required /></div>
              </div>
              <div><Label>PAN Number *</Label><Input value={form.pan_number} onChange={(e) => set("pan_number", e.target.value)} className="h-12" required /></div>
            </div>

            <div className="bg-card rounded-3xl border border-border p-6 space-y-4">
              <h2 className="font-display font-bold text-lg text-foreground">Documents</h2>
              <div className="grid grid-cols-2 gap-4">
                <FileUploadField label="Store Logo" value={form.logo_url} onChange={(v) => set("logo_url", v)} />
                <FileUploadField label="Store Banner" value={form.banner_url} onChange={(v) => set("banner_url", v)} />
                <FileUploadField label="Registration Certificate" value={form.registration_certificate_url} onChange={(v) => set("registration_certificate_url", v)} />
                <FileUploadField label="PAN Certificate" value={form.pan_certificate_url} onChange={(v) => set("pan_certificate_url", v)} />
                <FileUploadField label="Citizenship (Front)" value={form.citizenship_front_url} onChange={(v) => set("citizenship_front_url", v)} />
                <FileUploadField label="Citizenship (Back)" value={form.citizenship_back_url} onChange={(v) => set("citizenship_back_url", v)} />
              </div>
            </div>

            <div className="bg-card rounded-3xl border border-border p-6 space-y-4">
              <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2"><Banknote className="w-5 h-5 text-saffron" /> Bank Details</h2>
              <textarea value={form.bank_details} onChange={(e) => set("bank_details", e.target.value)} rows={3} className="w-full px-3 py-2 rounded-xl border border-input bg-card text-sm" placeholder="Bank name, account number, account holder name" />
            </div>

            <Button type="submit" className="w-full h-12 font-bold" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : "Submit Application"}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}