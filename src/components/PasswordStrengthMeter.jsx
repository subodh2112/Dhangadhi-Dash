import React from "react";

export default function PasswordStrengthMeter({ password }) {
  if (!password) return null;

  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;
  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"];
  const colors = ["bg-red-500", "bg-red-500", "bg-amber-500", "bg-blue-500", "bg-terai"];

  return (
    <div className="pt-1.5 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < score ? colors[score] : "bg-muted"}`} />
        ))}
      </div>
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-foreground/50 font-medium">{labels[score]}</span>
        <div className="flex gap-2">
          <span className={checks.length ? "text-terai" : "text-foreground/30"}>8+</span>
          <span className={checks.upper ? "text-terai" : "text-foreground/30"}>A-Z</span>
          <span className={checks.number ? "text-terai" : "text-foreground/30"}>0-9</span>
          <span className={checks.special ? "text-terai" : "text-foreground/30"}>!@#</span>
        </div>
      </div>
    </div>
  );
}