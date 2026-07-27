import React from "react";
import { motion } from "framer-motion";

export default function SectionHeading({ eyebrow, title, subtitle, dark = false, align = "center", className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`flex flex-col gap-4 ${align === "center" ? "items-center text-center mx-auto" : "items-start text-left"} max-w-2xl ${className}`}
    >
      {eyebrow && (
        <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${dark ? "bg-white/10 text-saffron" : "bg-saffron/10 text-saffron"}`}>
          {eyebrow}
        </span>
      )}
      <h2 className={`font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-[1.05] text-balance ${dark ? "text-white" : "text-foreground"}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`text-base sm:text-lg leading-relaxed ${dark ? "text-white/55" : "text-foreground/55"} ${align === "center" ? "max-w-xl" : ""}`}>
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}