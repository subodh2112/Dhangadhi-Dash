import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";
import { useCategories } from "@/hooks/useCategories";
import { PARENT_CATEGORIES } from "@/lib/categories";

export default function AllCategories() {
  const { activeParents, loading } = useCategories();

  const parents = activeParents.length > 0
    ? activeParents
    : PARENT_CATEGORIES.map((c, i) => ({
        id: c.slug, name: c.name, icon: c.emoji, color_gradient: c.color,
        industry_group: c.group, slug: c.slug, display_order: i,
      }));

  return (
    <section id="categories" className="py-12 lg:py-16 px-4 sm:px-6 bg-background">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Browse All"
          title="Shop by Category"
          subtitle="Explore the entire Dhangadhi Dash marketplace — food, grocery, fashion, electronics, beauty, home, gifts, pets, books, sports & more."
        />

        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-8">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4 mt-8">
            {parents.map((cat, i) => (
              <motion.div
                key={cat.id || cat.slug}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.6) }}
              >
                <Link
                  to={"/category/" + cat.slug}
                  className="group flex flex-col items-center gap-2"
                >
                  <div className={"w-full aspect-square rounded-2xl bg-gradient-to-br " + (cat.color_gradient || cat.color || "from-slate-400 to-slate-600") + " flex items-center justify-center shadow-md group-hover:shadow-xl group-hover:scale-105 transition-all relative"}>
                    <span className="text-3xl sm:text-4xl">{cat.icon || cat.emoji || "📦"}</span>
                    <div className="absolute inset-0 bg-carbon/0 group-hover:bg-carbon/10 rounded-2xl transition-colors flex items-center justify-center">
                      <ChevronRight className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-heading font-bold text-xs sm:text-sm text-foreground group-hover:text-saffron transition-colors leading-tight">{cat.name}</p>
                    {cat.store_count > 0 && (
                      <p className="text-[9px] sm:text-[10px] text-foreground/40">{cat.store_count} stores</p>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}