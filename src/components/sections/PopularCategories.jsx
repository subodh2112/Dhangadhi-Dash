import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronRight, ArrowLeft, Search } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";
import { useCategories } from "@/hooks/useCategories";
import { PARENT_CATEGORIES } from "@/lib/categories";

export default function PopularCategories() {
  const { activeParents, childrenByParent, loading } = useCategories();
  const [selectedParent, setSelectedParent] = useState(null);

  // Fallback to static data if DB has no categories yet
  const parents = activeParents.length > 0 ? activeParents : PARENT_CATEGORIES.map((c, i) => ({
    id: c.slug, name: c.name, icon: c.emoji, color_gradient: c.color,
    industry_group: c.group, is_featured: i < 6, display_order: i, slug: c.slug,
  }));

  const parentChildren = selectedParent ? (childrenByParent[selectedParent.id] || []) : [];

  return (
    <section id="categories" className="py-12 lg:py-16 px-4 sm:px-6 bg-background">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-saffron/10 text-saffron mb-2">
              Browse
            </span>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-foreground">
              Shop by Category
            </h2>
            <p className="text-sm text-foreground/50 mt-1 hidden sm:block">
              {selectedParent ? `Explore ${selectedParent.name} subcategories` : "Food, fashion, electronics, beauty, home & more"}
            </p>
          </div>
          {!selectedParent && (
            <Link to="/#search" className="text-xs font-bold text-saffron hover:underline whitespace-nowrap">
              View All →
            </Link>
          )}
        </div>

        <AnimatePresence mode="wait">
          {selectedParent ? (
            /* Child categories view */
            <motion.div
              key={"children-" + selectedParent.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <button
                onClick={() => setSelectedParent(null)}
                className="flex items-center gap-1.5 text-sm font-bold text-foreground/60 hover:text-saffron mb-5"
              >
                <ArrowLeft className="w-4 h-4" /> All Categories
              </button>

              {parentChildren.length === 0 ? (
                <p className="text-sm text-foreground/40 text-center py-8">No subcategories available yet.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {parentChildren.map((cat, i) => (
                    <motion.div
                      key={cat.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.4) }}
                    >
                      <Link to={"/category/" + (selectedParent.slug || "") + "?child=" + (cat.id || "")} className="group flex flex-col items-center gap-2">
                        <div className={"w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-gradient-to-br " + (cat.color_gradient || "from-slate-400 to-slate-600") + " flex items-center justify-center shadow-md group-hover:shadow-xl group-hover:scale-105 transition-all"}>
                          <span className="text-2xl lg:text-3xl">{cat.icon || "📦"}</span>
                        </div>
                        <p className="font-heading font-bold text-xs lg:text-sm text-foreground group-hover:text-saffron transition-colors text-center leading-tight">{cat.name}</p>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            /* Parent categories view */
            <motion.div
              key="parents"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {loading ? (
                <div className="flex gap-3 overflow-hidden pb-2 lg:grid lg:grid-cols-6 lg:gap-4">
                  {Array.from({ length: 6 }).map((_, i) => <div key={i} className="flex-shrink-0 w-20 lg:w-auto"><div className="w-16 h-16 lg:w-full lg:aspect-square rounded-2xl bg-muted animate-pulse" /></div>)}
                </div>
              ) : (
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 lg:grid lg:grid-cols-6 lg:gap-4 lg:mx-0 lg:px-0 lg:overflow-visible">
                  {parents.map((cat, i) => (
                    <motion.div
                      key={cat.id || cat.slug}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.6) }}
                      className="flex-shrink-0 w-20 lg:w-auto"
                    >
                      <button
                        onClick={() => setSelectedParent(cat)}
                        className="group flex flex-col items-center gap-2 w-full"
                      >
                        <div className={"w-16 h-16 lg:w-full lg:aspect-square rounded-2xl bg-gradient-to-br " + (cat.color_gradient || cat.color || "from-slate-400 to-slate-600") + " flex items-center justify-center shadow-md group-hover:shadow-xl group-hover:scale-105 transition-all relative"}>
                          <span className="text-3xl lg:text-4xl">{cat.icon || cat.emoji || "📦"}</span>
                          <div className="absolute inset-0 bg-carbon/0 group-hover:bg-carbon/10 rounded-2xl transition-colors flex items-center justify-center">
                            <ChevronRight className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="font-heading font-bold text-xs lg:text-sm text-foreground group-hover:text-saffron transition-colors leading-tight">{cat.name}</p>
                          <p className="text-[9px] lg:text-[10px] text-foreground/40 hidden lg:block capitalize">{cat.industry_group || cat.group}</p>
                        </div>
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}