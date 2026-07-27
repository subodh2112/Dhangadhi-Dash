import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import SmartSearchBar from "@/components/customer/SmartSearchBar";
import VoiceOrderButton from "@/components/customer/VoiceOrderButton";

export default function AISection() {
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.entities.Product.filter({ is_available: true }, "-created_date", 60).catch(() => []),
      base44.entities.Store.filter({ is_open: true }, "-rating", 30).catch(() => []),
    ]).then(([p, s]) => { setProducts(p); setStores(s); });
  }, []);

  return (
    <section className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
      <SmartSearchBar products={products} stores={stores} />
      <div className="mt-4 max-w-sm">
        <VoiceOrderButton products={products} />
      </div>
    </section>
  );
}