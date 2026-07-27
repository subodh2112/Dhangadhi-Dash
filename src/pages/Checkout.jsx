import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Clock, Phone, CreditCard, Wallet, Banknote, Check, ArrowRight, Plus, Zap, Store, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBackButton from "@/components/MobileBackButton";
import DeliveryTimeEstimator from "@/components/DeliveryTimeEstimator";
import { useToast } from "@/components/ui/use-toast";

const paymentMethods = [
  { id: "wallet", label: "DDash Wallet", icon: Wallet, desc: "Pay via wallet" },
  { id: "esewa", label: "eSewa", icon: CreditCard, desc: "Pay via eSewa" },
  { id: "khalti", label: "Khalti", icon: CreditCard, desc: "Pay via Khalti" },
  { id: "fonepay", label: "Fonepay", icon: CreditCard, desc: "Pay via Fonepay" },
  { id: "card", label: "Card", icon: CreditCard, desc: "Visa / Mastercard" },
  { id: "cod", label: "Cash on Delivery", icon: Banknote, desc: "Pay with cash" },
];

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    items, storeBreakdowns, grandSubtotal, grandDiscount, grandDeliveryFee, grandServiceCharge, grandTaxes, grandTotal,
    deliveryInstructions, appliedCoupon, clearCart,
  } = useCart();
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [newAddress, setNewAddress] = useState("");
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [deliveryType, setDeliveryType] = useState("instant");
  const [scheduledTime, setScheduledTime] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [placing, setPlacing] = useState(false);
  const { toast } = useToast();
  const [addresses, setAddresses] = useState([]);
  const [expressReady, setExpressReady] = useState(false);

  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const data = await base44.entities.CustomerAddress.filter({ user_id: user?.id }, "-is_default");
        setAddresses(data);
        const def = data.find((a) => a.is_default);
        if (def) setSelectedAddress(def.id);
        else if (data.length > 0) setSelectedAddress(data[0].id);

        if (def) {
          const myOrders = await base44.entities.Order.filter({ customer_email: user?.email || "" }, "-created_date", 1).catch(() => []);
          const lastOrder = myOrders[0];
          if (lastOrder?.contact_number) {
            setContactNumber(lastOrder.contact_number);
            setExpressReady(true);
          }
        }
      } catch {}
    };
    if (user?.id) loadAddresses();
  }, [user?.id]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('status');
    const paymentId = urlParams.get('payment_id');
    const paymentMethodParam = urlParams.get('method');
    if (paymentStatus && paymentId && paymentMethodParam) {
      handlePaymentReturn(paymentStatus, paymentId, paymentMethodParam, urlParams.get('refId') || urlParams.get('oid') || paymentId);
    }
  }, []);

  const handlePaymentReturn = async (status, paymentId, method, refId) => {
    const stored = localStorage.getItem('pending_order_data');
    if (!stored) { toast({ title: "Order data not found. Please try again.", variant: "destructive" }); return; }
    const orderDataList = JSON.parse(stored);
    setPlacing(true);
    try {
      if (status === 'success') {
        const res = await base44.functions.invoke('verify_payment', { payment_id: paymentId, payment_method: method, transaction_reference: refId, order_data: orderDataList });
        if (res.data?.verified) {
          localStorage.removeItem('pending_order_data');
          for (const item of items) {
            const newStock = Math.max(0, (item.product.stock || 0) - item.quantity);
            await base44.entities.Product.update(item.product.id, { stock: newStock }).catch(() => {});
          }
          clearCart();
          navigate(`/order/${res.data.order_id}`);
        } else {
          toast({ title: "Payment verification failed", description: res.data?.error || "Please try again.", variant: "destructive" });
        }
      } else {
        toast({ title: "Payment cancelled or failed", variant: "destructive" });
      }
    } catch { toast({ title: "Payment processing error", variant: "destructive" }); }
    setPlacing(false);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-20 text-center">
          <p className="text-foreground/50 mb-4">Your cart is empty.</p>
          <Link to="/#top-partners" className="text-saffron font-bold">Browse Stores →</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const deliveryAddress = selectedAddress === "new" ? newAddress : addresses.find((a) => a.id === selectedAddress)?.full_address || "";

  const generateOrderNumber = () => "DD" + Math.floor(1000 + Math.random() * 9000);

  const handlePlaceOrder = async () => {
    if (!deliveryAddress || !contactNumber) return;
    setPlacing(true);
    try {
      // Stock validation
      for (const item of items) {
        if (item.product.stock !== undefined && item.product.stock !== null && item.product.stock < item.quantity) {
          toast({ title: "Out of Stock", description: `${item.product.name} only has ${item.product.stock} available.`, variant: "destructive" });
          setPlacing(false);
          return;
        }
      }

      const checkoutGroupId = "CG" + Date.now();

      // Resolve store + merchant IDs for each store group
      const enrichedBreakdowns = [];
      for (const sb of storeBreakdowns) {
        let storeId = sb.storeId || null;
        let merchantId = null;
        if (storeId) {
          try { const store = await base44.entities.Store.get(storeId); merchantId = store?.merchant_id || null; } catch {}
        }
        if (!storeId) {
          const stores = await base44.entities.Store.filter({ name: sb.storeName }).catch(() => []);
          if (stores.length > 0) { storeId = stores[0].id; merchantId = stores[0].merchant_id || null; }
        }
        enrichedBreakdowns.push({ ...sb, storeId, merchantId });
      }

      const orderDataList = enrichedBreakdowns.map((sb) => ({
        order_number: generateOrderNumber(),
        checkout_group_id: checkoutGroupId,
        customer_name: user?.full_name || user?.email || "Customer",
        customer_email: user?.email || "",
        status: "pending",
        items: sb.items.map((i) => `${i.quantity}x ${i.product.name}`).join(", "),
        store_name: sb.storeName,
        store_id: sb.storeId,
        merchant_id: sb.merchantId,
        delivery_address: deliveryAddress,
        estimated_minutes: 30,
        total_amount: sb.total,
        subtotal: sb.subtotal,
        delivery_fee: sb.deliveryFee,
        service_charge: sb.serviceCharge,
        taxes: sb.taxes,
        discount: sb.discount,
        coupon_code: appliedCoupon?.code || "",
        payment_method: paymentMethod,
        payment_status: paymentMethod === "cod" ? "pending" : "paid",
        contact_number: contactNumber,
        delivery_type: deliveryType,
        scheduled_time: scheduledTime || "",
        delivery_instructions: deliveryInstructions || "",
      }));

      if (paymentMethod === "cod" || paymentMethod === "wallet") {
        const createdOrders = await base44.entities.Order.bulkCreate(orderDataList);
        const firstOrder = Array.isArray(createdOrders) ? createdOrders[0] : createdOrders;
        try {
          await base44.entities.Payment.create({
            payment_id: "PAY" + Date.now(),
            order_id: firstOrder.id,
            checkout_group_id: checkoutGroupId,
            customer_id: user?.id || "",
            customer_name: user?.full_name || "",
            amount: grandTotal,
            payment_method: paymentMethod,
            payment_status: paymentMethod === "cod" ? "pending" : "successful",
            payment_date: new Date().toISOString(),
          });
        } catch {}
        for (const item of items) {
          const newStock = Math.max(0, (item.product.stock || 0) - item.quantity);
          await base44.entities.Product.update(item.product.id, { stock: newStock }).catch(() => {});
        }
        clearCart();
        navigate(`/order/${firstOrder.id}`);
      } else {
        localStorage.setItem('pending_order_data', JSON.stringify(orderDataList));
        const res = await base44.functions.invoke('initiate_payment', {
          order_id: 'pending',
          amount: grandTotal,
          payment_method: paymentMethod,
          order_number: checkoutGroupId,
        });
        if (res.data?.payment_url) {
          window.location.href = res.data.payment_url;
        } else {
          toast({ title: res.data?.error || "Failed to initiate payment. Gateway may not be configured yet.", variant: "destructive" });
          localStorage.removeItem('pending_order_data');
          setPlacing(false);
        }
      }
    } catch (err) {
      toast({ title: "Could not place order. Please try again.", variant: "destructive" });
      setPlacing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <MobileBackButton />
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground mb-2">Checkout</h1>
          {storeBreakdowns.length > 1 && (
            <p className="text-sm text-foreground/50 mb-6">Your cart has items from <span className="font-bold text-saffron">{storeBreakdowns.length} stores</span>. We'll split this into separate orders — each with its own rider and tracking.</p>
          )}
          {storeBreakdowns.length <= 1 && <div className="mb-6" />}

          {expressReady && !placing && (
            <div className="mb-6 bg-gradient-to-r from-saffron to-saffron/80 rounded-2xl p-5 text-white flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">Express Checkout Available</p>
                <p className="text-white/70 text-xs mt-0.5 line-clamp-1">
                  {addresses.find((a) => a.is_default)?.label?.toUpperCase() || "HOME"}: {addresses.find((a) => a.is_default)?.full_address} · Cash on Delivery · {contactNumber}
                </p>
              </div>
              <button
                onClick={() => handlePlaceOrder()}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-white text-saffron font-bold text-sm hover:bg-white/90 transition-colors flex-shrink-0 whitespace-nowrap"
              >
                <Zap className="w-4 h-4" /> Express Order
              </button>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Address */}
              <div className="bg-card rounded-2xl border border-border p-5">
                <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-saffron" /> Delivery Address
                </h3>
                <div className="space-y-2">
                  {addresses.map((addr) => (
                    <button
                      key={addr.id}
                      onClick={() => { setSelectedAddress(addr.id); setShowNewAddress(false); }}
                      className={"w-full text-left p-3 rounded-xl border transition-all " + (selectedAddress === addr.id ? "border-saffron bg-saffron/5" : "border-border hover:border-saffron/30")}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-saffron uppercase">{addr.label}</p>
                        {addr.is_default && <span className="text-[9px] bg-terai/10 text-terai font-bold px-1.5 py-0.5 rounded">DEFAULT</span>}
                      </div>
                      <p className="text-sm text-foreground/70">{addr.full_address}</p>
                    </button>
                  ))}
                  {showNewAddress ? (
                    <div className="p-3 rounded-xl border border-saffron/30 bg-saffron/5">
                      <label className="block text-xs font-bold text-saffron mb-2">Enter New Address</label>
                      <input
                        type="text"
                        value={newAddress}
                        onChange={(e) => setNewAddress(e.target.value)}
                        placeholder="Enter full delivery address"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => { setShowNewAddress(false); setNewAddress(""); }}
                          className="flex-1 h-9 rounded-lg border border-border text-xs font-bold text-foreground/60 hover:bg-muted transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => { if (newAddress) setSelectedAddress("new"); }}
                          disabled={!newAddress.trim()}
                          className="flex-1 h-9 rounded-lg bg-saffron text-white text-xs font-bold hover:bg-saffron/90 transition-colors disabled:opacity-50"
                        >
                          Confirm Address
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => { setShowNewAddress(true); setSelectedAddress("new"); }}
                        className="w-full p-3 rounded-xl border border-dashed border-border text-sm text-foreground/40 hover:border-saffron/40 hover:text-saffron flex items-center justify-center gap-1"
                      >
                        <Plus className="w-4 h-4" /> Add New Address
                      </button>
                      <Link to="/profile" className="block text-center text-xs text-saffron font-bold pt-1">Manage saved addresses</Link>
                    </>
                  )}
                </div>
              </div>

              {/* Delivery Time */}
              <div className="bg-card rounded-2xl border border-border p-5">
                <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-saffron" /> Delivery Time
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setDeliveryType("instant")}
                    className={`p-3 rounded-xl border text-left transition-all ${deliveryType === "instant" ? "border-saffron bg-saffron/5" : "border-border"}`}
                  >
                    <p className="text-sm font-bold text-foreground">Instant</p>
                    <p className="text-xs text-foreground/40">30-40 min</p>
                  </button>
                  <button
                    onClick={() => setDeliveryType("scheduled")}
                    className={`p-3 rounded-xl border text-left transition-all ${deliveryType === "scheduled" ? "border-saffron bg-saffron/5" : "border-border"}`}
                  >
                    <p className="text-sm font-bold text-foreground">Schedule</p>
                    <p className="text-xs text-foreground/40">Pick a time</p>
                  </button>
                </div>
                {deliveryType === "scheduled" && (
                  <input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full mt-3 px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-saffron/40"
                  />
                )}
              </div>

              {/* Delivery Time Estimator */}
              <DeliveryTimeEstimator storeBreakdowns={storeBreakdowns} />

              {/* Contact */}
              <div className="bg-card rounded-2xl border border-border p-5">
                <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-saffron" /> Contact Number
                </h3>
                <input
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="+977 98XXXXXXXX"
                  className="w-full h-12 px-4 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-saffron/40"
                />
              </div>

              {/* Payment */}
              <div className="bg-card rounded-2xl border border-border p-5">
                <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-saffron" /> Payment Method
                </h3>
                <div className="grid sm:grid-cols-2 gap-2">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          paymentMethod === method.id ? "border-saffron bg-saffron/5" : "border-border hover:border-saffron/30"
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${paymentMethod === method.id ? "text-saffron" : "text-foreground/40"}`} />
                        <div className="text-left">
                          <p className="text-sm font-semibold text-foreground">{method.label}</p>
                          <p className="text-[10px] text-foreground/40">{method.desc}</p>
                        </div>
                        {paymentMethod === method.id && <Check className="w-4 h-4 text-saffron ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-2xl border border-border p-5 sticky top-24">
                <h3 className="font-display font-bold text-lg text-foreground mb-4">Order Summary</h3>

                {/* Per-store breakdowns */}
                <div className="space-y-4 mb-4 max-h-[300px] overflow-y-auto no-scrollbar">
                  {storeBreakdowns.map((sb) => (
                    <div key={sb.storeId || sb.storeName} className="border border-border rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Store className="w-4 h-4 text-saffron flex-shrink-0" />
                        <p className="font-bold text-xs text-foreground truncate">{sb.storeName}</p>
                      </div>
                      <div className="space-y-1 mb-2">
                        {sb.items.map((item) => (
                          <div key={item.product.id} className="flex items-center justify-between text-xs">
                            <span className="text-foreground/50 line-clamp-1">{item.quantity}x {item.product.name}</span>
                            <span className="text-foreground/70 flex-shrink-0">Rs {item.product.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1 text-[11px] border-t border-border pt-2">
                        <div className="flex justify-between text-foreground/50"><span>Subtotal</span><span className="text-foreground">Rs {sb.subtotal}</span></div>
                        {sb.discount > 0 && <div className="flex justify-between text-terai"><span>Discount</span><span>- Rs {sb.discount}</span></div>}
                        <div className="flex justify-between text-foreground/50"><span>Delivery Fee</span><span className="text-foreground">{sb.deliveryFee === 0 ? "FREE" : `Rs ${sb.deliveryFee}`}</span></div>
                        <div className="flex justify-between text-foreground/50"><span>Service Charge</span><span className="text-foreground">Rs {sb.serviceCharge}</span></div>
                        <div className="flex justify-between text-foreground/50"><span>Tax (13%)</span><span className="text-foreground">Rs {sb.taxes}</span></div>
                        <div className="flex justify-between font-bold text-foreground pt-1"><span>Total</span><span className="text-saffron">Rs {sb.total}</span></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Grand total */}
                <div className="space-y-2 text-sm border-t border-border pt-3">
                  <div className="flex justify-between text-foreground/60"><span>Grand Subtotal</span><span className="text-foreground">Rs {grandSubtotal}</span></div>
                  {grandDiscount > 0 && <div className="flex justify-between text-terai"><span>Total Discount</span><span>- Rs {grandDiscount}</span></div>}
                  <div className="flex justify-between text-foreground/60"><span>Total Delivery Fee</span><span className="text-foreground">{grandDeliveryFee === 0 ? "FREE" : `Rs ${grandDeliveryFee}`}</span></div>
                  <div className="flex justify-between text-foreground/60"><span>Total Service Charge</span><span className="text-foreground">Rs {grandServiceCharge}</span></div>
                  <div className="flex justify-between text-foreground/60"><span>Total Taxes</span><span className="text-foreground">Rs {grandTaxes}</span></div>
                  <div className="border-t border-border pt-2 flex justify-between items-baseline">
                    <span className="font-bold text-foreground">Grand Total</span>
                    <span className="font-display font-extrabold text-xl text-saffron">Rs {grandTotal}</span>
                  </div>
                </div>
                <button
                  onClick={handlePlaceOrder}
                  disabled={placing || !contactNumber || !deliveryAddress}
                  className="w-full h-12 mt-5 rounded-xl bg-saffron text-white font-bold hover:bg-saffron/90 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
                >
                  {placing ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Placing {storeBreakdowns.length > 1 ? `${storeBreakdowns.length} Orders` : "Order"}...</>
                  ) : (
                    <>Place {storeBreakdowns.length > 1 ? `${storeBreakdowns.length} Orders` : "Order"} <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
                {storeBreakdowns.length > 1 && (
                  <p className="text-[10px] text-foreground/40 text-center mt-2 flex items-center justify-center gap-1">
                    <ShoppingBag className="w-3 h-3" /> Each store gets its own order number, rider & tracking
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}