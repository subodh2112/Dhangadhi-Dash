import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Search, ShoppingCart, Truck, Package } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";

const steps = [
  { icon: Search, title: "Browse Products", desc: "Explore food, groceries, and essentials from local stores near you." },
  { icon: ShoppingCart, title: "Add to Cart", desc: "Pick your items and add them to your cart with a single tap." },
  { icon: Truck, title: "Track Your Delivery", desc: "Watch your order move in real-time on the live tracking map." },
  { icon: Package, title: "Receive at Doorstep", desc: "Get your order delivered fast — right to your doorstep." },
];

export default function HowItWorks() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start center", "end center"] });
  const lineWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section ref={sectionRef} id="how-it-works" className="relative bg-carbon text-white py-20 lg:py-28 px-4 sm:px-6 overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-saffron/5 rounded-full blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <SectionHeading eyebrow="How It Works" title="From Tap to Doorstep in Minutes" subtitle="A simple four-step journey from browsing to receiving your order." dark />

        <div className="relative mt-16 lg:mt-20">
          <div className="hidden lg:block absolute top-8 left-0 right-0 h-0.5 bg-white/10">
            <motion.div className="h-full bg-saffron" style={{ width: lineWidth }} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                className="relative flex flex-col items-center text-center"
                initial={{ opacity: 0.25, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, margin: "-80px" }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <div className="relative z-10 w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 backdrop-blur-sm">
                  <step.icon className="w-7 h-7 text-saffron" />
                  <span className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-saffron text-white text-xs font-bold flex items-center justify-center shadow-lg shadow-saffron/30">{i + 1}</span>
                </div>
                <h3 className="font-display font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed max-w-[220px]">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}