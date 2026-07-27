import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Tag, Zap, CheckCircle, Flame, Package, SlidersHorizontal, X, ChevronDown } from "lucide-react";

const PRICE_RANGES = [
  { id: "under100", label: "Under Rs 100", min: 0, max: 100 },
  { id: "100-300", label: "Rs 100–300", min: 100, max: 300 },
  { id: "300-500", label: "Rs 300–500", min: 300, max: 500 },
  { id: "500-1000", label: "Rs 500–1000", min: 500, max: 1000 },
  { id: "above1000", label: "Above Rs 1000", min: 1000, max: Infinity },
];

const RATING_OPTIONS = [
  { id: "4up", label: "4★ & above", min: 4 },
  { id: "3up", label: "3★ & above", min: 3 },
  { id: "2up", label: "2★ & above", min: 2 },
];

const SORT_OPTIONS = [
  { id: "relevance", label: "Relevance" },
  { id: "lowest_price", label: "Price: Low to High" },
  { id: "highest_price", label: "Price: High to Low" },
  { id: "highest_rated", label: "Highest Rated" },
  { id: "newest", label: "Newest First" },
  { id: "discount", label: "Biggest Discount" },
];

export default function ProductFilters({ products, onFilterChange, availableBrands = [] }) {
  const [expanded, setExpanded] = useState(false);
  const [priceRange, setPriceRange] = useState(null);
  const [minRating, setMinRating] = useState(null);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [sort, setSort] = useState("relevance");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [discountOnly, setDiscountOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [newArrivalsOnly, setNewArrivalsOnly] = useState(false);
  const [maxDelivery, setMaxDelivery] = useState(null);
  const [showAllBrands, setShowAllBrands] = useState(false);

  const deliveryOptions = [
    { id: "30", label: "Under 30 min", max: 30 },
    { id: "45", label: "Under 45 min", max: 45 },
    { id: "60", label: "Under 60 min", max: 60 },
  ];

  const brands = useMemo(() => {
    if (availableBrands.length > 0) return availableBrands;
    const set = new Set();
    products.forEach((p) => { if (p.brand) set.add(p.brand); });
    return Array.from(set).sort();
  }, [products, availableBrands]);

  const filteredSorted = useMemo(() => {
    let result = [...products];

    if (priceRange) {
      const range = PRICE_RANGES.find((p) => p.id === priceRange);
      if (range) result = result.filter((p) => {
        const price = p.discount_percent ? p.price * (1 - p.discount_percent / 100) : p.price;
        return price >= range.min && price < range.max;
      });
    }

    if (minRating) {
      const opt = RATING_OPTIONS.find((r) => r.id === minRating);
      if (opt) result = result.filter((p) => (p.rating || 0) >= opt.min);
    }

    if (selectedBrands.length > 0) {
      result = result.filter((p) => p.brand && selectedBrands.includes(p.brand));
    }

    if (availableOnly) result = result.filter((p) => p.is_available !== false);
    if (discountOnly) result = result.filter((p) => p.discount_percent > 0);
    if (featuredOnly) result = result.filter((p) => p.is_popular || p.is_bestseller);
    if (newArrivalsOnly) result = result.filter((p) => p.is_new_arrival);
    if (maxDelivery) {
      const opt = deliveryOptions.find((d) => d.id === maxDelivery);
      if (opt) result = result.filter((p) => (p.delivery_minutes || 30) <= opt.max);
    }

    switch (sort) {
      case "lowest_price":
        result.sort((a, b) => (a.discount_percent ? a.price * (1 - a.discount_percent / 100) : a.price) - (b.discount_percent ? b.price * (1 - b.discount_percent / 100) : b.price));
        break;
      case "highest_price":
        result.sort((a, b) => (b.discount_percent ? b.price * (1 - b.discount_percent / 100) : b.price) - (a.discount_percent ? a.price * (1 - a.discount_percent / 100) : a.price));
        break;
      case "highest_rated":
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "newest":
        result.sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
        break;
      case "discount":
        result.sort((a, b) => (b.discount_percent || 0) - (a.discount_percent || 0));
        break;
    }

    return result;
  }, [products, priceRange, minRating, selectedBrands, availableOnly, discountOnly, featuredOnly, newArrivalsOnly, maxDelivery, sort]);

  React.useEffect(() => {
    onFilterChange?.(filteredSorted);
  }, [filteredSorted, onFilterChange]);

  const hasActiveFilters = priceRange || minRating || selectedBrands.length > 0 || availableOnly || discountOnly || featuredOnly || newArrivalsOnly || maxDelivery;

  const clearAll = () => {
    setPriceRange(null); setMinRating(null); setSelectedBrands([]);
    setAvailableOnly(false); setDiscountOnly(false); setFeaturedOnly(false);
    setNewArrivalsOnly(false); setMaxDelivery(null); setSort("relevance");
  };

  const toggleBrand = (brand) => setSelectedBrands((prev) => prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]);

  const activeFilterChips = [];
  if (priceRange) activeFilterChips.push({ label: PRICE_RANGES.find(p => p.id === priceRange)?.label, onClear: () => setPriceRange(null) });
  if (minRating) activeFilterChips.push({ label: RATING_OPTIONS.find(r => r.id === minRating)?.label, onClear: () => setMinRating(null) });
  if (availableOnly) activeFilterChips.push({ label: "In Stock", onClear: () => setAvailableOnly(false) });
  if (discountOnly) activeFilterChips.push({ label: "On Sale", onClear: () => setDiscountOnly(false) });
  if (featuredOnly) activeFilterChips.push({ label: "Featured", onClear: () => setFeaturedOnly(false) });
  if (newArrivalsOnly) activeFilterChips.push({ label: "New Arrivals", onClear: () => setNewArrivalsOnly(false) });
  if (maxDelivery) activeFilterChips.push({ label: deliveryOptions.find(d => d.id === maxDelivery)?.label, onClear: () => setMaxDelivery(null) });
  selectedBrands.forEach((b) => activeFilterChips.push({ label: b, onClear: () => toggleBrand(b) }));

  return (
    <div className="space-y-4">
      {/* Top bar: sort + filter toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setExpanded(!expanded)}
          className={"flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all " + (expanded || hasActiveFilters ? "bg-saffron text-white" : "bg-muted text-foreground/60 hover:bg-saffron/10")}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
          {hasActiveFilters && <span className="bg-white/30 px-1.5 rounded-full text-[10px]">{activeFilterChips.length}</span>}
        </button>

        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2 rounded-full text-xs font-bold bg-muted text-foreground/70 border-0 focus:outline-none focus:ring-2 focus:ring-saffron/30 cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/40 pointer-events-none" />
        </div>

        {hasActiveFilters && (
          <button onClick={clearAll} className="flex items-center gap-1 px-3 py-2 rounded-full text-xs font-bold text-red-500 hover:bg-red-500/10">
            <X className="w-3.5 h-3.5" /> Clear All
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {activeFilterChips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activeFilterChips.map((chip, i) => (
            <span key={i} className="inline-flex items-center gap-1 bg-saffron/10 text-saffron text-[11px] font-bold px-2.5 py-1 rounded-full">
              {chip.label}
              <button onClick={chip.onClear} className="hover:text-red-500"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}

      {/* Expanded filter panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-2xl">
              {/* Price */}
              <FilterGroup title="Price Range">
                {PRICE_RANGES.map((p) => (
                  <FilterCheckbox key={p.id} label={p.label} checked={priceRange === p.id} onChange={() => setPriceRange(priceRange === p.id ? null : p.id)} />
                ))}
              </FilterGroup>

              {/* Rating */}
              <FilterGroup title="Rating">
                {RATING_OPTIONS.map((r) => (
                  <FilterCheckbox key={r.id} label={r.label} checked={minRating === r.id} onChange={() => setMinRating(minRating === r.id ? null : r.id)} />
                ))}
              </FilterGroup>

              {/* Delivery Time */}
              <FilterGroup title="Delivery Time">
                {deliveryOptions.map((d) => (
                  <FilterCheckbox key={d.id} label={d.label} checked={maxDelivery === d.id} onChange={() => setMaxDelivery(maxDelivery === d.id ? null : d.id)} />
                ))}
              </FilterGroup>

              {/* Quick filters */}
              <FilterGroup title="More Filters">
                <FilterCheckbox label="In Stock Only" icon={CheckCircle} checked={availableOnly} onChange={() => setAvailableOnly(!availableOnly)} />
                <FilterCheckbox label="On Sale" icon={Tag} checked={discountOnly} onChange={() => setDiscountOnly(!discountOnly)} />
                <FilterCheckbox label="Featured / Popular" icon={Flame} checked={featuredOnly} onChange={() => setFeaturedOnly(!featuredOnly)} />
                <FilterCheckbox label="New Arrivals" icon={Package} checked={newArrivalsOnly} onChange={() => setNewArrivalsOnly(!newArrivalsOnly)} />
              </FilterGroup>

              {/* Brands */}
              {brands.length > 0 && (
                <div className="sm:col-span-2 lg:col-span-4">
                  <FilterGroup title="Brands">
                    <div className="flex flex-wrap gap-1.5">
                      {(showAllBrands ? brands : brands.slice(0, 10)).map((brand) => (
                        <button
                          key={brand}
                          onClick={() => toggleBrand(brand)}
                          className={"px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all " + (selectedBrands.includes(brand) ? "bg-saffron text-white" : "bg-muted text-foreground/60 hover:bg-saffron/10")}
                        >
                          {brand}
                        </button>
                      ))}
                      {brands.length > 10 && (
                        <button onClick={() => setShowAllBrands(!showAllBrands)} className="px-3 py-1.5 rounded-full text-[11px] font-bold text-saffron">
                          {showAllBrands ? "Show Less" : `+${brands.length - 10} more`}
                        </button>
                      )}
                    </div>
                  </FilterGroup>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterGroup({ title, children }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 mb-2">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function FilterCheckbox({ label, checked, onChange, icon: Icon }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <input type="checkbox" checked={checked} onChange={onChange} className="w-4 h-4 rounded accent-saffron" />
      <span className="text-xs text-foreground/70 group-hover:text-foreground flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />} {label}
      </span>
    </label>
  );
}