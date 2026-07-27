import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import { MapPin, CheckCircle2, Clock, Navigation } from "lucide-react";

const areas = [
  "Dhangadhi-1", "Dhangadhi-2", "Dhangadhi-3", "Dhangadhi-4", "Dhangadhi-5",
  "Dhangadhi-6", "Dhangadhi-7", "Dhangadhi-8", "Dhangadhi-9", "Dhangadhi-10",
  "Dhangadhi-11", "Dhangadhi-12", "Dhangadhi-13", "Dhangadhi-14", "Dhangadhi-15",
  "Campus Road", "Hasantpur", "Pratap Chowk", "K.I. Singh Nagar",
  "Railway Station Area", "Airport Area", "Bhajani Road", "Chauraha",
  "Satbariya", "Utterbehadi", "Phulbari", "Nawalpur", "Shreeram Tole",
];

export default function DeliveryZones() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PageHero title="Delivery Areas" subtitle="We deliver across Dhangadhi. Check if your area is covered." icon={MapPin} gradient="from-blue-600 to-indigo-700" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-card border border-border rounded-2xl p-5 text-center">
            <Navigation className="w-8 h-8 text-saffron mx-auto mb-2" />
            <p className="text-2xl font-extrabold text-foreground">28+</p>
            <p className="text-xs text-foreground/50">Areas Covered</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 text-center">
            <Clock className="w-8 h-8 text-terai mx-auto mb-2" />
            <p className="text-2xl font-extrabold text-foreground">15-30</p>
            <p className="text-xs text-foreground/50">Min Delivery Time</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 text-center">
            <CheckCircle2 className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-extrabold text-foreground">5 km</p>
            <p className="text-xs text-foreground/50">Max Delivery Radius</p>
          </div>
        </div>

        <h2 className="font-display font-bold text-lg text-foreground mb-4">Covered Neighborhoods</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-10">
          {areas.map((area) => (
            <div key={area} className="flex items-center gap-1.5 p-2.5 rounded-lg bg-card border border-border text-xs text-foreground/70">
              <CheckCircle2 className="w-3.5 h-3.5 text-terai flex-shrink-0" /> {area}
            </div>
          ))}
        </div>

        <div className="bg-saffron/5 border border-saffron/15 rounded-2xl p-6 mb-6">
          <h2 className="font-bold text-foreground mb-2">Not in Your Area Yet?</h2>
          <p className="text-sm text-foreground/60 mb-3">We're expanding across Dhangadhi and nearby areas. If you don't see your neighborhood, let us know — we prioritize expansion based on demand.</p>
          <a href="/feedback" className="inline-flex items-center text-sm font-medium text-saffron hover:underline">Request Your Area →</a>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-bold text-foreground mb-3">Delivery Zones</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Core City Zone</p>
                <p className="text-xs text-foreground/50">Dhangadhi-1 to Dhangadhi-15</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-md bg-terai/10 text-terai font-medium">15-25 min</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Extended City Zone</p>
                <p className="text-xs text-foreground/50">Campus Road, Hasantpur, Pratap Chowk, etc.</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-md bg-amber-100 text-amber-700 font-medium">25-35 min</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground">Outskirts Zone</p>
                <p className="text-xs text-foreground/50">Satbariya, Utterbehadi, Nawalpur, etc.</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-md bg-blue-100 text-blue-700 font-medium">30-45 min</span>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}