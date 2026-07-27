import React, { useState } from "react";
import { motion } from "framer-motion";
import { Store, Bike, Users, ShoppingCart, Truck, BarChart3, LayoutDashboard, Clock, Wallet, UserPlus, Gift, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PartnershipForm from "@/components/PartnershipForm";

const partnerBenefits = [
  { icon: Users, text: "Reach more customers" },
  { icon: ShoppingCart, text: "Online ordering system" },
  { icon: Truck, text: "Delivery support" },
  { icon: BarChart3, text: "Sales tracking" },
  { icon: LayoutDashboard, text: "Business dashboard" },
];

const riderBenefits = [
  { icon: Clock, text: "Flexible working hours" },
  { icon: Wallet, text: "Extra income opportunities" },
  { icon: UserPlus, text: "Easy registration" },
  { icon: Gift, text: "Delivery incentives" },
];

export default function DualPortal() {
  const [active, setActive] = useState(null);
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);

  return (
    <section id="partners" className="py-20 lg:py-28 px-4 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-5" onMouseLeave={() => setActive(null)}>
          {/* Partner side */}
          <motion.div
            onMouseEnter={() => setActive("partner")}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            className={`relative overflow-hidden rounded-3xl bg-terai text-white p-8 lg:p-10 transition-all duration-500 cursor-default ${active === "partner" ? "lg:flex-[3]" : active === "rider" ? "lg:flex-[1]" : "lg:flex-[1]"}`}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mb-6">
                <Store className="w-7 h-7" />
              </div>
              <h3 className="font-display font-extrabold text-2xl lg:text-3xl mb-3 leading-tight">Grow Your Business With Dhangadhi Dash</h3>
              <p className="text-white/70 text-sm mb-6 max-w-md">Join Dhangadhi's fastest-growing delivery network and reach thousands of hungry customers every day.</p>
              <ul className="space-y-3 mb-8">
                {partnerBenefits.map((b) => (
                  <li key={b.text} className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0"><b.icon className="w-4 h-4" /></div>
                    {b.text}
                  </li>
                ))}
              </ul>
              <Button onClick={() => setPartnerModalOpen(true)} className="bg-white text-terai hover:bg-white/90 rounded-full px-6 font-bold shadow-lg">
                Become a Partner <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </motion.div>

          {/* Rider side */}
          <motion.div
            id="riders"
            onMouseEnter={() => setActive("rider")}
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={`relative overflow-hidden rounded-3xl bg-saffron text-white p-8 lg:p-10 transition-all duration-500 cursor-default ${active === "rider" ? "lg:flex-[3]" : active === "partner" ? "lg:flex-[1]" : "lg:flex-[1]"}`}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mb-6">
                <Bike className="w-7 h-7" />
              </div>
              <h3 className="font-display font-extrabold text-2xl lg:text-3xl mb-3 leading-tight">Earn With Dhangadhi Dash</h3>
              <p className="text-white/70 text-sm mb-6 max-w-md">Become a delivery rider and earn on your own schedule. Flexible hours, great incentives, and a supportive community.</p>
              <ul className="space-y-3 mb-8">
                {riderBenefits.map((b) => (
                  <li key={b.text} className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0"><b.icon className="w-4 h-4" /></div>
                    {b.text}
                  </li>
                ))}
              </ul>
              <Button asChild className="bg-white text-saffron hover:bg-white/90 rounded-full px-6 font-bold shadow-lg">
                <a href="#contact">Join Now <ArrowRight className="w-4 h-4 ml-1.5" /></a>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
      <PartnershipForm open={partnerModalOpen} onClose={() => setPartnerModalOpen(false)} />
    </section>
  );
}