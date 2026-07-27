import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ShoppingBag, MapPin, Award, Zap, Truck, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: ShoppingBag,
    title: "Welcome to Dhangadhi Dash! 🎉",
    description: "Your hyper-local delivery platform for Dhangadhi. Order food, groceries, pharmacy essentials, and more — delivered fast.",
    color: "from-saffron to-saffron/70",
  },
  {
    icon: ShoppingBag,
    title: "Browse Local Stores",
    description: "Explore restaurants, grocery stores, bakeries, and local shops. Filter by category, search for items, and discover top-rated partners near you.",
    color: "from-terai to-terai/70",
  },
  {
    icon: Truck,
    title: "Real-Time Order Tracking",
    description: "Watch your order live on the map! Get instant browser notifications when your order is accepted, being prepared, picked up, and on the way.",
    color: "from-saffron to-terai",
  },
  {
    icon: Award,
    title: "Earn Loyalty Points",
    description: "Every order earns you loyalty points! Climb through Bronze, Silver, Gold, Platinum, and Diamond tiers to unlock bigger rewards and discounts.",
    color: "from-amber-500 to-saffron",
  },
  {
    icon: Zap,
    title: "Express Checkout",
    description: "Save your address and payment method once, then reorder your daily essentials in a single tap with Express Checkout.",
    color: "from-terai to-saffron",
  },
  {
    icon: MapPin,
    title: "You're All Set! 🚀",
    description: "Start exploring now — your first order is just a few taps away. Enjoy fast delivery, local love!",
    color: "from-saffron to-saffron/70",
  },
];

export default function OnboardingWalkthrough() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const completed = localStorage.getItem("ddash_onboarding_completed");
    if (!completed) {
      // Small delay so the page loads first
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("ddash_onboarding_completed", "true");
    setVisible(false);
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  const handleSkip = () => {
    handleClose();
    navigate("/#top-partners");
  };

  const currentStep = steps[step];
  const Icon = currentStep.icon;
  const isLast = step === steps.length - 1;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-carbon/60 backdrop-blur-sm" onClick={handleClose} />

          <motion.div
            key={step}
            className="relative w-full max-w-md bg-background rounded-3xl border border-border overflow-hidden shadow-2xl"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Progress dots */}
            <div className="absolute top-4 left-4 right-4 flex justify-center gap-1.5 z-10">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={"h-1.5 rounded-full transition-all " + (i === step ? "w-6 bg-saffron" : i < step ? "w-1.5 bg-saffron/50" : "w-1.5 bg-border")}
                />
              ))}
            </div>

            {/* Skip button */}
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 z-20 text-foreground/40 hover:text-foreground text-sm font-medium"
            >
              Skip
            </button>

            {/* Icon header */}
            <div className={"bg-gradient-to-br " + currentStep.color + " p-10 pt-16 flex justify-center"}>
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 15, delay: 0.1 }}
                className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center"
              >
                <Icon className="w-10 h-10 text-white" />
              </motion.div>
            </div>

            {/* Content */}
            <div className="p-6 pt-5 text-center">
              <h2 className="font-display font-extrabold text-xl text-foreground mb-2">{currentStep.title}</h2>
              <p className="text-sm text-foreground/60 leading-relaxed">{currentStep.description}</p>
            </div>

            {/* Action button */}
            <div className="p-6 pt-2 flex gap-3">
              {step > 0 && (
                <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                  Back
                </Button>
              )}
              <Button onClick={handleNext} className="flex-1 bg-saffron hover:bg-saffron/90">
                {isLast ? (
                  <>
                    <Check className="w-4 h-4" /> Get Started
                  </>
                ) : (
                  <>
                    Next <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}