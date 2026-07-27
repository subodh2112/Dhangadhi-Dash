import React, { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Mail, Phone, Facebook, Instagram, Twitter, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionHeading from "@/components/SectionHeading";

const contactInfo = [
{ icon: MapPin, label: "Location", value: "Dhangadhi, Kailali, Nepal" },
{ icon: Mail, label: "Email", value: "arbsstudio@gmail.com" },
{ icon: Phone, label: "Phone", value: "+977 9764448675" }];


const socials = [
{ icon: Facebook, href: "#", label: "Facebook" },
{ icon: Instagram, href: "#", label: "Instagram" },
{ icon: Twitter, href: "#", label: "Twitter" }];


export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
      setForm({ name: "", email: "", message: "" });
      setTimeout(() => setSent(false), 5000);
    }, 1200);
  };

  return (
    <section id="contact" className="py-20 lg:py-28 px-4 sm:px-6 bg-gradient-to-b from-white to-saffron/[0.02]">
      <div className="mx-auto max-w-7xl">
        <SectionHeading eyebrow="Contact Us" title="Get In Touch" subtitle="Questions, partnership inquiries, or just want to say hello? We'd love to hear from you." />

        <div className="grid lg:grid-cols-2 gap-8 mt-14">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="space-y-4">
            {contactInfo.map((info) =>
            <div key={info.label} className="flex items-center gap-4 bg-white rounded-2xl p-5 border border-carbon/5 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-saffron/10 flex items-center justify-center flex-shrink-0">
                  <info.icon className="w-5 h-5 text-saffron" />
                </div>
                <div>
                  <div className="text-xs text-foreground/50 font-medium uppercase tracking-wide">{info.label}</div>
                  <div className="font-semibold text-foreground">{info.value}</div>
                </div>
              </div>
            )}
            <div className="bg-carbon rounded-2xl p-6 text-white">
              <p className="text-sm text-white/60 mb-4 font-medium">Follow Dhangadhi Dash on social media</p>
              <div className="flex gap-3">
                {socials.map((s) =>
                <a key={s.label} href={s.href} aria-label={s.label} className="w-11 h-11 rounded-xl bg-white/10 hover:bg-saffron flex items-center justify-center transition-colors">
                    <s.icon className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}>
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-carbon/5 shadow-lg shadow-carbon/5 space-y-5">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Name</label>
                <input
                  type="text" required value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-carbon/10 focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none transition-all text-sm"
                  placeholder="Your full name" />
                
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                <input
                  type="email" required value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-carbon/10 focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none transition-all text-sm"
                  placeholder="you@example.com" />
                
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Message</label>
                <textarea
                  required rows={4} value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-carbon/10 focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none transition-all text-sm resize-none"
                  placeholder="How can we help you?" />
                
              </div>
              <Button type="submit" disabled={loading || sent} className="w-full bg-saffron hover:bg-saffron/90 text-white rounded-xl h-12 font-bold shadow-lg shadow-saffron/25">
                {loading ? "Sending..." : sent ?
                <span className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Message Sent!</span> :

                <span className="flex items-center gap-2"><Send className="w-4 h-4" /> Send Message</span>
                }
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>);

}