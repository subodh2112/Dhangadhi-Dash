import React from "react";

const businesses = [
  "Himalayan Kitchen", "Fresh Mart", "City Pharmacy", "Dhangadhi Sweets",
  "Quick Bites", "Daily Needs Store", "Mountain Bakery", "Kailali Foods",
  "Health Plus Pharmacy", "Local Bazaar",
];

export default function PartnerRibbon() {
  return (
    <div className="mt-16 py-6 border-y border-carbon/5 overflow-hidden">
      <p className="text-center text-xs uppercase tracking-widest font-bold text-foreground/30 mb-5">Trusted by local businesses across Dhangadhi</p>
      <div className="overflow-hidden relative">
        <div className="flex animate-marquee w-max">
          {[...businesses, ...businesses].map((name, i) => (
            <div key={i} className="flex items-center gap-6 px-6 flex-shrink-0">
              <span className="text-lg font-display font-bold text-foreground/25 hover:text-saffron transition-colors whitespace-nowrap cursor-default">{name}</span>
              <span className="text-saffron/30 text-xs">●</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}