import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import { ShieldCheck, Bike, Utensils, Droplet, Truck, Phone } from "lucide-react";

const measures = [
  { icon: Bike, title: "Rider Safety", points: ["All riders must wear helmets while on delivery.", "Vehicle safety checks are conducted regularly.", "Riders follow all traffic rules and speed limits.", "GPS tracking on all active deliveries for safety monitoring."] },
  { icon: Utensils, title: "Food Safety", points: ["Partner restaurants follow Nepal Food Safety guidelines.", "Tamper-evident packaging seals on all food deliveries.", "Temperature-controlled bags for hot and cold items.", "Riders are trained in safe food handling practices."] },
  { icon: Droplet, title: "Health & Hygiene", points: ["Riders sanitize hands before and after each delivery.", "Masks are provided to all delivery partners.", "Regular health check-ups for active riders.", "Sanitization of delivery bags after every use."] },
  { icon: Truck, title: "Contactless Delivery", points: ["Option to request contactless delivery at checkout.", "Riders maintain safe distance during handoff.", "OTP-based delivery confirmation system.", "Photo proof of delivery available on request."] },
];

export default function SafetyGuidelines() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PageHero title="Safety Guidelines" subtitle="Health protocols and safety measures followed by our riders and partner shops." icon={ShieldCheck} gradient="from-terai to-emerald-700" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-10">
          <p className="text-foreground/60 text-sm max-w-2xl mx-auto">Your safety is our priority. We follow strict health and safety protocols across our entire delivery ecosystem — from partner shops to your doorstep.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5 mb-10">
          {measures.map((m) => (
            <div key={m.title} className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-xl bg-terai/10 flex items-center justify-center">
                  <m.icon className="w-5 h-5 text-terai" />
                </div>
                <h2 className="font-bold text-foreground">{m.title}</h2>
              </div>
              <ul className="space-y-1.5">
                {m.points.map((p) => (
                  <li key={p} className="text-xs text-foreground/60 flex items-start gap-1.5">
                    <span className="text-terai mt-0.5">•</span> {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="bg-saffron/5 border border-saffron/15 rounded-2xl p-6">
          <h2 className="font-bold text-foreground mb-2">Partner Shop Standards</h2>
          <p className="text-sm text-foreground/60 mb-3">All partner stores on Dhangadhi Dash must:</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {["Maintain valid business and food safety licenses.", "Undergo periodic quality and hygiene audits.", "Use food-grade packaging for all deliveries.", "Train staff in proper food handling and hygiene.", "Report any health incidents immediately.", "Comply with Dhangadhi municipal health regulations."].map((item) => (
              <div key={item} className="flex items-start gap-1.5 text-xs text-foreground/60">
                <ShieldCheck className="w-3.5 h-3.5 text-saffron mt-0.5 flex-shrink-0" /> {item}
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-8 p-6 bg-card border border-border rounded-2xl">
          <Phone className="w-8 h-8 text-saffron mx-auto mb-2" />
          <h3 className="font-bold text-foreground mb-1">Report a Safety Concern</h3>
          <p className="text-xs text-foreground/50 mb-3">If you have any safety concerns about a delivery, rider, or partner store, please contact our support team immediately.</p>
          <a href="/help" className="inline-flex items-center text-sm font-medium text-saffron hover:underline">Contact Support →</a>
        </div>
      </div>
      <Footer />
    </div>
  );
}