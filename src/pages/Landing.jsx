import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag, Store, Bike, Cake, Phone, ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";
import GoogleIcon from "@/components/GoogleIcon";
import { base44 } from "@/api/base44Client";

const floatingIcons = [
  { Icon: ShoppingBag, pos: "top-24 left-[8%]", delay: 0, color: "text-saffron", bg: "bg-saffron/20" },
  { Icon: Store, pos: "top-32 right-[10%]", delay: 0.5, color: "text-terai", bg: "bg-terai/20" },
  { Icon: Bike, pos: "bottom-32 left-[12%]", delay: 1, color: "text-saffron", bg: "bg-saffron/20" },
  { Icon: Cake, pos: "bottom-24 right-[8%]", delay: 1.5, color: "text-terai", bg: "bg-terai/20" },
];

export default function Landing() {
  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", "/");
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-carbon">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1920&q=80"
          alt=""
          className="w-full h-full object-cover opacity-15"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-carbon/90 via-carbon/80 to-carbon" />
      </div>
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />

      {floatingIcons.map(({ Icon, pos, delay, color, bg }, i) => (
        <motion.div
          key={i}
          className={`absolute hidden lg:flex ${pos}`}
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 4, repeat: Infinity, delay }}
        >
          <div className={`w-16 h-16 rounded-2xl ${bg} backdrop-blur-md flex items-center justify-center`}>
            <Icon className={`w-8 h-8 ${color}`} />
          </div>
        </motion.div>
      ))}

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="bg-white rounded-2xl px-6 py-4 inline-block mb-8 shadow-2xl"
          >
            <Logo />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-display font-extrabold text-4xl sm:text-6xl text-white tracking-tight mb-4 leading-[1.1]"
          >
            Fast Delivery.
            <br />
            <span className="text-saffron">Local Love.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-white/60 text-lg mb-10 max-w-md mx-auto"
          >
            Dhangadhi's premier quick-commerce platform. Restaurants, groceries, bakeries, and local shops — delivered in minutes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col gap-3 max-w-sm mx-auto"
          >
            <Link
              to="/login"
              className="h-12 px-8 rounded-2xl bg-saffron text-white font-bold text-base hover:bg-saffron/90 transition-all shadow-lg shadow-saffron/25 flex items-center justify-center gap-2"
            >
              Login <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/register"
              className="h-12 px-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold text-base hover:bg-white/20 transition-all flex items-center justify-center gap-2"
            >
              Create Account
            </Link>
            <div className="relative my-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-carbon px-3 text-white/30">or continue with</span>
              </div>
            </div>
            <button
              onClick={handleGoogle}
              className="h-12 px-8 rounded-2xl bg-white text-foreground font-bold text-base hover:bg-white/90 transition-all flex items-center justify-center gap-2"
            >
              <GoogleIcon className="w-5 h-5" /> Continue with Google
            </button>
            <Link
              to="/register"
              className="h-12 px-8 rounded-2xl bg-transparent border border-white/15 text-white/70 font-semibold text-sm hover:bg-white/5 transition-all flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" /> Continue with Phone Number
            </Link>
            <Link
              to="/forgot-password"
              className="text-white/40 text-sm font-medium hover:text-saffron transition-colors mt-2"
            >
              Forgot Password?
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-6 mt-12 text-white/30 text-xs font-medium"
        >
          <span className="flex items-center gap-1.5"><Bike className="w-4 h-4" /> 15-min delivery</span>
          <span className="flex items-center gap-1.5"><Store className="w-4 h-4" /> 30+ local stores</span>
          <span className="flex items-center gap-1.5"><ShoppingBag className="w-4 h-4" /> 500+ products</span>
          <span className="flex items-center gap-1.5"><Cake className="w-4 h-4" /> Bakery & cakes</span>
        </motion.div>
      </div>
    </div>
  );
}