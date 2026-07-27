import React from "react";
import { motion } from "framer-motion";
import { Utensils, ShoppingCart, HeartPulse, Store, ArrowRight } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";
import PartnerRibbon from "@/components/PartnerRibbon";

const services = [
  { title: "Food Delivery", emoji: "🍔", desc: "Your favorite meals from local restaurants.", img: "https://media.base44.com/images/public/6a50be57789d142cd7fc1bfc/aee60fb7f_generated_2ce78503.png", icon: Utensils, tint: "saffron" },
  { title: "Grocery Delivery", emoji: "🛒", desc: "Fresh groceries and household essentials delivered.", img: "https://media.base44.com/images/public/6a50be57789d142cd7fc1bfc/11a17be85_generated_c81837a7.png", icon: ShoppingCart, tint: "terai" },
  { title: "Pharmacy", emoji: "💊", desc: "Health and personal care products at your doorstep.", img: "https://media.base44.com/images/public/6a50be57789d142cd7fc1bfc/dc22755a4_generated_f120c67c.png", icon: HeartPulse, tint: "saffron" },
  { title: "Local Shops", emoji: "🏪", desc: "Support local businesses with easy ordering.", img: "https://media.base44.com/images/public/6a50be57789d142cd7fc1bfc/04ab41f26_generated_2959293c.png", icon: Store, tint: "terai" },
];

const tintMap = {
  saffron: "group-hover:bg-saffron/30",
  terai: "group-hover:bg-terai/30",
};

export default function Services() {
  return (
    <section id="services" className="py-20 lg:py-28 px-4 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <SectionHeading eyebrow="Our Services" title="Everything Dhangadhi Needs, In One App" subtitle="From hot meals to daily essentials — delivered fast from local stores you trust." />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-14">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative overflow-hidden rounded-3xl cursor-pointer shadow-lg shadow-carbon/5"
            >
              <img src={service.img} alt={service.title} className="w-full aspect-[4/5] object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className={`absolute inset-0 ${tintMap[service.tint]} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="absolute inset-0 bg-gradient-to-t from-carbon/90 via-carbon/30 to-transparent" />

              <div className="absolute top-4 left-4 w-11 h-11 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center text-xl shadow-lg">
                {service.emoji}
              </div>

              <div className="absolute bottom-0 inset-x-0 p-5 text-white">
                <div className="flex items-center gap-2 mb-1.5">
                  <service.icon className="w-4 h-4 text-saffron" />
                  <span className="text-[10px] uppercase tracking-widest font-bold text-white/60">{service.tint === "saffron" ? "Order Now" : "Fresh & Fast"}</span>
                </div>
                <h3 className="font-display font-bold text-xl mb-1">{service.title}</h3>
                <p className="text-sm text-white/65">{service.desc}</p>
                <div className="overflow-hidden max-h-0 group-hover:max-h-12 transition-all duration-400">
                  <span className="inline-flex items-center gap-1.5 mt-3 text-sm font-bold text-white">
                    Order Now <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <PartnerRibbon />
    </section>
  );
}