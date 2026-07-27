import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

const SERVICE_CHARGE_PER_STORE = 10;
const DELIVERY_FEE_PER_STORE = 40;
const TAX_RATE = 0.13;

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("ddash_cart");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setItems(data.items || []);
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("ddash_cart", JSON.stringify({ items }));
  }, [items]);

  const addToCart = (product, quantity = 1, notes = "") => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity, notes: notes || item.notes }
            : item
        );
      }
      return [...prev, { product, quantity, notes }];
    });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const removeFromCart = (productId) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
    setDeliveryInstructions("");
  };

  const saveForLater = (productId) => {
    const item = items.find((i) => i.product.id === productId);
    if (item) {
      setSavedItems((prev) => [...prev, item]);
      removeFromCart(productId);
    }
  };

  const moveToCart = (productId) => {
    const item = savedItems.find((i) => i.product.id === productId);
    if (item) {
      addToCart(item.product, item.quantity, item.notes);
      setSavedItems((prev) => prev.filter((i) => i.product.id !== productId));
    }
  };

  const applyCoupon = (coupon) => setAppliedCoupon(coupon);
  const removeCoupon = () => setAppliedCoupon(null);

  // Group items by store
  const storeGroups = items.reduce((groups, item) => {
    const key = item.product.store_id || item.product.store_name || "unknown";
    if (!groups[key]) {
      groups[key] = {
        storeId: item.product.store_id,
        storeName: item.product.store_name || "Unknown Store",
        items: [],
      };
    }
    groups[key].items.push(item);
    return groups;
  }, {});

  const storeList = Object.values(storeGroups);

  // Grand subtotal for proportional coupon splitting
  const grandSubtotalRaw = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Per-store breakdown
  const getStoreBreakdown = (store) => {
    const subtotal = store.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    let discount = 0;
    if (appliedCoupon && grandSubtotalRaw > 0) {
      const proportion = subtotal / grandSubtotalRaw;
      if (appliedCoupon.discount_type === "percentage") {
        const maxDisc = appliedCoupon.max_discount_amount || Infinity;
        const rawDisc = Math.min(Math.round((subtotal * appliedCoupon.discount_value) / 100), maxDisc);
        discount = Math.round(rawDisc * proportion);
      } else if (appliedCoupon.discount_type === "fixed") {
        discount = Math.round((appliedCoupon.discount_value * proportion));
      }
    }

    const isFreeDelivery = appliedCoupon?.discount_type === "free_delivery";
    const deliveryFee = isFreeDelivery ? 0 : subtotal > 0 ? DELIVERY_FEE_PER_STORE : 0;
    const serviceCharge = subtotal > 0 ? SERVICE_CHARGE_PER_STORE : 0;
    const taxes = Math.round((subtotal - discount) * TAX_RATE);
    const total = Math.max(0, subtotal - discount + deliveryFee + serviceCharge + taxes);

    return {
      storeId: store.storeId,
      storeName: store.storeName,
      items: store.items,
      subtotal,
      discount,
      deliveryFee,
      serviceCharge,
      taxes,
      total,
    };
  };

  const storeBreakdowns = storeList.map(getStoreBreakdown);

  // Grand totals
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const grandSubtotal = storeBreakdowns.reduce((sum, s) => sum + s.subtotal, 0);
  const grandDiscount = storeBreakdowns.reduce((sum, s) => sum + s.discount, 0);
  const grandDeliveryFee = storeBreakdowns.reduce((sum, s) => sum + s.deliveryFee, 0);
  const grandServiceCharge = storeBreakdowns.reduce((sum, s) => sum + s.serviceCharge, 0);
  const grandTaxes = storeBreakdowns.reduce((sum, s) => sum + s.taxes, 0);
  const grandTotal = storeBreakdowns.reduce((sum, s) => sum + s.total, 0);

  // Backward-compatible aliases
  const subtotal = grandSubtotal;
  const discount = grandDiscount;
  const deliveryFee = grandDeliveryFee;
  const taxes = grandTaxes;
  const total = grandTotal;
  const storeName = storeList.length === 1 ? storeList[0].storeName : null;

  return (
    <CartContext.Provider
      value={{
        items, savedItems, storeName, deliveryInstructions, appliedCoupon,
        itemCount, subtotal, discount, deliveryFee, taxes, total,
        storeGroups: storeList, storeBreakdowns,
        grandSubtotal, grandDiscount, grandDeliveryFee, grandServiceCharge, grandTaxes, grandTotal,
        addToCart, updateQuantity, removeFromCart, clearCart, saveForLater, moveToCart,
        setDeliveryInstructions, applyCoupon, removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};