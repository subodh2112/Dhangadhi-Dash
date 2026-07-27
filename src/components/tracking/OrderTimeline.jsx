import React from "react";
import { motion } from "framer-motion";
import { Package, CheckCircle, ChefHat, Bike, Navigation, Clock } from "lucide-react";

const steps = [
  { key: "pending", label: "Order Placed", icon: Package },
  { key: "accepted", label: "Accepted by Merchant", icon: CheckCircle },
  { key: "preparing", label: "Preparing", icon: ChefHat },
  { key: "ready_for_pickup", label: "Ready for Pickup", icon: Package },
  { key: "rider_assigned", label: "Rider Assigned", icon: Bike },
  { key: "picked_up", label: "Picked Up", icon: Package },
  { key: "on_the_way", label: "On the Way", icon: Navigation },
  { key: "delivered", label: "Delivered", icon: CheckCircle },
];

const statusOrder = ["pending", "accepted", "preparing", "ready_for_pickup", "rider_assigned", "picked_up", "on_the_way", "delivered"];

export default function OrderTimeline({ status, timestamps }) {
  const currentIdx = statusOrder.indexOf(status);
  const isCancelled = status === "cancelled" || status === "rejected";

  if (isCancelled) {
    return (
      <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center"><Clock className="w-5 h-5 text-white" /></div>
        <div><p className="font-bold text-red-900 dark:text-red-300">Order {status}</p><p className="text-sm text-red-600/70 dark:text-red-400/70">This order was {status}.</p></div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {steps.map((step, i) => {
        const Icon = step.icon;
        const isDone = i < currentIdx;
        const isCurrent = i === currentIdx;
        const isFuture = i > currentIdx;
        const ts = timestamps?.[step.key];
        return (
          <div key={step.key} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className={"w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 " + (isDone ? "bg-terai text-white" : isCurrent ? "bg-saffron text-white ring-4 ring-saffron/20" : "bg-muted text-foreground/30")}
              >
                <Icon className="w-4 h-4" />
              </motion.div>
              {i < steps.length - 1 && (
                <div className={"w-0.5 h-8 " + (isDone ? "bg-terai" : "bg-muted")} />
              )}
            </div>
            <div className="pt-1.5 pb-2">
              <p className={"text-sm font-bold " + (isFuture ? "text-foreground/30" : "text-foreground")}>{step.label}</p>
              {ts && <p className="text-xs text-foreground/40">{ts}</p>}
              {isCurrent && <p className="text-xs text-saffron font-medium mt-0.5">In progress...</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}