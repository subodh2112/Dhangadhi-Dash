import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trash2, Plus, Minus, ShoppingBag, Tag, X, Bookmark, ArrowRight, MessageSquare, Store } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { base44 } from "@/api/base44Client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBackButton from "@/components/MobileBackButton";

export default function Cart() {
  const {
    items, savedItems, storeGroups, storeBreakdowns,
    grandSubtotal, grandDiscount, grandDeliveryFee, grandServiceCharge, grandTaxes, grandTotal,
    updateQuantity, removeFromCart, clearCart, saveForLater, moveToCart,
    deliveryInstructions, setDeliveryInstructions,
    appliedCoupon, applyCoupon, removeCoupon,
  } = useCart();
  const navigate = useNavigate();
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCheckingCoupon(true);
    setCouponError("");
    try {
      const results = await base44.entities.Coupon.filter({
        code: couponInput.trim().toUpperCase(),
        is_active: true,
      });
      if (results.length > 0) {
        applyCoupon(results[0]);
        setCouponInput("");
      } else {
        setCouponError("Invalid or expired coupon code.");
      }
    } catch {
      setCouponError("Could not verify coupon. Try again.");
    }
    setCheckingCoupon(false);
  };

  if (items.length === 0 && savedItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-20 px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-10 h-10 text-foreground/30" />
            </div>
            <h1 className="font-display font-extrabold text-2xl text-foreground mb-2">Your cart is empty</h1>
            <p className="text-sm text-foreground/50 mb-6">Browse our top local partners and start ordering!</p>
            <Link to="/#top-partners" className="inline-flex items-center gap-2 bg-saffron text-white font-bold px-6 py-3 rounded-2xl hover:bg-saffron/90 transition-colors">
              Browse Stores <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <MobileBackButton />
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground">Your Cart</h1>
            {items.length > 0 && (
              <button onClick={clearCart} className="text-sm text-red-500 font-semibold flex items-center gap-1 hover:text-red-600">
                <Trash2 className="w-4 h-4" /> Clear Cart
              </button>
            )}
          </div>
          {storeGroups.length > 1 && (
            <div className="bg-saffron/5 border border-saffron/10 rounded-2xl px-4 py-2.5 mb-6">
              <p className="text-sm text-foreground">Multi-store cart: <span className="font-bold text-saffron">{storeGroups.length} stores</span> — you'll place separate orders for each store at checkout.</p>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {storeGroups.length > 0 && (
                <div className="space-y-6">
                  {storeGroups.map((group) => {
                    const breakdown = storeBreakdowns.find((b) => b.storeName === group.storeName) || {};
                    return (
                      <div key={group.storeId || group.storeName} className="space-y-3">
                        <div className="flex items-center gap-2 px-1">
                          <div className="w-7 h-7 rounded-lg bg-saffron/10 flex items-center justify-center">
                            <Store className="w-4 h-4 text-saffron" />
                          </div>
                          <h3 className="font-display font-bold text-sm text-foreground">{group.storeName}</h3>
                          <span className="text-xs text-foreground/40">({group.items.length} {group.items.length === 1 ? "item" : "items"})</span>
                        </div>
                        {group.items.map((item) => (
                          <motion.div
                            key={item.product.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-card rounded-2xl border border-border p-4 flex gap-4"
                          >
                            <img
                              src={item.product.image_url || "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200"}
                              alt={item.product.name}
                              className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm text-foreground line-clamp-1">{item.product.name}</h3>
                              <p className="text-xs text-foreground/40 mb-2">Rs {item.product.price} each</p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                                  <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center hover:bg-background rounded">
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                                  <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center hover:bg-background rounded">
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <span className="font-bold text-sm text-foreground">Rs {item.product.price * item.quantity}</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <button onClick={() => removeFromCart(item.product.id)} className="text-foreground/30 hover:text-red-500 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => saveForLater(item.product.id)} className="text-foreground/30 hover:text-saffron transition-colors" title="Save for later">
                                <Bookmark className="w-4 h-4" />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                        <div className="flex justify-between items-center px-1 pb-2 text-xs text-foreground/50">
                          <span>Store subtotal</span>
                          <span className="font-bold text-foreground">Rs {breakdown.subtotal || 0}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {items.length > 0 && (
                <div className="bg-card rounded-2xl border border-border p-4">
                  <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                    <MessageSquare className="w-4 h-4 text-saffron" /> Delivery Instructions
                  </label>
                  <textarea
                    value={deliveryInstructions}
                    onChange={(e) => setDeliveryInstructions(e.target.value)}
                    rows={2}
                    placeholder="e.g. Ring the doorbell, call on arrival..."
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-saffron/40 resize-none"
                  />
                </div>
              )}

              {savedItems.length > 0 && (
                <div className="bg-card rounded-2xl border border-border p-4">
                  <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-foreground/40" /> Saved for Later ({savedItems.length})
                  </h3>
                  <div className="space-y-2">
                    {savedItems.map((item) => (
                      <div key={item.product.id} className="flex items-center gap-3 py-2">
                        <img src={item.product.image_url} alt={item.product.name} className="w-12 h-12 rounded-lg object-cover" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground line-clamp-1">{item.product.name}</p>
                          <p className="text-xs text-foreground/40">Rs {item.product.price}</p>
                        </div>
                        <button onClick={() => moveToCart(item.product.id)} className="text-xs font-bold text-saffron hover:underline">
                          Move to Cart
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-card rounded-2xl border border-border p-5 sticky top-24">
                <h3 className="font-display font-bold text-lg text-foreground mb-4">Order Summary</h3>

                <div className="mb-4">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-terai/5 border border-terai/10 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-terai" />
                        <div>
                          <p className="text-xs font-bold text-terai">{appliedCoupon.code}</p>
                          <p className="text-[10px] text-foreground/40">{appliedCoupon.description}</p>
                        </div>
                      </div>
                      <button onClick={removeCoupon} className="text-foreground/30 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value)}
                          placeholder="Coupon code"
                          className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-saffron/40"
                        />
                      </div>
                      <button
                        onClick={handleApplyCoupon}
                        disabled={checkingCoupon || !couponInput.trim()}
                        className="px-4 h-10 rounded-xl bg-carbon text-white text-xs font-bold hover:bg-carbon/90 disabled:opacity-40"
                      >
                        {checkingCoupon ? "..." : "Apply"}
                      </button>
                    </div>
                  )}
                  {couponError && <p className="text-[10px] text-red-500 mt-1">{couponError}</p>}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-foreground/60">
                    <span>Subtotal</span>
                    <span className="font-medium text-foreground">Rs {grandSubtotal}</span>
                  </div>
                  {grandDiscount > 0 && (
                    <div className="flex justify-between text-terai">
                      <span>Discount</span>
                      <span className="font-medium">- Rs {grandDiscount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-foreground/60">
                    <span>Delivery Fee ({storeGroups.length} {storeGroups.length === 1 ? "store" : "stores"})</span>
                    <span className="font-medium text-foreground">{grandDeliveryFee === 0 ? "FREE" : `Rs ${grandDeliveryFee}`}</span>
                  </div>
                  <div className="flex justify-between text-foreground/60">
                    <span>Service Charge</span>
                    <span className="font-medium text-foreground">Rs {grandServiceCharge}</span>
                  </div>
                  <div className="flex justify-between text-foreground/60">
                    <span>Taxes (13%)</span>
                    <span className="font-medium text-foreground">Rs {grandTaxes}</span>
                  </div>
                  <div className="border-t border-border pt-2 mt-2 flex justify-between items-baseline">
                    <span className="font-bold text-foreground">Grand Total</span>
                    <span className="font-display font-extrabold text-xl text-saffron">Rs {grandTotal}</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate("/checkout")}
                  disabled={items.length === 0}
                  className="w-full h-12 mt-5 rounded-xl bg-saffron text-white font-bold hover:bg-saffron/90 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
                >
                  Proceed to Checkout <ArrowRight className="w-4 h-4" />
                </button>
                <Link to="/#top-partners" className="block text-center text-xs text-foreground/40 font-medium mt-3 hover:text-saffron">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}