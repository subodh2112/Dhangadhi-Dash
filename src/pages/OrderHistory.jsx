import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Package, RefreshCw, Star, Download, AlertCircle, Truck, Clock, Layers, Search, Filter, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import Navbar from "@/components/Navbar";
import { useCart } from "@/context/CartContext";
import Footer from "@/components/Footer";
import { useToast } from "@/components/ui/use-toast";
import PullToRefresh from "@/components/PullToRefresh";
import MobileBackButton from "@/components/MobileBackButton";

const statusColors = {
  pending: "bg-saffron", accepted: "bg-blue-500", preparing: "bg-amber-500",
  ready_for_pickup: "bg-purple-500", rider_assigned: "bg-indigo-500",
  picked_up: "bg-cyan-500", on_the_way: "bg-terai", delivered: "bg-green-600",
  rejected: "bg-red-500", cancelled: "bg-red-500",
};

const statusLabels = {
  pending: "Pending", accepted: "Accepted", preparing: "Preparing",
  ready_for_pickup: "Ready for Pickup", rider_assigned: "Rider Assigned",
  picked_up: "Picked Up", on_the_way: "On the Way", delivered: "Delivered",
  rejected: "Rejected", cancelled: "Cancelled",
};

export default function OrderHistory() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingModal, setRatingModal] = useState(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [reviewMessage, setReviewMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { addToCart, clearCart, storeName: cartStoreName, items: cartItems } = useCart();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== "all" && order.status !== statusFilter) return false;
    if (dateFilter) {
      const orderDate = new Date(order.created_date).toISOString().split("T")[0];
      if (orderDate !== dateFilter) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matches = (order.order_number || "").toLowerCase().includes(q) ||
        (order.store_name || "").toLowerCase().includes(q) ||
        (order.items || "").toLowerCase().includes(q);
      if (!matches) return false;
    }
    return true;
  });

  const loadOrders = async () => {
    setLoading(true);
    try {
      const role = user?.role === "user" ? "customer" : user?.role || "customer";
      if (role === "merchant") {
        const fullUser = await base44.auth.me();
        let sName = null;
        if (fullUser.store_id) {
          try { const store = await base44.entities.Store.get(fullUser.store_id); sName = store?.name; } catch {}
        }
        if (!sName) {
          const stores = await base44.entities.Store.filter({}, "-created_date", 100).catch(() => []);
          const myStore = stores.find((s) => s.created_by_id === user?.id);
          sName = myStore?.name;
        }
        if (sName) {
          const o = await base44.entities.Order.filter({ store_name: sName }, "-created_date", 50);
          setOrders(o);
        }
      } else if (role === "rider") {
        const allOrders = await base44.entities.Order.list("-created_date", 100);
        setOrders(allOrders.filter((o) => o.rider_name === user?.full_name));
      } else {
        const o = await base44.entities.Order.list("-created_date", 50);
        // Sort to group multi-store orders together by checkout_group_id
        const grouped = {};
        const standalone = [];
        o.forEach((order) => {
          if (order.checkout_group_id) {
            if (!grouped[order.checkout_group_id]) grouped[order.checkout_group_id] = [];
            grouped[order.checkout_group_id].push(order);
          } else {
            standalone.push(order);
          }
        });
        // Rebuild list: standalone orders in date order, with grouped orders kept together
        const result = [];
        const seenGroups = new Set();
        for (const order of o) {
          if (!order.checkout_group_id) {
            result.push(order);
          } else if (!seenGroups.has(order.checkout_group_id)) {
            seenGroups.add(order.checkout_group_id);
            result.push(...grouped[order.checkout_group_id]);
          }
        }
        setOrders(result);
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadOrders(); }, [user]);

  const handleRepeatOrder = async (order) => {
    try {
      const products = await base44.entities.Product.filter({ store_name: order.store_name });
      const itemsText = (order.items || "").toLowerCase();
      const matched = products.filter((p) => itemsText.includes(p.name.toLowerCase()));
      if (matched.length === 0) {
        alert(`Could not find matching items from ${order.store_name}. Please browse the store directly.`);
        return;
      }
      if (cartItems.length > 0 && cartStoreName !== order.store_name) {
        clearCart();
      }
      matched.forEach((p) => addToCart(p, 1));
      navigate("/cart");
    } catch {
      alert("Could not process reorder. Please try again.");
    }
  };

  const handleDownloadInvoice = (order) => {
    const invoice = `Dhangadhi Dash Invoice\nOrder: ${order.order_number}\nItems: ${order.items}\nTotal: Rs ${order.total_amount}\nDate: ${new Date(order.created_date).toLocaleString()}`;
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
        <PullToRefresh onRefresh={loadOrders}>
        <div className="mx-auto max-w-4xl">
          <MobileBackButton />
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground mb-6">Order History</h1>

          {!loading && orders.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-4 mb-6 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by order number, store, or items..."
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-saffron/40"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <Filter className="w-4 h-4 text-foreground/30 flex-shrink-0" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="flex-1 h-11 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-saffron/40"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="preparing">Preparing</option>
                    <option value="ready_for_pickup">Ready for Pickup</option>
                    <option value="rider_assigned">Rider Assigned</option>
                    <option value="picked_up">Picked Up</option>
                    <option value="on_the_way">On the Way</option>
                    <option value="delivered">Delivered</option>
                    <option value="rejected">Rejected</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <Clock className="w-4 h-4 text-foreground/30 flex-shrink-0" />
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="flex-1 h-11 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-saffron/40"
                  />
                  {dateFilter && (
                    <button onClick={() => setDateFilter("")} className="text-foreground/30 hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              {(searchQuery || statusFilter !== "all" || dateFilter) && (
                <p className="text-xs text-foreground/40">Showing {filteredOrders.length} of {orders.length} orders</p>
              )}
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border p-5 h-32 animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 text-foreground/30" />
              </div>
              <p className="text-foreground/50 mb-4">No orders yet.</p>
              <Link to="/#top-partners" className="text-saffron font-bold">Start Ordering →</Link>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-foreground/30" />
              </div>
              <p className="text-foreground/50 mb-4">No orders match your filters.</p>
              <button onClick={() => { setSearchQuery(""); setStatusFilter("all"); setDateFilter(""); }} className="text-saffron font-bold">Clear Filters →</button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order, i) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card rounded-2xl border border-border p-5"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-display font-bold text-lg text-foreground">{order.order_number}</p>
                        <span className={`${statusColors[order.status] || "bg-carbon"} text-white text-[10px] font-bold px-2 py-0.5 rounded-full`}>
                          {statusLabels[order.status] || order.status}
                        </span>
                        {order.checkout_group_id && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-saffron bg-saffron/10 px-2 py-0.5 rounded-full">
                            <Layers className="w-3 h-3" /> Multi-store
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-foreground/40 mt-0.5">
                        {new Date(order.created_date).toLocaleDateString()} · {order.store_name}
                      </p>
                    </div>
                    <p className="font-display font-extrabold text-lg text-saffron">Rs {order.total_amount}</p>
                  </div>

                  <p className="text-sm text-foreground/60 mb-4 line-clamp-2">{order.items}</p>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/track?order=${order.order_number}`}
                      className="flex items-center gap-1 text-xs font-bold text-saffron bg-saffron/10 px-3 py-1.5 rounded-full hover:bg-saffron/20"
                    >
                      <Truck className="w-3.5 h-3.5" /> Track
                    </Link>
                    <button
                      onClick={() => handleRepeatOrder(order)}
                      className="flex items-center gap-1 text-xs font-bold text-terai bg-terai/10 px-3 py-1.5 rounded-full hover:bg-terai/20"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Repeat Order
                    </button>
                    <button
                      onClick={() => handleDownloadInvoice(order)}
                      className="flex items-center gap-1 text-xs font-bold text-foreground/60 bg-muted px-3 py-1.5 rounded-full hover:bg-muted/70"
                    >
                      <Download className="w-3.5 h-3.5" /> Invoice
                    </button>
                    {order.status === "delivered" && !order.merchant_rating && (
                      <button
                        onClick={() => { setRatingModal(order); setSelectedRating(0); setReviewMessage(""); }}
                        className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full hover:bg-amber-100"
                      >
                        <Star className="w-3.5 h-3.5" /> Rate
                      </button>
                    )}
                    {order.status === "delivered" && (
                      <button
                        onClick={() => alert("Refund request submitted. Our team will contact you shortly.")}
                        className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-full hover:bg-red-100"
                      >
                        <AlertCircle className="w-3.5 h-3.5" /> Report Issue
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
        </PullToRefresh>
      </main>

      {ratingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-carbon/50 backdrop-blur-sm" onClick={() => setRatingModal(null)}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-3xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display font-bold text-lg text-foreground mb-1">Rate Your Experience</h3>
            <p className="text-sm text-foreground/50 mb-4">{ratingModal.store_name} · {ratingModal.order_number}</p>
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setSelectedRating(star)} className={`text-3xl transition-transform hover:scale-110 ${selectedRating >= star ? "opacity-100" : "opacity-30"}`}>⭐</button>
              ))}
            </div>
            <textarea
              rows={3}
              value={reviewMessage}
              onChange={(e) => setReviewMessage(e.target.value)}
              placeholder="Share your experience..."
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40 resize-none mb-4"
            />
            <button
              onClick={async () => {
                if (!selectedRating) return;
                setSubmitting(true);
                try {
                  await base44.entities.Review.create({
                    target_type: "store", target_name: ratingModal.store_name, store_id: ratingModal.store_id,
                    customer_name: user?.full_name || user?.email || "Customer", rating: selectedRating,
                    message: reviewMessage || "Great service!", order_id: ratingModal.id, is_verified_purchase: true,
                  });
                  await base44.entities.Order.update(ratingModal.id, { merchant_rating: selectedRating });
                  setOrders((prev) => prev.map((o) => o.id === ratingModal.id ? { ...o, merchant_rating: selectedRating } : o));
                  toast({ title: "Review submitted!" });
                  setRatingModal(null); setSelectedRating(0); setReviewMessage("");
                } catch { toast({ title: "Failed to submit review", variant: "destructive" }); }
                finally { setSubmitting(false); }
              }}
              disabled={!selectedRating || submitting}
              className="w-full h-11 rounded-xl bg-saffron text-white font-bold hover:bg-saffron/90 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Rating"}
            </button>
          </motion.div>
        </div>
      )}

      <Footer />
    </div>
  );
}