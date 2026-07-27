import React from "react";
import { motion } from "framer-motion";

export default function PageHero({ title, subtitle, icon: Icon, gradient }) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${gradient || "from-saffron to-orange-600"} text-white`}>
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-12 sm:pt-32 sm:pb-16">
        {Icon && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-4">
            <Icon className="w-7 h-7" />
          </motion.div>
        )}
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl sm:text-4xl font-extrabold font-display mb-2">{title}</motion.h1>
        {subtitle && (
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="text-white/80 text-sm sm:text-base max-w-2xl">
            {subtitle}
          </motion.p>
        )}
      </div>
    </div>
  );
}