import React, { useState } from "react";
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
import MediaUploader from "@/components/MediaUploader";
import { Store, CheckCircle2, Loader2, TrendingUp, Users, Truck } from "lucide-react";

const benefits = [
  { icon: TrendingUp, title: "Grow Your Sales", desc: "Reach thousands of hungry customers across Dhangadhi with zero marketing cost." },
  { icon: Users, title: "New Customers", desc: "Tap into our growing user base and turn first-time orders into loyal repeat customers." },
  { icon: Truck, title: "Delivery Handled", desc: "Our riders handle delivery so you can focus on what you do best — great food and products." },
];

const categories = ["Restaurant", "Grocery", "Pharmacy", "Bakery", "Fashion", "Electronics", "Health & Beauty", "Home & Living", "Other"];

export default function BecomePartner() {
  const { toast } = useToast();
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function update(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.entities.MerchantApplication.create({
        business_name: form.business_name,
        owner_name: form.owner_name,
        phone_number: form.phone,
        email: form.email,
        pan_number: form.pan,
        business_address: form.address,
        store_category: form.category,
        applicant_type: "merchant",
        logo_url: form.logo_url || undefined,
        banner_url: form.banner_url || undefined,
        media_gallery: Array.isArray(form.media) && form.media.length > 0 ? JSON.stringify(form.media) : undefined,
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
        <PageHero title="Partner With Us" subtitle="Grow your business with Dhangadhi Dash" icon={Store} />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
          <CheckCircle2 className="w-16 h-16 text-terai mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Thank You for Applying!</h2>
          <p className="text-sm text-foreground/60 mb-6">We've received your partnership application. Our team will review it and contact you at <span className="font-medium text-foreground">{form.email}</span> within 48 hours.</p>
          <div className="bg-card border border-border rounded-2xl p-5 text-left mb-6">
            <p className="text-xs text-foreground/50 mb-2">What happens next?</p>
            <ol className="space-y-2 text-sm text-foreground/70">
              <li>1. Our team reviews your application</li>
              <li>2. We verify your business documents</li>
              <li>3. We schedule an onboarding call</li>
              <li>4. Your store goes live on Dhangadhi Dash</li>
            </ol>
          </div>
          <Link to="/"><Button className="h-12">Back to Home</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PageHero title="Partner With Us" subtitle="List your restaurant or shop and reach customers across Dhangadhi." icon={Store} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          {benefits.map((b) => (
            <div key={b.title} className="bg-card border border-border rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-saffron/10 flex items-center justify-center mb-3"><b.icon className="w-5 h-5 text-saffron" /></div>
              <h3 className="font-bold text-sm text-foreground mb-1">{b.title}</h3>
              <p className="text-xs text-foreground/60">{b.desc}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="font-display font-bold text-lg text-foreground mb-2">Store Details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Business Name" value={form.business_name} onChange={(v) => update("business_name", v)} placeholder="e.g. Himalaya Kitchen" required />
            <Field label="Owner Name" value={form.owner_name} onChange={(v) => update("owner_name", v)} placeholder="Full name" required />
            <Field label="Phone Number" value={form.phone} onChange={(v) => update("phone", v)} placeholder="98XXXXXXXX" required type="tel" />
            <Field label="Email" value={form.email} onChange={(v) => update("email", v)} placeholder="owner@store.com" required type="email" />
            <Field label="PAN Number" value={form.pan} onChange={(v) => update("pan", v)} placeholder="PAN number" required />
            <div className="space-y-2">
              <Label>Store Category</Label>
              <select value={form.category || ""} onChange={(e) => update("category", e.target.value)} required className="flex h-12 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Select category</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Business Address</Label>
            <Input value={form.address || ""} onChange={(e) => update("address", e.target.value)} placeholder="Full business address in Dhangadhi" className="h-12" required />
          </div>

          {/* Media Uploads */}
          <div className="pt-2 border-t border-border">
            <p className="text-xs font-bold text-foreground/40 uppercase">Showcase Your Store</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <FileUploadField label="Store Logo" value={form.logo_url || ""} onChange={(v) => update("logo_url", v)} accept="image/*" />
            <FileUploadField label="Storefront Banner" value={form.banner_url || ""} onChange={(v) => update("banner_url", v)} accept="image/*" />
          </div>
          <MediaUploader label="Photo & Video Gallery" value={form.media || []} onChange={(v) => update("media", v)} />
          <p className="text-xs text-foreground/40 -mt-2">Showcase your products, ambiance, and storefront. Admins will review these during approval.</p>

          <Button type="submit" disabled={loading} className="w-full h-12 font-medium">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : "Submit Application"}
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