import React, { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Calculator, Bike, Navigation } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";
import BottomSheetSelect from "@/components/BottomSheetSelect";

const neighborhoods = [
  { name: "Tribhuwan Chowk (City Center)", distance: 0 },
  { name: "Campus Road", distance: 1.5 },
  { name: "Ganesh Nagar", distance: 2 },
  { name: "Shantinagar", distance: 2.5 },
  { name: "Attariya Road", distance: 3 },
  { name: "Kailali Road", distance: 3.5 },
  { name: "Hasantpur", distance: 4 },
  { name: "Belapur", distance: 5.5 },
];

const BASE_FEE = 30;
const PER_KM_RATE = 12;

function calculateFee(distance) {
  if (distance <= 1) return BASE_FEE;
  return BASE_FEE + Math.round((distance - 1) * PER_KM_RATE);
}

export default function DeliveryFeeCalculator() {
  const [selectedArea, setSelectedArea] = useState("");
  const [manualDistance, setManualDistance] = useState("");
  const [result, setResult] = useState(null);

  const handleCalculate = (e) => {
    e.preventDefault();
    let distance = null;
    if (manualDistance) {
      distance = parseFloat(manualDistance);
    } else if (selectedArea) {
      const area = neighborhoods.find((n) => n.name === selectedArea);
      distance = area?.distance;
    }
    if (distance === null || isNaN(distance)) return;
    setResult({ distance, fee: calculateFee(distance) });
  };

  return (
    <section id="fee-calculator" className="py-20 lg:py-28 px-4 sm:px-6 bg-white">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          eyebrow="Estimate Cost"
          title="Delivery Fee Calculator"
          subtitle="Select your neighborhood or enter your distance from the city center to instantly estimate your delivery cost."
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-12 grid md:grid-cols-2 gap-0 bg-card rounded-3xl shadow-lg shadow-carbon/5 overflow-hidden border border-border"
        >
          <div className="p-6 sm:p-8">
            <form onSubmit={handleCalculate} className="space-y-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                  <MapPin className="w-4 h-4 text-saffron" /> Select Your Neighborhood
                </label>
                <BottomSheetSelect
                  value={selectedArea}
                  onChange={(val) => { setSelectedArea(val); setManualDistance(""); setResult(null); }}
                  options={neighborhoods.map((n) => ({ value: n.name, label: `${n.name} (${n.distance} km)` }))}
                  placeholder="Choose your area..."
                  label="Select Your Neighborhood"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-foreground/30 font-semibold uppercase">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                  <Navigation className="w-4 h-4 text-saffron" /> Enter Distance Manually (km)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="20"
                  value={manualDistance}
                  onChange={(e) => { setManualDistance(e.target.value); setSelectedArea(""); setResult(null); }}
                  placeholder="e.g. 3.5"
                  className="w-full h-12 px-4 rounded-xl border border-border bg-white text-foreground font-medium placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-saffron/40 focus:border-saffron transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={!selectedArea && !manualDistance}
                className="w-full h-12 rounded-xl bg-saffron text-white font-bold hover:bg-saffron/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Calculator className="w-5 h-5" /> Calculate Fee
              </button>
            </form>
          </div>

          <div className="bg-carbon p-6 sm:p-8 flex flex-col justify-center">
            {result ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <p className="text-white/50 text-xs uppercase tracking-wider font-bold mb-2">Estimated Delivery Fee</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-white/60 text-2xl font-bold">Rs</span>
                  <span className="font-display font-extrabold text-6xl text-saffron">{result.fee}</span>
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/50">Distance from center</span>
                    <span className="text-white font-semibold">{result.distance} km</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/50">Base fee (first km)</span>
                    <span className="text-white font-semibold">Rs {BASE_FEE}</span>
                  </div>
                  {result.distance > 1 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/50">Distance fee</span>
                      <span className="text-white font-semibold">Rs {result.fee - BASE_FEE}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-white/10">
                    <span className="text-white/50 flex items-center gap-1"><Bike className="w-4 h-4" /> Est. delivery time</span>
                    <span className="text-terai font-bold">{Math.max(15, Math.round(15 + result.distance * 4))} min</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-8">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Bike className="w-8 h-8 text-saffron" />
                </div>
                <p className="text-white/40 text-sm font-medium">
                  Select your area or enter a distance to see your estimated delivery fee.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}