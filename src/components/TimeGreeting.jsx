import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";

const GREETINGS = [
  { key: "morning", start: 5, end: 12, text: "Good Morning", emoji: "☀️", message: "Ready to order your favorite breakfast or start your day?", gradient: "from-amber-400 via-orange-400 to-yellow-400", icon: "🌅" },
  { key: "afternoon", start: 12, end: 17, text: "Good Afternoon", emoji: "👋", message: "What's for lunch? Explore restaurants and grocery deals.", gradient: "from-saffron via-orange-500 to-amber-500", icon: "🌞" },
  { key: "evening", start: 17, end: 20, text: "Good Evening", emoji: "🌇", message: "Dinner is just a few clicks away.", gradient: "from-orange-500 via-rose-500 to-purple-500", icon: "🌇" },
  { key: "night", start: 20, end: 29, text: "Good Night", emoji: "🌙", message: "Late-night cravings? We've got you covered.", gradient: "from-indigo-600 via-purple-700 to-slate-800", icon: "🌙" },
];

function getGreetingData(hour) {
  // night spans 8PM–4:59AM, i.e. hour >= 20 OR hour < 5
  if (hour >= 20 || hour < 5) return GREETINGS[3];
  if (hour >= 17) return GREETINGS[2];
  if (hour >= 12) return GREETINGS[1];
  return GREETINGS[0];
}

// ms until the next greeting period boundary
function msUntilNextBoundary(now) {
  const hour = now.getHours();
  const boundaries = [5, 12, 17, 20, 24]; // 24 wraps to 0→5 next day
  for (const b of boundaries) {
    if (hour < b) {
      const next = new Date(now);
      next.setHours(b, 0, 0, 0);
      return next - now;
    }
  }
  // past 20:00 → next boundary is 5:00 next day
  const next = new Date(now);
  next.setDate(next.getDate() + 1);
  next.setHours(5, 0, 0, 0);
  return next - now;
}

export default function TimeGreeting({ subtitle = "Welcome back to Dhangadhi Dash. Let's make today productive.", showWeather = false }) {
  const { user } = useAuth();
  const [hour, setHour] = useState(new Date().getHours());

  useEffect(() => {
    const timer = setTimeout(() => {
      setHour(new Date().getHours());
    }, msUntilNextBoundary(new Date()) + 1000);
    return () => clearTimeout(timer);
  }, [hour]);

  const data = getGreetingData(hour);
  const firstName = user?.full_name?.split(" ")[0] || user?.email?.split("@")[0];
  const greetingName = firstName ? `, ${firstName}` : "";
  const greetingLine = `${data.text}${greetingName} ${data.emoji}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${data.gradient} p-5 sm:p-6 mb-6 shadow-lg`}
    >
      <div className="absolute -top-6 -right-4 text-6xl sm:text-7xl opacity-20 select-none pointer-events-none">
        {data.icon}
      </div>
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={data.key}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-lg sm:text-xl font-display font-bold text-white">
              {greetingLine}
            </h2>
            <p className="text-white/85 text-sm mt-1 max-w-md">{data.message}</p>
            {showWeather && (
              <p className="text-white/70 text-xs mt-1.5">22°C • Dhangadhi</p>
            )}
          </motion.div>
        </AnimatePresence>
        {subtitle && (
          <p className="text-white/70 text-xs sm:text-sm mt-2.5">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
}