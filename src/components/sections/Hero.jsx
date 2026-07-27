import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Mic, QrCode, MapPin, ChevronDown, Star, Clock, Navigation } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 20 || hour < 5) return "Good Night";
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function Hero() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddr, setSelectedAddr] = useState(null);
  const [showAddrDropdown, setShowAddrDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    base44.entities.CustomerAddress.filter({ user_id: user.id }, "-is_default")
      .then((data) => {
        setAddresses(data);
        const def = data.find((a) => a.is_default) || data[0];
        if (def) setSelectedAddr(def);
      })
      .catch(() => {});
  }, [user?.id]);

  const firstName = user?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  const initial = firstName[0]?.toUpperCase() || "U";

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate("/search?q=" + encodeURIComponent(searchQuery.trim()));
    } else {
      navigate("/search");
    }
  };

  return (
    <section className="relative pt-24 sm:pt-28 lg:pt-32 pb-8 px-4 sm:px-6 overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-saffron/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 left-0 w-[300px] h-[300px] bg-terai/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-5xl">
        {/* Greeting + Avatar */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm font-medium text-foreground/50">{getGreeting()},</p>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground tracking-tight">
              {firstName} <span className="inline-block animate-float">👋</span>
            </h1>
          </div>
          <Link to="/profile" className="relative flex-shrink-0 group">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-saffron to-saffron/80 flex items-center justify-center shadow-lg shadow-saffron/20 group-hover:scale-105 transition-transform">
              <span className="font-bold text-white text-base">{initial}</span>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-terai border-2 border-background rounded-full" />
          </Link>
        </motion.div>

        {/* Address selector */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="relative mb-4">
          <button
            onClick={() => setShowAddrDropdown(!showAddrDropdown)}
            className="flex items-center gap-2 text-sm font-medium text-foreground/70 hover:text-saffron transition-colors max-w-full"
          >
            <span className="w-7 h-7 rounded-lg bg-saffron/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-3.5 h-3.5 text-saffron" />
            </span>
            <span className="truncate max-w-[220px] sm:max-w-sm">
              {selectedAddr ? selectedAddr.full_address : "Deliver to — Select address"}
            </span>
            <ChevronDown className={"w-4 h-4 flex-shrink-0 transition-transform " + (showAddrDropdown ? "rotate-180" : "")} />
          </button>

          <AnimatePresence>
            {showAddrDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute z-30 mt-2 w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden"
              >
                {addresses.length === 0 ? (
                  <Link to="/profile" className="flex items-center gap-2 p-4 text-sm text-foreground/60 hover:bg-muted">
                    <Navigation className="w-4 h-4 text-terai" /> No saved addresses. Add one in your profile.
                  </Link>
                ) : (
                  addresses.map((addr) => (
                    <button
                      key={addr.id}
                      onClick={() => { setSelectedAddr(addr); setShowAddrDropdown(false); }}
                      className="w-full text-left p-3 hover:bg-muted border-b border-border last:border-0 flex items-start gap-2.5"
                    >
                      <MapPin className="w-4 h-4 text-saffron mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-saffron uppercase tracking-wide">{addr.label}</span>
                        <p className="text-sm text-foreground/70 truncate">{addr.full_address}</p>
                      </div>
                      {selectedAddr?.id === addr.id && (
                        <span className="ml-auto text-[9px] bg-terai/10 text-terai font-bold px-1.5 py-0.5 rounded flex-shrink-0">DEFAULT</span>
                      )}
                    </button>
                  ))
                )}
                <Link to="/profile" className="block p-3 text-center text-xs font-bold text-saffron hover:bg-saffron/5 border-t border-border">
                  + Manage Addresses
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Search bar */}
        <motion.form
          onSubmit={handleSearch}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="relative"
        >
          <div className="relative flex items-center bg-card border border-border rounded-2xl shadow-lg shadow-carbon/5 overflow-hidden">
            <Search className="absolute left-4 w-5 h-5 text-foreground/30 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, stores, brands..."
              className="w-full h-14 sm:h-16 pl-12 pr-28 bg-transparent text-sm sm:text-base font-medium focus:outline-none placeholder:text-foreground/30"
            />
            <div className="absolute right-2 flex items-center gap-1">
              <button type="button" className="w-10 h-10 rounded-xl flex items-center justify-center text-foreground/40 hover:text-saffron hover:bg-saffron/5 transition-colors" aria-label="Voice search">
                <Mic className="w-5 h-5" />
              </button>
              <button type="button" className="w-10 h-10 rounded-xl flex items-center justify-center text-foreground/40 hover:text-saffron hover:bg-saffron/5 transition-colors" aria-label="Scan QR">
                <QrCode className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.form>

        {/* Quick stats */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex items-center gap-3 sm:gap-5 mt-5"
        >
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-terai/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-terai" />
            </div>
            <div>
              <p className="text-[10px] text-foreground/40 font-medium leading-none mb-0.5">Avg Delivery</p>
              <p className="text-sm font-bold text-foreground">22 min</p>
            </div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-saffron/10 flex items-center justify-center">
              <Star className="w-4 h-4 text-saffron fill-saffron" />
            </div>
            <div>
              <p className="text-[10px] text-foreground/40 font-medium leading-none mb-0.5">Rating</p>
              <p className="text-sm font-bold text-foreground">4.8 / 5</p>
            </div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] text-foreground/40 font-medium leading-none mb-0.5">Now in</p>
              <p className="text-sm font-bold text-foreground">Dhangadhi</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}