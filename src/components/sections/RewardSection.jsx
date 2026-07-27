import React from "react";
import { motion } from "framer-motion";
import { Award, Gift, Headphones, Truck, Crown, TrendingUp, Sparkles } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";

const levels = [
  { name: "Bronze", color: "bg-amber-700", points: "0+", perks: ["5 pts per NPR 100", "Standard support"] },
  { name: "Silver", color: "bg-gray-400", points: "1,000+", perks: ["5% extra points", "Priority support"] },
  { name: "Gold", color: "bg-amber-500", points: "5,000+", perks: ["Free delivery", "Exclusive offers"] },
  { name: "Platinum", color: "bg-cyan-600", points: "15,000+", perks: ["Birthday gifts", "Special vouchers"] },
  { name: "Diamond", color: "bg-purple-600", points: "30,000+", perks: ["Max discounts", "VIP everything"] },
];

const benefits = [
  { icon: Gift, title: "Redeem Points", desc: "Turn points into wallet cash" },
  { icon: Truck, title: "Free Delivery", desc: "Gold+ members pay no fees" },
  { icon: Crown, title: "Birthday Gifts", desc: "Special rewards on your day" },
  { icon: Headphones, title: "Priority Support", desc: "Skip the queue" },
];

export default function RewardsSection() {
  return (
    <section id="rewards" className="py-20 lg:py-28 px-4 sm:px-6 bg-carbon relative overflow-hidden">
      <div className="bg-grid-pattern absolute inset-0 opacity-30" />
      <div className="mx-auto max-w-7xl relative">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-saffron/20 text-saffron mb-4">
            <Award className="w-3.5 h-3.5" /> DD Rewards
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight text-white text-balance">
            Earn While You Order
          </h2>
          <p className="text-base sm:text-lg text-white/50 mt-4">
            Every NPR 100 you spend earns 5 points. Climb the ranks from Bronze to Diamond and unlock exclusive perks.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {benefits.map((b, i) => {
            const Icon = b.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-white/5 backdrop-blur rounded-2xl p-5 border border-white/10"
              >
                <div className="w-10 h-10 rounded-xl bg-saffron/20 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-saffron" />
                </div>
                <p className="font-heading font-bold text-sm text-white mb-1">{b.title}</p>
                <p className="text-xs text-white/40">{b.desc}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {levels.map((level, i) => (
            <motion.div
              key={level.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative rounded-2xl p-5 border ${i === 4 ? "border-saffron/40 bg-saffron/5" : "border-white/10 bg-white/5"}`}
            >
              {i === 4 && (
                <span className="absolute -top-2.5 right-3 bg-saffron text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> TOP
                </span>
              )}
              <div className={`w-12 h-12 rounded-xl ${level.color} flex items-center justify-center mb-3`}>
                <Crown className="w-6 h-6 text-white" />
              </div>
              <p className="font-display font-extrabold text-lg text-white">{level.name}</p>
              <p className="text-xs text-white/40 mb-3">{level.points} points</p>
              <ul className="space-y-1.5">
                {level.perks.map((perk, j) => (
                  <li key={j} className="text-xs text-white/60 flex items-start gap-1.5">
                    <span className="text-saffron mt-0.5">✓</span> {perk}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12">
          <a
            href="/register"
            className="inline-flex items-center gap-2 px-8 h-12 rounded-2xl bg-saffron text-white font-bold text-sm hover:bg-saffron/90 transition-colors"
          >
            <TrendingUp className="w-4 h-4" /> Start Earning Today
          </a>
        </div>
      </div>
    </section>
  );
}