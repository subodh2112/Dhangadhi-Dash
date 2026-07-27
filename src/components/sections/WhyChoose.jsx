import React from "react";
import { motion } from "framer-motion";
import { Zap, MapPin, Navigation, CreditCard, Star, Phone } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";

const features = [
  { icon: Zap, title: "Fast Local Delivery", desc: "Lightning-fast delivery across Dhangadhi — average 22 minutes from order to doorstep.", color: "saffron" },
  { icon: MapPin, title: "Dhangadhi Focused", desc: "Built specifically for Dhangadhi. We know the streets, the stores, and the shortcuts.", color: "terai" },
  { icon: Navigation, title: "Live Order Tracking", desc: "Track your delivery in real-time. Know exactly where your order is, every step.", color: "saffron" },
  { icon: CreditCard, title: "Easy Payments", desc: "Pay your way — cash on delivery, mobile wallets, or online payments. Simple and secure.", color: "terai" },
  { icon: Star, title: "Trusted Local Partners", desc: "We partner with the best restaurants, grocery stores, and shops in Dhangadhi.", color: "saffron" },
  { icon: Phone, title: "Customer Support", desc: "Real people, real help. Our support team is always ready when you need assistance.", color: "terai" },
];

const colorMap = {
  saffron: "bg-saffron/10 text-saffron group-hover:bg-saffron group-hover:text-white",
  terai: "bg-terai/10 text-terai group-hover:bg-terai group-hover:text-white",
};

export default function WhyChoose() {
  return (
    <section id="why-choose" className="py-20 lg:py-28 px-4 sm:px-6 bg-gradient-to-b from-white to-saffron/[0.02]">
      <div className="mx-auto max-w-7xl">
        <SectionHeading eyebrow="Why DDash" title="Why Choose Dhangadhi Dash" subtitle="We're not just another delivery app. We're your local connection — fast, reliable, and built for Dhangadhi." />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-14">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group bg-white rounded-3xl p-7 border border-carbon/5 shadow-sm hover:shadow-xl hover:shadow-carbon/5 hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-colors duration-300 ${colorMap[feature.color]}`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-foreground/55 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}