import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bike, TrendingUp, Star, Package, MapPin, Power, Store, Navigation, Check, Loader2, Wallet, X, Clock, Calendar, ChevronRight, Phone, User, Flag } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { creditRiderWallet } from "@/lib/riderWallet";
import { updateRiderLocation, calculateETA } from "@/lib/riderTracking";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PullToRefresh from "@/components/PullToRefresh";
import { sendOrderStatusEmail } from "@/lib/orderNotifications";
import { acceptDeliveryRequest, rejectDeliveryRequest } from "@/lib/riderDispatch";
import DeliveryRequestModal from "@/components/rider/DeliveryRequestModal";
import EmergencyButton from "@/components/support/EmergencyButton";
import RiderIssueReport from "@/components/support/RiderIssueReport";
import CallSupportButton from "@/components/support/CallSupportButton";
import TimeGreeting from "@/components/TimeGreeting";

const statusLabels = {
  available: "Online",
  on_delivery: "On Delivery",
  busy: "Busy",
  on_break: "On Break",
  offline: "Offline",
};

const statusColors = {
  available: "bg-terai/10 text-terai",
  on_delivery: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  busy: "bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
  on_break: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400",
  offline: "bg-muted text-foreground/40",
};

export default function RiderDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [rider, setRider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("available");
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectedOrders, setRejectedOrders] = useState([]);
  const [historyFilter, setHistoryFilter] = useState("today");
  const [otpModal, setOtpModal] = useState(null);
  const [otpInput, setOtpInput] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [deliveryRequest, setDeliveryRequest] = useState(null);
  const [showReport, setShowReport] = useState(null);

  const loadData = async () => {
    Promise.all([
      base44.entities.Order.list("-created_date", 200).catch(() => []),
      base44.entities.Rider.list("-created_date", 50).catch(() => []),
    ]).then(([o, r]) => {
      setOrders(o);
      const matchedRider = r.find((rdr) => rdr.name === user?.full_name || rdr.user_id === user?.id) || null;
      setRider(matchedRider);
      setStatus(matchedRider?.status || "available");
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    const pollRequests = async () => {
      try {
        const requests = await base44.entities.DeliveryRequest.filter({ rider_id: user.id, status: "pending" }).catch(() => []);
        const now = Date.now();
        for (const req of requests) {
          if (new Date(req.expires_at).getTime() < now) {
            await rejectDeliveryRequest(req, "expired");
          }
        }
        const active = requests.filter((r) => new Date(r.expires_at).getTime() >= now);
        setDeliveryRequest((prev) => prev || (active.length > 0 ? active[0] : null));
      } catch {}
    };
    pollRequests();
    const interval = setInterval(pollRequests, 5000);
    return () => clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") Notification.requestPermission();
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const unsubscribe = base44.entities.DeliveryRequest.subscribe((event) => {
      if (event.type === "create" && event.data?.rider_id === user.id && event.data?.status === "pending") {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("New Delivery Request!", { body: "You have a new delivery request. Tap to accept now!" });
        }
        toast({ title: "New Delivery Request!", description: "Check the popup to accept or reject." });
      }
    });
    return unsubscribe;
  }, [user?.id]);

  useEffect(() => {
    if (navigator.geolocation && rider?.id) {
      navigator.geolocation.getCurrentPosition((pos) => {
        base44.entities.Rider.update(rider.id, { latitude: pos.coords.latitude, longitude: pos.coords.longitude }).catch(() => {});
      }, () => {}, { enableHighAccuracy: true, timeout: 10000 });
    }
  }, [rider]);

  useEffect(() => {
    if (!user?.id) return;
    const trackLocation = () => {
      const active = orders.filter((o) => (o.rider_name === user?.full_name || o.rider_id === user?.id) && ["rider_assigned", "picked_up", "on_the_way"].includes(o.status));
      if (active.length === 0) return;
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          updateRiderLocation(user.id, user.full_name, pos.coords.latitude, pos.coords.longitude, pos.coords.speed, pos.coords.heading, active[0].id);
        }, () => {}, { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 });
      }
    };
    trackLocation();
    const interval = setInterval(trackLocation, 5000);
    return () => clearInterval(interval);
  }, [user?.id, orders]);

  const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

  const acceptDelivery = async (order) => {
    if (actionLoading === order.id) return;
    setActionLoading(order.id);
    const otp = generateOTP();
    const prevOrders = orders;
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, rider_name: user?.full_name, rider_id: user?.id, status: "rider_assigned", delivery_otp: otp } : o)));
    try {
      await base44.entities.Order.update(order.id, { rider_name: user?.full_name, rider_id: user?.id, status: "rider_assigned", delivery_otp: otp });
      try { await base44.entities.AuditLog.create({ action: "delivery_accepted", target_type: "order", target_name: order.order_number, details: `Rider ${user?.full_name} accepted delivery` }); } catch {}
      if (rider?.id) await base44.entities.Rider.update(rider.id, { status: "on_delivery" });
      setStatus("on_delivery");
      await base44.entities.Notification.create({
        recipient_type: "customer",
        recipient_user_id: order.created_by_id,
        title: "Rider Assigned!",
        message: `Your rider ${user?.full_name} is on the way. Share OTP ${otp} with the rider when your order arrives.`,
        type: "rider_assigned",
        related_order_id: order.id,
      }).catch(() => {});
      sendOrderStatusEmail({ ...order, rider_name: user?.full_name, status: "rider_assigned" }, "rider_assigned");
      toast({ title: "Delivery accepted!", description: `Delivery OTP: ${otp}` });
    } catch { setOrders(prevOrders); toast({ title: "Failed to accept", variant: "destructive" }); }
    finally { setActionLoading(null); }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    if (actionLoading === orderId) return;
    setActionLoading(orderId);
    const prevOrders = orders;
    const updateData = { status: newStatus };
    if (newStatus === "picked_up") updateData.pickup_time = new Date().toISOString();
    if (newStatus === "on_the_way") updateData.delivery_started_time = new Date().toISOString();
    if (newStatus === "delivered") updateData.delivered_time = new Date().toISOString();
    if (newStatus === "rider_assigned") updateData.estimated_delivery_time = new Date(Date.now() + ((orders.find(o => o.id === orderId)?.estimated_minutes || 30) * 60000)).toISOString();
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...updateData } : o)));
    try {
      await base44.entities.Order.update(orderId, updateData);
      if (newStatus === "delivered" && rider?.id) {
        const deliveredOrder = orders.find(o => o.id === orderId);
        const earning = (deliveredOrder?.delivery_fee || 40) + (deliveredOrder?.rider_tip || 0);
        await creditRiderWallet(user.id, user.full_name, earning).catch(() => {});
        await base44.entities.Rider.update(rider.id, {
          total_deliveries: (rider.total_deliveries || 0) + 1,
          total_earnings: (rider.total_earnings || 0) + earning,
          status: "available"
        });
        setStatus("available");
        try {
          const order = orders.find((o) => o.id === orderId);
          if (order?.created_by_id) {
            const pointsToAward = Math.floor((order.total_amount || 0) / 10);
            let rewards = await base44.entities.Reward.filter({ user_id: order.created_by_id }).catch(() => []);
            if (rewards.length > 0) {
              const r = rewards[0];
              const newPoints = (r.points || 0) + pointsToAward;
              const newTotal = (r.total_spent || 0) + (order.total_amount || 0);
              let newLevel = "Bronze";
              if (newPoints >= 5000) newLevel = "Diamond";
              else if (newPoints >= 1000) newLevel = "Platinum";
              else if (newPoints >= 500) newLevel = "Gold";
              else if (newPoints >= 100) newLevel = "Silver";
              await base44.entities.Reward.update(r.id, { points: newPoints, total_spent: newTotal, level: newLevel });
            } else {
              await base44.entities.Reward.create({ user_id: order.created_by_id, customer_name: order.customer_name || "Customer", points: pointsToAward, total_spent: order.total_amount || 0, level: pointsToAward >= 100 ? "Silver" : "Bronze", rewards_redeemed: 0 });
            }
          }
        } catch {}
      }
      sendOrderStatusEmail(orders.find((o) => o.id === orderId), newStatus);
      toast({ title: `Order ${newStatus.replace(/_/g, " ")}` });
    } catch { setOrders(prevOrders); toast({ title: "Failed", variant: "destructive" }); }
    finally { setActionLoading(null); }
  };

  const verifyOTPAndDeliver = async (orderId) => {
    if (actionLoading === orderId) return;
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    if (otpInput !== order.delivery_otp) {
      toast({ title: "Incorrect OTP", description: "Please ask the customer for the correct OTP.", variant: "destructive" });
      setOtpInput("");
      return;
    }
    setOtpModal(null);
    setOtpInput("");
    await updateOrderStatus(orderId, "delivered");
  };

  const rejectOrder = async (orderId) => {
    setRejectedOrders((prev) => [...prev, orderId]);
    toast({ title: "Order skipped" });
    // Notify next available rider about this delivery
    try {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;
      const riders = await base44.entities.Rider.filter({ status: "available" }).catch(() => []);
      const nextRider = riders.find((r) => r.user_id && r.user_id !== user?.id && !r.is_suspended);
      if (nextRider) {
        await base44.entities.Notification.create({
          recipient_type: "rider",
          recipient_user_id: nextRider.user_id,
          title: "Delivery Available",
          message: `Order ${order.order_number} from ${order.store_name}. Rs ${order.delivery_fee || 40} delivery fee. Tap to accept!`,
          type: "rider_request",
          related_order_id: orderId,
        }).catch(() => {});
      }
    } catch {}
  };

  const handleAcceptRequest = async () => {
    if (!deliveryRequest || actionLoading === "request") return;
    setActionLoading("request");
    try {
      await acceptDeliveryRequest(deliveryRequest, user);
      setDeliveryRequest(null);
      loadData();
      toast({ title: "Delivery accepted!" });
    } catch {
      toast({ title: "Failed to accept", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (reason) => {
    if (!deliveryRequest) return;
    try {
      await rejectDeliveryRequest(deliveryRequest, reason);
      setDeliveryRequest(null);
      loadData();
    } catch {}
  };

  const cycleStatus = () => {
    const statuses = ["available", "busy", "on_break", "offline"];
    const currentIdx = statuses.indexOf(status);
    const newStatus = statuses[(currentIdx + 1) % statuses.length];
    setStatus(newStatus);
    if (rider?.id) base44.entities.Rider.update(rider.id, { status: newStatus }).catch(() => {});
  };

  const navigateTo = (address, label) => {
    const encoded = encodeURIComponent(address || "Dhangadhi, Nepal");
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`, "_blank");
    toast({ title: `Opening Google Maps: ${label}` });
  };

  // Filter orders
  const availableDeliveries = orders.filter((o) => !o.rider_name && !o.rider_id && ["accepted", "ready_for_pickup"].includes(o.status) && !rejectedOrders.includes(o.id));
  const myActive = orders.filter((o) => (o.rider_name === user?.full_name || o.rider_id === user?.id) && ["rider_assigned", "picked_up", "on_the_way"].includes(o.status));
  const myCompleted = orders.filter((o) => (o.rider_name === user?.full_name || o.rider_id === user?.id) && o.status === "delivered");
  const myCancelled = orders.filter((o) => (o.rider_name === user?.full_name || o.rider_id === user?.id) && ["cancelled", "rejected"].includes(o.status));

  // Earnings calculations
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;
  const monthStart = todayStart - 30 * 24 * 60 * 60 * 1000;

  const getOrderTime = (o) => new Date(o.created_date || o.updated_date || Date.now()).getTime();

  const earningsToday = myCompleted.filter((o) => getOrderTime(o) >= todayStart).reduce((sum, o) => sum + (o.delivery_fee || 40), 0);
  const earningsWeek = myCompleted.filter((o) => getOrderTime(o) >= weekStart).reduce((sum, o) => sum + (o.delivery_fee || 40), 0);
  const earningsMonth = myCompleted.filter((o) => getOrderTime(o) >= monthStart).reduce((sum, o) => sum + (o.delivery_fee || 40), 0);
  const earningsTotal = myCompleted.reduce((sum, o) => sum + (o.delivery_fee || 40), 0);

  const completedToday = myCompleted.filter((o) => getOrderTime(o) >= todayStart).length;
  const pendingPickups = myActive.filter((o) => o.status === "rider_assigned").length;

  // History filtering
  const getFilteredHistory = () => {
    let history = [...myCompleted, ...myCancelled];
    if (historyFilter === "today") history = history.filter((o) => getOrderTime(o) >= todayStart);
    else if (historyFilter === "week") history = history.filter((o) => getOrderTime(o) >= weekStart);
    else if (historyFilter === "month") history = history.filter((o) => getOrderTime(o) >= monthStart);
    else if (historyFilter === "completed") history = myCompleted;
    else if (historyFilter === "cancelled") history = myCancelled;
    return history.sort((a, b) => getOrderTime(b) - getOrderTime(a));
  };

  const filteredHistory = getFilteredHistory();

  const stats = [
    { label: "Today's Deliveries", value: completedToday, icon: Package, color: "bg-saffron/10 text-saffron" },
    { label: "Pending Pickups", value: pendingPickups, icon: Clock, color: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400" },
    { label: "Completed", value: myCompleted.length, icon: Check, color: "bg-terai/10 text-terai" },
    { label: "Today's Earnings", value: `Rs ${earningsToday}`, icon: Wallet, color: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400" },
    { label: "Week Earnings", value: `Rs ${earningsWeek}`, icon: TrendingUp, color: "bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400" },
    { label: "Month Earnings", value: `Rs ${earningsMonth}`, icon: Calendar, color: "bg-pink-50 text-pink-500 dark:bg-pink-500/10 dark:text-pink-400" },
    { label: "Total Earnings", value: `Rs ${earningsTotal}`, icon: Wallet, color: "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400" },
    { label: "Rating", value: rider?.rating?.toFixed(1) || "—", icon: Star, color: "bg-saffron/10 text-saffron" },
  ];

  const historyTabs = [
    { key: "today", label: "Today" },
    { key: "week", label: "Week" },
    { key: "month", label: "Month" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" },
  ];

  const renderAvailableCard = (order) => (
    <motion.div key={order.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-bold text-sm text-foreground flex items-center gap-1"><Store className="w-3.5 h-3.5 text-saffron" /> {order.store_name}</p>
          <p className="text-xs text-foreground/40">{order.order_number}</p>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-saffron/10 text-saffron">{order.status === "ready_for_pickup" ? "Ready" : "Accepted"}</span>
      </div>
      <div className="space-y-1.5 mb-3">
        <p className="text-xs text-foreground/50 flex items-center gap-1"><Store className="w-3 h-3" /> Pickup: {order.store_name}</p>
        <p className="text-xs text-foreground/50 flex items-center gap-1"><MapPin className="w-3 h-3" /> Drop: {order.delivery_address}</p>
      </div>
      <div className="flex items-center justify-between mb-3 text-xs">
        <span className="text-foreground/40">Order Value: <b className="text-foreground">Rs {order.total_amount}</b></span>
        <span className="text-terai font-bold">+Rs {order.delivery_fee || 40}</span>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => acceptDelivery(order)} disabled={actionLoading === order.id || status !== "available"} className="bg-terai hover:bg-terai/90 h-8 flex-1"><Check className="w-3.5 h-3.5" /> Accept</Button>
        <Button size="sm" variant="outline" onClick={() => rejectOrder(order.id)} disabled={actionLoading === order.id} className="h-8"><X className="w-3.5 h-3.5" /> Skip</Button>
      </div>
    </motion.div>
  );

  const renderActiveCard = (order) => (
    <motion.div key={order.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-bold text-sm text-foreground">{order.order_number}</p>
          <p className="text-xs text-foreground/40">{order.store_name}</p>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400 capitalize">{order.status.replace(/_/g, " ")}</span>
      </div>
      <div className="space-y-1.5 mb-3">
        <p className="text-xs text-foreground/50 flex items-center gap-1"><Store className="w-3 h-3" /> {order.store_name}</p>
        <p className="text-xs text-foreground/50 flex items-center gap-1"><MapPin className="w-3 h-3" /> {order.delivery_address}</p>
        {order.contact_number && <p className="text-xs text-foreground/50 flex items-center gap-1"><Phone className="w-3 h-3" /> {order.contact_number}</p>}
      </div>
      <div className="flex items-center justify-between mb-3 text-xs">
        <span className="text-foreground/40">Earning: <b className="text-terai">Rs {order.delivery_fee || 40}</b></span>
        {order.delivery_otp && <span className="font-mono font-bold text-saffron bg-saffron/10 px-2 py-0.5 rounded">OTP: {order.delivery_otp}</span>}
      </div>
      {rider?.latitude && rider?.longitude && ["rider_assigned", "picked_up", "on_the_way"].includes(order.status) && (() => {
        const dest = order.status === "on_the_way" ? [28.7080, 80.6180] : [28.6960, 80.5900];
        const etaResult = calculateETA(rider.latitude, rider.longitude, dest[0], dest[1]);
        return etaResult.distanceKm > 0 ? (
          <div className="flex items-center gap-2 mb-3 text-xs">
            <Navigation className="w-3.5 h-3.5 text-saffron" />
            <span className="text-foreground/50">{etaResult.distanceKm} km away · ~{etaResult.etaMinutes} min</span>
          </div>
        ) : null;
      })()}
      {/* Navigation buttons */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button onClick={() => navigateTo(order.store_name, "Pickup")} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-muted text-foreground/70 text-xs font-semibold hover:text-foreground transition-colors">
          <Navigation className="w-3.5 h-3.5" /> Navigate to Pickup
        </button>
        <button onClick={() => navigateTo(order.delivery_address, "Drop-off")} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-muted text-foreground/70 text-xs font-semibold hover:text-foreground transition-colors">
          <Navigation className="w-3.5 h-3.5" /> Navigate to Drop
        </button>
      </div>
      {/* Action buttons */}
      <div className="flex gap-2">
        {order.status === "rider_assigned" && <Button size="sm" onClick={() => updateOrderStatus(order.id, "picked_up")} disabled={actionLoading === order.id} className="bg-cyan-500 hover:bg-cyan-600 h-8 flex-1"><Package className="w-3.5 h-3.5" /> Picked Up</Button>}
        {order.status === "picked_up" && <Button size="sm" onClick={() => updateOrderStatus(order.id, "on_the_way")} disabled={actionLoading === order.id} className="bg-saffron hover:bg-saffron/90 h-8 flex-1"><Navigation className="w-3.5 h-3.5" /> Start Delivery</Button>}
        {order.status === "on_the_way" && <Button size="sm" onClick={() => { setOtpModal(order); setOtpInput(""); }} disabled={actionLoading === order.id} className="bg-terai hover:bg-terai/90 h-8 flex-1"><Check className="w-3.5 h-3.5" /> Complete Delivery</Button>}
      </div>
      <div className="flex gap-2 mt-2">
        <EmergencyButton orderId={order.id} userType="rider" />
        <button onClick={() => setShowReport(order)} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-muted text-foreground/70 text-xs font-semibold hover:text-saffron transition-colors flex-1">
          <Flag className="w-3.5 h-3.5" /> Report Problem
        </button>
      </div>
    </motion.div>
  );

  const renderHistoryItem = (order) => (
    <div key={order.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${order.status === "delivered" ? "bg-terai/10 text-terai" : "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400"}`}>
        {order.status === "delivered" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground truncate">{order.order_number}</p>
        <p className="text-xs text-foreground/40 truncate">{order.store_name} → {order.delivery_address}</p>
      </div>
      <div className="text-right flex-shrink-0">
        {order.status === "delivered" ? (
          <p className="text-sm font-bold text-terai">+Rs {order.delivery_fee || 40}</p>
        ) : (
          <p className="text-xs font-bold text-red-500 capitalize">{order.status}</p>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20 px-4 sm:px-6">
        <PullToRefresh onRefresh={loadData}>
        <div className="mx-auto max-w-5xl">
          <TimeGreeting subtitle="Welcome back to Dhangadhi Dash. Let's make today productive." />
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground">Rider Dashboard</h1>
              <p className="text-foreground/50 text-sm mt-1">
                {rider?.rider_code && <span className="font-mono text-saffron mr-2">{rider.rider_code}</span>}
                Your deliveries and earnings.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/rider/profile" className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-muted text-foreground/70 hover:text-saffron text-xs font-bold transition-colors"><User className="w-3.5 h-3.5" /><span className="hidden sm:inline">Profile</span></Link>
              <Link to="/rider/wallet" className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-muted text-foreground/70 hover:text-saffron text-xs font-bold transition-colors"><Wallet className="w-3.5 h-3.5" /><span className="hidden sm:inline">Wallet</span></Link>
              <button onClick={cycleStatus} className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all ${statusColors[status] || statusColors.offline}`}>
              <span className={`w-2 h-2 rounded-full ${status === "available" ? "bg-terai animate-pulse" : status === "offline" ? "bg-carbon/30" : "bg-current"}}`} />
              {statusLabels[status] || status}
              <Power className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-2xl border border-border p-5">
                  <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}><Icon className="w-5 h-5" /></div>
                  <p className="text-2xl font-display font-extrabold text-foreground">{stat.value}</p>
                  <p className="text-xs text-foreground/40 font-medium">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Available + Active Deliveries */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-card rounded-3xl border border-border p-6">
              <h2 className="font-display font-bold text-lg text-foreground mb-4">Available Deliveries {status === "available" ? `(${availableDeliveries.length})` : ""}</h2>
              {status !== "available" ? (
                <div className="text-center py-8"><Power className="w-10 h-10 text-foreground/20 mx-auto mb-2" /><p className="text-sm text-foreground/40">Go online to see available deliveries.</p></div>
              ) : availableDeliveries.length === 0 ? (
                <div className="text-center py-8"><Bike className="w-10 h-10 text-foreground/20 mx-auto mb-2" /><p className="text-sm text-foreground/40">No available deliveries right now.</p></div>
              ) : (
                <div className="space-y-3">{availableDeliveries.map(renderAvailableCard)}</div>
              )}
            </div>

            <div className="bg-card rounded-3xl border border-border p-6">
              <h2 className="font-display font-bold text-lg text-foreground mb-4">My Active Deliveries ({myActive.length})</h2>
              {myActive.length === 0 ? (
                <div className="text-center py-8"><Package className="w-10 h-10 text-foreground/20 mx-auto mb-2" /><p className="text-sm text-foreground/40">No active deliveries.</p></div>
              ) : (
                <div className="space-y-3">{myActive.map(renderActiveCard)}</div>
              )}
            </div>
          </div>

          {/* Delivery History */}
          <div className="bg-card rounded-3xl border border-border p-6">
            <button onClick={() => setShowHistory(!showHistory)} className="flex items-center justify-between w-full mb-4">
              <h2 className="font-display font-bold text-lg text-foreground">Delivery History</h2>
              <ChevronRight className={`w-5 h-5 text-foreground/40 transition-transform ${showHistory ? "rotate-90" : ""}`} />
            </button>
            {showHistory && (
              <>
                <div className="flex gap-1 p-1 bg-muted rounded-xl mb-4 overflow-x-auto no-scrollbar">
                  {historyTabs.map((tab) => (
                    <button key={tab.key} onClick={() => setHistoryFilter(tab.key)} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${historyFilter === tab.key ? "bg-background text-saffron shadow-sm" : "text-foreground/50"}`}>
                      {tab.label}
                    </button>
                  ))}
                </div>
                {filteredHistory.length === 0 ? (
                  <p className="text-sm text-foreground/40 text-center py-8">No deliveries in this period.</p>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {filteredHistory.map(renderHistoryItem)}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        </PullToRefresh>
      </main>
      <Footer />

      {/* OTP Delivery Proof Modal */}
      {otpModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-carbon/50 backdrop-blur-sm" onClick={() => setOtpModal(null)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-card rounded-3xl border border-border p-6 max-w-sm w-full">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-terai/10 flex items-center justify-center">
                <Check className="w-5 h-5 text-terai" />
              </div>
              <div>
                <h3 className="font-display font-bold text-foreground">Delivery Proof</h3>
                <p className="text-xs text-foreground/40">{otpModal.order_number}</p>
              </div>
            </div>
            <p className="text-sm text-foreground/60 mb-4">Ask the customer for the 4-digit OTP to complete this delivery.</p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
              placeholder="• • • •"
              className="w-full h-14 text-center text-2xl font-mono font-bold tracking-[0.5em] rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-terai/40 focus:border-terai mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOtpModal(null)} className="flex-1">Cancel</Button>
              <Button onClick={() => verifyOTPAndDeliver(otpModal.id)} disabled={otpInput.length !== 4 || actionLoading === otpModal.id} className="flex-1 bg-terai hover:bg-terai/90">
                {actionLoading === otpModal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Verify & Deliver
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {deliveryRequest && (
        <DeliveryRequestModal
          request={deliveryRequest}
          onAccept={handleAcceptRequest}
          onReject={handleRejectRequest}
        />
      )}

      {showReport && (
        <RiderIssueReport order={showReport} onClose={() => setShowReport(null)} onCreated={() => setShowReport(null)} />
      )}

      <CallSupportButton userType="rider" />
    </div>
  );
}