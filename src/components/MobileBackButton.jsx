import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function MobileBackButton({ floating = false }) {
  const navigate = useNavigate();

  if (floating) {
    return (
      <button
        onClick={() => navigate(-1)}
        className="lg:hidden w-10 h-10 rounded-full bg-background/90 backdrop-blur-xl shadow-lg flex items-center justify-center"
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5 text-foreground" />
      </button>
    );
  }

  return (
    <button
      onClick={() => navigate(-1)}
      className="lg:hidden flex items-center gap-1.5 text-sm font-bold text-foreground/60 hover:text-saffron mb-4"
    >
      <ArrowLeft className="w-4 h-4" /> Back
    </button>
  );
}