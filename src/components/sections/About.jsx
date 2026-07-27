import React from "react";
import { motion } from "framer-motion";
import SectionHeading from "@/components/SectionHeading";

const ABOUT_IMG = "https://media.base44.com/images/public/6a50be57789d142cd7fc1bfc/b9c00a1ee_generated_65a8dc5d.png";

const stats = [
  { value: "50+", label: "Local Partners" },
  { value: "10K+", label: "Orders Delivered" },
  { value: "22 min", label: "Avg Delivery Time" },
  { value: "4.8★", label: "Customer Rating" },
];

export default function About() {
  return (
    <section id="about" className="py-20 lg:py-28 px-4 sm:px-6">
      <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-12 items-center">
        <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5 }} className="relative">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-carbon/15 dash-clip">
            <img src={ABOUT_IMG} alt="Dhangadhi city at sunset" className="w-full aspect-[3/2] object-cover" />
          </div>
          <div className="absolute -bottom-6 -right-6 bg-saffron text-white rounded-2xl p-6 shadow-xl hidden sm:block">
            <div className="font-display font-extrabold text-3xl">2026</div>
            <div className="text-xs text-white/80 font-medium">Building Dhangadhi's<br />digital future</div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: 0.1 }}>
          <SectionHeading eyebrow="About Us" title="Building Dhangadhi's Digital Delivery Ecosystem" align="left" />
          <p className="text-base sm:text-lg text-foreground/60 leading-relaxed mt-6 mb-8">
            Dhangadhi Dash is building a faster digital delivery ecosystem for Dhangadhi by connecting customers, restaurants, grocery stores, and delivery partners through technology. We believe local commerce deserves world-class technology — and we're making it happen, one delivery at a time.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl p-4 border border-carbon/5 text-center shadow-sm">
                <div className="font-display font-extrabold text-2xl text-saffron">{stat.value}</div>
                <div className="text-xs text-foreground/50 font-medium mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}