import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { MessageSquare, Loader2, CheckCircle2, Lightbulb } from "lucide-react";

const categories = [
  { value: "other", label: "General Feedback" },
  { value: "order_issue", label: "Order Experience" },
  { value: "merchant_issue", label: "Store Feedback" },
  { value: "rider_issue", label: "Rider Feedback" },
  { value: "technical_problem", label: "App Suggestion" },
];

export default function FeedbackCorner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: user?.full_name || "",
    email: user?.email || "",
    subject: "",
    message: "",
    category: "other",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function update(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.entities.SupportTicket.create({
        subject: form.subject,
        description: form.message,
        user_name: form.name,
        user_email: form.email,
        user_type: user ? "customer" : "customer",
        category: form.category,
      });
      setSubmitted(true);
      toast({ title: "Feedback Submitted!", description: "Thank you for helping us improve." });
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
        <PageHero title="Feedback Corner" subtitle="Help us make Dhangadhi Dash better." icon={MessageSquare} gradient="from-purple-600 to-pink-600" />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
          <CheckCircle2 className="w-16 h-16 text-terai mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Thank You!</h2>
          <p className="text-sm text-foreground/60 mb-6">Your feedback has been submitted. We read every suggestion and use them to improve our services for the Dhangadhi community.</p>
          <Button onClick={() => { setSubmitted(false); setForm({ name: user?.full_name || "", email: user?.email || "", subject: "", message: "", category: "other" }); }} variant="outline" className="h-12">
            Submit Another
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PageHero title="Feedback Corner" subtitle="Share your ideas and suggestions to improve our local services." icon={MessageSquare} gradient="from-purple-600 to-pink-600" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid sm:grid-cols-3 gap-3 mb-8">
          {[
            { icon: Lightbulb, title: "Share Ideas", desc: "Have an idea for a new feature or service?" },
            { icon: MessageSquare, title: "Report Issues", desc: "Tell us about problems you've encountered." },
            { icon: CheckCircle2, title: "Make an Impact", desc: "Your feedback shapes our platform." },
          ].map((c) => (
            <div key={c.title} className="bg-card border border-border rounded-2xl p-4 text-center">
              <c.icon className="w-7 h-7 text-saffron mx-auto mb-2" />
              <h3 className="font-bold text-sm text-foreground mb-1">{c.title}</h3>
              <p className="text-xs text-foreground/50">{c.desc}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="font-display font-bold text-lg text-foreground">Submit Your Feedback</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Your Name</Label>
              <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Full name" className="h-12" required />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="email@example.com" className="h-12" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <select value={form.category} onChange={(e) => update("category", e.target.value)} className="flex h-12 w-full rounded-md border border-input bg-background px-3 text-sm">
              {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input value={form.subject} onChange={(e) => update("subject", e.target.value)} placeholder="Brief summary of your feedback" className="h-12" required />
          </div>
          <div className="space-y-2">
            <Label>Your Feedback</Label>
            <Textarea value={form.message} onChange={(e) => update("message", e.target.value)} placeholder="Tell us what's on your mind..." className="min-h-[120px]" required />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-12 font-medium">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : "Submit Feedback"}
          </Button>
        </form>
      </div>
      <Footer />
    </div>
  );
}