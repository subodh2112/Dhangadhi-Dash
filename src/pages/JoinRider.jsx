import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import FileUploadField from "@/components/FileUploadField";
import { DOC_FIELDS } from "@/lib/vehicleKyc";
import { useVehicleKycConfig } from "@/hooks/useVehicleKycConfig";
import { Bike, CheckCircle2, Loader2, Wallet, Clock, Shield, AlertCircle, Info } from "lucide-react";

const benefits = [
  { icon: Wallet, title: "Earn More", desc: "Competitive per-delivery pay plus 100% of your tips. Earn up to Rs. 800/day." },
  { icon: Clock, title: "Flexible Hours", desc: "Work when you want. Choose your own shifts — part-time or full-time." },
  { icon: Shield, title: "Insured & Safe", desc: "Accident insurance coverage and safety gear provided to all active riders." },
];

const requirements = [
  "At least 18 years old",
  "Smartphone with active internet",
  "Valid citizenship or ID proof",
  "Knowledge of Dhangadhi local areas",
  "Vehicle-specific documents (see below)",
];

export default function JoinRider() {
  const { toast } = useToast();
  const { enabledVehicleTypes, isDocRequired, getRequiredDocsFor } = useVehicleKycConfig();
  const [form, setForm] = useState({ vehicle_type: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function update(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  const vehicleConfig = enabledVehicleTypes.find((v) => v.key === form.vehicle_type);
  const requiredDocs = useMemo(() => getRequiredDocsFor(form.vehicle_type), [form.vehicle_type, getRequiredDocsFor]);
  const optionalDocs = useMemo(
    () => Object.keys(DOC_FIELDS).filter((docKey) => !isDocRequired(form.vehicle_type, docKey) && DOC_FIELDS[docKey].optional),
    [form.vehicle_type, isDocRequired]
  );
  const missingDocs = useMemo(
    () => requiredDocs
      .filter((field) => !form[field] || (typeof form[field] === "string" && form[field].trim() === ""))
      .map((field) => ({ field, label: DOC_FIELDS[field]?.label || field })),
    [requiredDocs, form]
  );

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.vehicle_type) {
      toast({ title: "Select a vehicle type", variant: "destructive" });
      return;
    }
    if (missingDocs.length > 0) {
      toast({
        title: "Missing required documents",
        description: missingDocs.map((d) => d.label).join(", "),
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      await base44.entities.MerchantApplication.create({
        business_name: form.name,
        owner_name: form.name,
        phone_number: form.phone,
        email: form.email,
        pan_number: "N/A",
        business_address: form.address,
        store_category: "N/A",
        applicant_type: "rider",
        vehicle_type: form.vehicle_type,
        license_number: form.license_number || "N/A",
        license_front_url: form.license_front_url || null,
        license_back_url: form.license_back_url || null,
        vehicle_bluebook_url: form.vehicle_bluebook_url || null,
        number_plate: form.number_plate || null,
        insurance_url: form.insurance_url || null,
        emergency_contact: form.emergency_contact || null,
        profile_photo_url: form.profile_photo_url || null,
        citizenship_front_url: form.citizenship_front_url || null,
        citizenship_back_url: form.citizenship_back_url || null,
      });
      setSubmitted(true);
      toast({ title: "Application Submitted!", description: "We'll review and contact you within 48 hours." });
    } catch (err) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <PageHero title="Join Our Riders" subtitle="Deliver. Earn. Grow with Dhangadhi Dash." icon={Bike} gradient="from-terai to-emerald-700" />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
          <CheckCircle2 className="w-16 h-16 text-terai mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Application Received!</h2>
          <p className="text-sm text-foreground/60 mb-6">Thanks for choosing to ride with Dhangadhi Dash. We'll review your application and reach out at <span className="font-medium text-foreground">{form.email}</span> within 48 hours.</p>
          <div className="bg-card border border-border rounded-2xl p-5 text-left mb-6">
            <p className="text-xs text-foreground/50 mb-2">Next steps:</p>
            <ol className="space-y-2 text-sm text-foreground/70">
              <li>1. Document verification (KYC & vehicle docs)</li>
              <li>2. Onboarding & safety training session</li>
              <li>3. Receive your rider kit & app access</li>
              <li>4. Start delivering and earning!</li>
            </ol>
          </div>
          <Link to="/"><Button className="h-12">Back to Home</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  const inputClass = "flex h-12 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-saffron/30";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PageHero title="Join Our Riders" subtitle="Become a delivery rider and earn on your own schedule." icon={Bike} gradient="from-terai to-emerald-700" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          {benefits.map((b) => (
            <div key={b.title} className="bg-card border border-border rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-terai/10 flex items-center justify-center mb-3"><b.icon className="w-5 h-5 text-terai" /></div>
              <h3 className="font-bold text-sm text-foreground mb-1">{b.title}</h3>
              <p className="text-xs text-foreground/60">{b.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h2 className="font-display font-bold text-lg text-foreground mb-3">Requirements</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {requirements.map((r) => (
              <div key={r} className="flex items-center gap-2 text-sm text-foreground/70"><CheckCircle2 className="w-4 h-4 text-terai flex-shrink-0" /> {r}</div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-6">
          <h2 className="font-display font-bold text-lg text-foreground">Rider Application</h2>

          {/* Basic Info */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Full Name" value={form.name} onChange={(v) => update("name", v)} placeholder="Your full name" required />
            <Field label="Phone Number" value={form.phone} onChange={(v) => update("phone", v)} placeholder="98XXXXXXXX" required type="tel" />
            <Field label="Email" value={form.email} onChange={(v) => update("email", v)} placeholder="email@example.com" required type="email" />
            <Field label="Current Address" value={form.address} onChange={(v) => update("address", v)} placeholder="Your address in Dhangadhi" required />
          </div>

          {/* Vehicle Type */}
          <div>
            <Label className="mb-3 block">Select Your Vehicle Type</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {enabledVehicleTypes.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => update("vehicle_type", v.key)}
                  className={`flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 transition-all ${form.vehicle_type === v.key ? "border-saffron bg-saffron/5" : "border-border hover:border-saffron/40"}`}
                >
                  <span className="text-3xl">{v.emoji}</span>
                  <span className="text-xs font-bold text-foreground text-center">{v.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Conditional message for bicycle */}
          {vehicleConfig?.group === "bicycle" && (
            <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4">
              <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700 dark:text-blue-400">Bicycle riders are not required to provide a driving license or vehicle registration.</p>
            </div>
          )}

          {/* Conditional Documents */}
          {form.vehicle_type && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-foreground">Required Documents</h3>
                <span className="text-xs text-foreground/40">for {vehicleConfig?.label}</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {requiredDocs.map((field) => {
                  const doc = DOC_FIELDS[field];
                  if (!doc) return null;
                  if (doc.type === "file") {
                    return (
                      <FileUploadField
                        key={field}
                        label={doc.label + " *"}
                        value={form[field] || ""}
                        onChange={(url) => update(field, url)}
                      />
                    );
                  }
                  return (
                    <div key={field} className="space-y-2">
                      <Label>{doc.label} *</Label>
                      <Input
                        value={form[field] || ""}
                        onChange={(e) => update(field, e.target.value)}
                        placeholder={field === "emergency_contact" ? "98XXXXXXXX (emergency)" : field === "number_plate" ? "BA 12 PA 3456" : ""}
                        className="h-12"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Optional Documents */}
              {optionalDocs.length > 0 && (
                <>
                  <h3 className="font-bold text-sm text-foreground/60 pt-2">Optional Documents</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {optionalDocs.map((field) => {
                      const doc = DOC_FIELDS[field];
                      if (!doc) return null;
                      if (doc.type === "file") {
                        return (
                          <FileUploadField
                            key={field}
                            label={doc.label}
                            value={form[field] || ""}
                            onChange={(url) => update(field, url)}
                          />
                        );
                      }
                      return (
                        <div key={field} className="space-y-2">
                          <Label>{doc.label}</Label>
                          <Input
                            value={form[field] || ""}
                            onChange={(e) => update(field, e.target.value)}
                            placeholder={field === "emergency_contact" ? "98XXXXXXXX (emergency)" : ""}
                            className="h-12"
                          />
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Validation Summary */}
              {missingDocs.length > 0 ? (
                <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4">
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-700 dark:text-amber-400">
                    <p className="font-medium mb-1">Please complete these required documents:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {missingDocs.map((d) => <li key={d.field}>{d.label}</li>)}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-terai/5 border border-terai/20 rounded-xl p-4">
                  <CheckCircle2 className="w-4 h-4 text-terai flex-shrink-0" />
                  <p className="text-sm text-terai font-medium">All required documents provided. Ready to submit!</p>
                </div>
              )}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !form.vehicle_type || missingDocs.length > 0}
            className="w-full h-12 font-medium bg-terai hover:bg-terai/90"
          >
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : "Apply to Ride"}
          </Button>
        </form>
      </div>
      <Footer />
    </div>
  );
}

function Field({ label, value, onChange, placeholder, required, type }) {
  return (
    <div className="space-y-2">
      <Label>{label}{required && " *"}</Label>
      <Input type={type || "text"} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-12" required={required} />
    </div>
  );
}