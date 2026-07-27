import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useCart } from "@/context/CartContext";
import { Mic, Loader2, CheckCircle, X } from "lucide-react";
import { processVoiceOrder } from "@/lib/aiEngine";

export default function VoiceOrderButton({ products = [] }) {
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const recognitionRef = useRef(null);
  const { addItem } = useCart();

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError("Voice ordering not supported in your browser"); return; }
    setError(""); setResult(null); setTranscript("");
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = async (e) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      setLoading(true);
      try {
        const res = await processVoiceOrder(text, products);
        setResult(res);
        if (res.matched_products?.length > 0) {
          res.matched_products.forEach(mp => {
            const product = products.find(p => p.id === mp.product_id);
            if (product) addItem(product, mp.quantity || 1);
          });
        }
      } catch { setError("Failed to process your order. Please try again."); }
      setLoading(false);
    };
    recognition.onerror = () => { setError("Could not hear you clearly. Please try again."); setListening(false); };
    recognition.start();
    recognitionRef.current = recognition;
  };

  const stop = () => { recognitionRef.current?.stop(); setListening(false); };

  return (
    <div className="bg-gradient-to-br from-saffron/10 to-terai/5 rounded-2xl border border-saffron/20 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Mic className="w-5 h-5 text-saffron" />
        <h3 className="font-display font-bold text-sm text-foreground">Voice Ordering</h3>
      </div>

      <div className="flex flex-col items-center gap-3">
        <button onClick={listening ? stop : startListening} disabled={loading} className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${listening ? "bg-red-500 text-white animate-pulse scale-110" : "bg-saffron text-white hover:scale-105"} ${loading ? "opacity-50" : ""}`}>
          {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Mic className="w-8 h-8" />}
        </button>
        <p className="text-xs text-foreground/50 text-center">
          {listening ? "Listening... Tap to stop" : loading ? "Processing..." : "Tap and say what you want to order"}
        </p>
      </div>

      {transcript && (
        <div className="mt-3 p-2 rounded-xl bg-card border border-border">
          <p className="text-[10px] text-foreground/40 mb-1">You said:</p>
          <p className="text-sm text-foreground italic">"{transcript}"</p>
        </div>
      )}

      {result && (
        <div className="mt-3 p-3 rounded-xl bg-terai/5 border border-terai/20">
          <div className="flex items-center gap-1.5 mb-2"><CheckCircle className="w-4 h-4 text-terai" /><p className="text-xs font-bold text-terai">Added to cart!</p></div>
          <p className="text-xs text-foreground/70">{result.confirmation_message}</p>
          {result.matched_products?.map((mp, i) => (
            <div key={i} className="flex items-center justify-between mt-2 text-xs">
              <span className="text-foreground/60">{mp.name}</span>
              <span className="font-bold text-saffron">×{mp.quantity || 1}</span>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-3 p-2 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center gap-2">
          <X className="w-4 h-4 text-red-500" /><p className="text-xs text-red-500">{error}</p>
        </div>
      )}

      <p className="text-[10px] text-foreground/30 mt-3 text-center">Example: "Order chicken momo and a coke"</p>
    </div>
  );
}