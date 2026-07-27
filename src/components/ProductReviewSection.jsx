import React, { useState } from "react";
import { Star, Package } from "lucide-react";
import ProductReviews from "@/components/ProductReviews";

export default function ProductReviewSection({ products, storeId }) {
  const [selectedId, setSelectedId] = useState(products[0]?.id || "");

  const selected = products.find((p) => p.id === selectedId) || products[0];

  if (!selected) return null;

  return (
    <div className="mt-8 mb-4">
      <h2 className="font-display font-extrabold text-xl text-foreground mb-4">Product Reviews</h2>

      <div className="bg-card rounded-2xl border border-border p-4 mb-5">
        <label className="text-xs font-semibold text-foreground/60 mb-2 block">Select a product to review</label>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {products.slice(0, 20).map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                selectedId === p.id
                  ? "border-saffron bg-saffron/5"
                  : "border-border bg-muted/30 hover:border-saffron/30"
              }`}
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-4 h-4 text-foreground/20 m-auto mt-2" />
                )}
              </div>
              <div className="text-left min-w-0 max-w-[120px]">
                <p className="text-xs font-semibold text-foreground truncate">{p.name}</p>
                <div className="flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5 text-saffron fill-saffron" />
                  <span className="text-[10px] text-foreground/40">Rs {p.price}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <ProductReviews
        productId={selected.id}
        productName={selected.name}
        storeId={storeId}
      />
    </div>
  );
}