import React from "react";
import { motion } from "framer-motion";
import { Apple, QrCode, ShoppingBag, Bike, Search, MapPin, Star } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";

function StoreButtons() {
  return (
    <div className="flex flex-wrap gap-3">
      <a href="#" className="inline-flex items-center gap-3 bg-carbon text-white rounded-xl px-5 py-3 hover:bg-carbon/85 transition-colors">
        <Apple className="w-6 h-6" />
        <div className="flex flex-col leading-none">
          <span className="text-[10px] opacity-70">Download on the</span>
          <span className="text-sm font-bold">App Store</span>
        </div>
      </a>
      <a href="#" className="inline-flex items-center gap-3 bg-carbon text-white rounded-xl px-5 py-3 hover:bg-carbon/85 transition-colors">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zM14.892 13.108l2.792 2.792-10.583 6.078 7.791-8.87zm5.406-2.493c.5.287.5 1.003 0 1.29l-2.792 1.608-2.792-2.792 2.792-2.792 2.792 1.686zM14.892 10.892l-7.791-8.87 10.583 6.078-2.792 2.792z"/></svg>
        <div className="flex flex-col leading-none">
          <span className="text-[10px] opacity-70">GET IT ON</span>
          <span className="text-sm font-bold">Google Play</span>
        </div>
      </a>
    </div>
  );
}

function CustomerPhone() {
  return (
    <div className="relative w-[200px] h-[400px] rounded-[2.5rem] bg-carbon p-3 shadow-2xl">
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-carbon rounded-b-2xl z-10" />
      <div className="w-full h-full rounded-[2rem] bg-saffron/5 overflow-hidden flex flex-col">
        <div className="bg-saffron px-4 pt-8 pb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-display font-extrabold text-sm">D<span className="opacity-70">Dash</span></span>
            <div className="w-7 h-7 rounded-full bg-white/20" />
          </div>
          <div className="bg-white/20 rounded-lg h-8 flex items-center px-3">
            <Search className="w-3.5 h-3.5 text-white/80" />
            <span className="text-white/70 text-[10px] ml-2">Search restaurants...</span>
          </div>
        </div>
        <div className="flex-1 p-3 space-y-2">
          <div className="grid grid-cols-4 gap-1.5">
            {["🍔", "🛒", "💊", "🏪"].map((e) => <div key={e} className="aspect-square bg-white rounded-lg flex items-center justify-center text-sm shadow-sm">{e}</div>)}
          </div>
          <div className="bg-white rounded-xl p-2 shadow-sm flex gap-2">
            <div className="w-14 h-14 rounded-lg bg-saffron/15" />
            <div className="flex-1 space-y-1">
              <div className="h-2 w-3/4 bg-carbon/15 rounded" />
              <div className="h-2 w-1/2 bg-carbon/10 rounded" />
              <div className="flex items-center gap-1"><Star className="w-2.5 h-2.5 text-saffron fill-saffron" /><span className="text-[8px] text-foreground/50">4.8 · 20 min</span></div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-2 shadow-sm flex gap-2">
            <div className="w-14 h-14 rounded-lg bg-terai/15" />
            <div className="flex-1 space-y-1">
              <div className="h-2 w-3/4 bg-carbon/15 rounded" />
              <div className="h-2 w-1/2 bg-carbon/10 rounded" />
              <div className="flex items-center gap-1"><Star className="w-2.5 h-2.5 text-saffron fill-saffron" /><span className="text-[8px] text-foreground/50">4.7 · 25 min</span></div>
            </div>
          </div>
        </div>
        <div className="p-3">
          <div className="bg-saffron rounded-xl h-9 flex items-center justify-center text-white text-[10px] font-bold">Order Now</div>
        </div>
      </div>
    </div>
  );
}

function RiderPhone() {
  return (
    <div className="relative w-[200px] h-[400px] rounded-[2.5rem] bg-carbon p-3 shadow-2xl">
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-carbon rounded-b-2xl z-10" />
      <div className="w-full h-full rounded-[2rem] bg-carbon overflow-hidden flex flex-col text-white">
        <div className="px-4 pt-8 pb-4 flex items-center justify-between">
          <div>
            <div className="text-[9px] text-white/50">Rider Mode</div>
            <div className="font-display font-bold text-sm">Dashboard</div>
          </div>
          <Bike className="w-5 h-5 text-saffron" />
        </div>
        <div className="mx-3 bg-white/5 rounded-xl p-3 mb-3">
          <div className="text-[9px] text-white/50 mb-1">Today's Earnings</div>
          <div className="font-display font-extrabold text-xl text-saffron">Rs 2,450</div>
          <div className="text-[9px] text-white/40 mt-1">12 deliveries completed</div>
        </div>
        <div className="mx-3 flex-1 bg-white/5 rounded-xl p-3 relative overflow-hidden">
          <div className="bg-grid-pattern absolute inset-0 opacity-30" />
          <div className="relative">
            <div className="text-[9px] text-white/50 mb-2">Active Delivery</div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-3 h-3 text-saffron" />
              <div className="text-[10px]">Attariya Road, Dhangadhi</div>
            </div>
            <div className="h-16 rounded-lg bg-saffron/10 flex items-center justify-center">
              <div className="relative">
                <div className="w-3 h-3 rounded-full bg-saffron" />
                <div className="absolute inset-0 w-3 h-3 rounded-full bg-saffron animate-pulse-ring" />
              </div>
            </div>
            <div className="mt-2 text-[9px] text-white/50">ETA: 8 minutes</div>
          </div>
        </div>
        <div className="p-3">
          <div className="bg-saffron rounded-xl h-9 flex items-center justify-center text-white text-[10px] font-bold">Navigate</div>
        </div>
      </div>
    </div>
  );
}

export default function AppDownload() {
  return (
    <section id="app" className="py-20 lg:py-28 px-4 sm:px-6 bg-gradient-to-b from-saffron/[0.02] to-white">
      <div className="mx-auto max-w-7xl">
        <SectionHeading eyebrow="Download App" title="DDash In Your Pocket" subtitle="Get the Dhangadhi Dash app — whether you're ordering or delivering, we've got you covered." />

        <div className="grid lg:grid-cols-2 gap-8 mt-14">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="flex flex-col sm:flex-row items-center gap-8 bg-white rounded-3xl p-8 border border-carbon/5 shadow-lg shadow-carbon/5">
            <CustomerPhone />
            <div className="flex-1 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-saffron/10 flex items-center justify-center mb-4 mx-auto sm:mx-0"><ShoppingBag className="w-6 h-6 text-saffron" /></div>
              <h3 className="font-display font-extrabold text-xl text-foreground mb-2">Customer App</h3>
              <p className="text-sm text-foreground/55 mb-5">Order food, groceries, pharmacy, and more. Track deliveries in real-time and pay your way.</p>
              <StoreButtons />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }} className="flex flex-col sm:flex-row items-center gap-8 bg-white rounded-3xl p-8 border border-carbon/5 shadow-lg shadow-carbon/5">
            <RiderPhone />
            <div className="flex-1 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-terai/10 flex items-center justify-center mb-4 mx-auto sm:mx-0"><Bike className="w-6 h-6 text-terai" /></div>
              <h3 className="font-display font-extrabold text-xl text-foreground mb-2">Rider App</h3>
              <p className="text-sm text-foreground/55 mb-5">Accept deliveries, navigate the city, and track your earnings — all in one powerful app.</p>
              <StoreButtons />
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 bg-carbon rounded-3xl p-8 text-white">
          <div className="bg-white p-3 rounded-2xl">
            <QrCode className="w-24 h-24 text-foreground" />
          </div>
          <div className="text-center sm:text-left">
            <h3 className="font-display font-bold text-lg mb-1">Scan to Download</h3>
            <p className="text-sm text-white/50 max-w-xs">Point your phone camera at the QR code to download the Dhangadhi Dash app instantly.</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}