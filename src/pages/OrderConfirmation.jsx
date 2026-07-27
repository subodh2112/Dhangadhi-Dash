import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Clock, MapPin, Download, ShoppingBag, Truck, Package, CreditCard, Layers } from "lucide-react";
import { base44 } from "@/api/base44Client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [siblingOrders, setSiblingOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Order.get(id)
      .then(async (o) => {
        setOrder(o);
        if (o?.checkout_group_id) {
          try {
            const siblings = await base44.entities.Order.filter({ checkout_group_id: o.checkout_group_id }, "created_date", 10);
            setSiblingOrders(siblings.filter((s) => s.id !== o.id));
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-saffron/20 border-t-saffron rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-foreground/50">Order not found.</p>
        <Link to="/" className="text-saffron font-bold">← Back to Home</Link>
      </div>
    );
  }

  const handleDownloadInvoice = () => {
    const invoice = `
====================================
   DHANGADHI DASH - INVOICE
====================================

Order Number: ${order.order_number}
Date: ${new Date(order.created_date).toLocaleString()}
Customer: ${order.customer_name}
Store: ${order.store_name}

--- Items ---
${order.items}

--- Delivery ---
Address: ${order.delivery_address}
Contact: ${order.contact_number}
Type: ${order.delivery_type}

--- Payment ---
Payment Method: ${order.payment_method}
Payment Status: ${order.payment_status}

--- Summary ---
Subtotal:     Rs ${order.subtotal}
Discount:     - Rs ${order.discount}
Delivery Fee: Rs ${order.delivery_fee}
Taxes:        Rs ${order.taxes}
------------------------------------
GRAND TOTAL:  Rs ${order.total_amount}
====================================

Thank you for ordering with Dhangadhi Dash!
Fast Delivery. Local Love.
    `.trim();

    const blob = new Blob([invoice], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${order.order_number}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20 px-4 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-20 h-20 rounded-full bg-terai/10 flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle className="w-10 h-10 text-terai" />
            </motion.div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground mb-2">Order Confirmed!</h1>
            <p className="text-sm text-foreground/50">Your order has been placed successfully.</p>
          </motion.div>

          <div className="bg-card rounded-3xl border border-border shadow-lg shadow-carbon/5 p-6 sm:p-8">
            <div className="text-center mb-6 pb-6 border-b border-border">
              <p className="text-xs text-foreground/40 uppercase font-semibold tracking-wide">Order ID</p>
              <p className="font-display font-extrabold text-3xl text-saffron mt-1">{order.order_number}</p>
              <div className="flex items-center justify-center gap-2 mt-3 text-sm text-foreground/60">
                <Clock className="w-4 h-4 text-saffron" />
                Estimated delivery: <span className="font-bold text-foreground">{order.estimated_minutes} minutes</span>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-foreground/40 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-foreground/40 font-semibold uppercase">Items</p>
                  <p className="text-sm text-foreground">{order.items}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-foreground/40 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-foreground/40 font-semibold uppercase">Delivery Address</p>
                  <p className="text-sm text-foreground">{order.delivery_address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-foreground/40 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-foreground/40 font-semibold uppercase">Payment</p>
                  <p className="text-sm text-foreground">{order.payment_method} ({order.payment_status})</p>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-2xl p-4 space-y-2 text-sm mb-6">
              <div className="flex justify-between text-foreground/60"><span>Subtotal</span><span className="text-foreground">Rs {order.subtotal}</span></div>
              {order.discount > 0 && <div className="flex justify-between text-terai"><span>Discount</span><span>- Rs {order.discount}</span></div>}
              <div className="flex justify-between text-foreground/60"><span>Delivery Fee</span><span className="text-foreground">Rs {order.delivery_fee}</span></div>
              <div className="flex justify-between text-foreground/60"><span>Taxes</span><span className="text-foreground">Rs {order.taxes}</span></div>
              <div className="border-t border-border pt-2 flex justify-between items-baseline">
                <span className="font-bold text-foreground">Total</span>
                <span className="font-display font-extrabold text-lg text-saffron">Rs {order.total_amount}</span>
              </div>
            </div>

            {order.delivery_otp && ["rider_assigned", "picked_up", "on_the_way"].includes(order.status) && (
              <div className="bg-saffron/5 border border-saffron/20 rounded-2xl p-5 text-center mb-6">
                <p className="text-xs text-foreground/40 uppercase font-bold mb-2">Delivery OTP</p>
                <p className="font-mono font-extrabold text-4xl tracking-[0.3em] text-saffron">{order.delivery_otp}</p>
                <p className="text-xs text-foreground/50 mt-2">Share this code with your rider when your order arrives</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleDownloadInvoice}
                className="flex flex-col items-center gap-1 py-3 rounded-xl border border-border hover:bg-muted transition-colors"
              >
                <Download className="w-5 h-5 text-foreground/60" />
                <span className="text-[10px] font-bold text-foreground/60">Invoice</span>
              </button>
              <Link
                to={`/track?order=${order.order_number}`}
                className="flex flex-col items-center gap-1 py-3 rounded-xl border border-border hover:bg-muted transition-colors"
              >
                <Truck className="w-5 h-5 text-saffron" />
                <span className="text-[10px] font-bold text-foreground/60">Track</span>
              </Link>
              <Link
                to="/#top-partners"
                className="flex flex-col items-center gap-1 py-3 rounded-xl border border-border hover:bg-muted transition-colors"
              >
                <ShoppingBag className="w-5 h-5 text-terai" />
                <span className="text-[10px] font-bold text-foreground/60">Shop</span>
              </Link>
            </div>

            <Link
              to={`/track?order=${order.order_number}`}
              className="w-full h-12 mt-4 rounded-xl bg-saffron text-white font-bold hover:bg-saffron/90 transition-colors flex items-center justify-center gap-2"
            >
              <Truck className="w-4 h-4" /> Track Your Order
            </Link>

            {siblingOrders.length > 0 && (
              <div className="mt-4 bg-saffron/5 border border-saffron/20 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="w-4 h-4 text-saffron" />
                  <p className="text-sm font-bold text-foreground">Multi-store Checkout</p>
                </div>
                <p className="text-xs text-foreground/50 mb-3">This order is part of a {siblingOrders.length + 1}-store checkout. Each order has its own rider and tracking.</p>
                <div className="space-y-2">
                  {siblingOrders.map((sib) => (
                    <Link key={sib.id} to={`/order/${sib.id}`} className="flex items-center justify-between p-2.5 rounded-xl bg-background hover:bg-muted transition-colors">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground">{sib.order_number}</p>
                        <p className="text-[11px] text-foreground/50 truncate">{sib.store_name}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-bold text-saffron">Rs {sib.total_amount}</span>
                        <Truck className="w-3.5 h-3.5 text-foreground/40" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}