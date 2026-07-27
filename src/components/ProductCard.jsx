import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Plus } from "lucide-react";
import { useCart } from "@/context/CartContext";
import CategoryHierarchy from "@/components/CategoryHierarchy";

export default function ProductCard({ product, index = 0 }) {
  const { addItem } = useCart();
  const discountedPrice = product.discount_percent
    ? Math.round(product.price * (1 - product.discount_percent / 100))
    : product.price;

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      price: discountedPrice,
      image_url: product.image_url,
      store_id: product.store_id,
      store_name: product.store_name,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.6) }}
    >
      <Link
        to={product.store_id ? `/store/${product.store_id}` : "/"}
        className="block bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-lg transition-shadow group h-full"
      >
        <div className="relative aspect-square overflow-hidden">
          <img
            src={product.image_url || "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400"}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.is_bestseller && (
              <span className="bg-saffron text-white text-[9px] font-bold px-2 py-0.5 rounded-full">BESTSELLER</span>
            )}
            {product.is_new_arrival && (
              <span className="bg-terai text-white text-[9px] font-bold px-2 py-0.5 rounded-full">NEW</span>
            )}
            {product.is_flash_sale && (
              <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">FLASH</span>
            )}
            {product.discount_percent > 0 && (
              <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">{product.discount_percent}% OFF</span>
            )}
          </div>
          <button
            onClick={handleAdd}
            className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-saffron hover:text-white"
            aria-label="Add to cart"
          >
            <Plus className="w-4 h-4" />
          </button>
          {!product.is_available && (
            <div className="absolute inset-0 bg-carbon/50 flex items-center justify-center">
              <span className="text-white text-xs font-bold">Out of Stock</span>
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="text-[10px] text-foreground/40 font-medium truncate">{product.store_name}</p>
          <CategoryHierarchy
            parentCategoryId={product.parent_category_id}
            childCategoryId={product.child_category_id}
            showIcons
            className="mb-0.5"
          />
          <p className="text-sm font-semibold text-foreground line-clamp-1 mb-1">{product.name}</p>
          {product.brand && (
            <p className="text-[10px] text-foreground/40 mb-1 truncate">{product.brand}</p>
          )}
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-foreground text-sm">Rs {discountedPrice}</span>
              {product.discount_percent > 0 && (
                <span className="text-[10px] text-foreground/30 line-through">Rs {product.price}</span>
              )}
            </div>
            {product.rating > 0 && (
              <div className="flex items-center gap-0.5">
                <Star className="w-3 h-3 text-saffron fill-saffron" />
                <span className="text-[10px] text-foreground/50">{product.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}