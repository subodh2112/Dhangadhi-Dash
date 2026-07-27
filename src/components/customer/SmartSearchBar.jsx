import React, { useState, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Sparkles, Loader2, Mic, X, Store, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { smartSearch } from "@/lib/aiEngine";

export default function SmartSearchBar({ products = [], stores = [] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const handleSearch = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 5) return;
    setLoading(true);
    setShowResults(true);
    try {
      const result = await smartSearch(searchQuery, products, stores);
      setResults(result);
    } catch { setResults({ products: [], stores: [], interpretation: "Search failed. Try again." }); }
    setLoading(false);
  }, [products, stores]);

  const startVoiceSearch = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Voice search not supported in your browser"); return; }
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setQuery(transcript);
      handleSearch(transcript);
    };
    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopVoice = () => { recognitionRef.current?.stop(); setListening(false); };

  const matchedProducts = results?.products?.map(id => products.find(p => p.id === id)).filter(Boolean) || [];
  const matchedStores = results?.stores?.map(id => stores.find(s => s.id === id)).filter(Boolean) || [];

  return (
    <div className="relative">
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-saffron" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch(query)}
            placeholder="Try: 'spicy momo under Rs 300' or 'healthy food near me'"
            className="w-full h-12 pl-10 pr-12 rounded-2xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40"
          />
          {query && <button onClick={() => { setQuery(""); setResults(null); setShowResults(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40"><X className="w-4 h-4" /></button>}
        </div>
        <button onClick={listening ? stopVoice : startVoiceSearch} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${listening ? "bg-red-500 text-white animate-pulse" : "bg-saffron text-white"}`}>
          <Mic className="w-5 h-5" />
        </button>
      </div>

      {showResults && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-card border border-border rounded-2xl shadow-xl z-50 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8"><Loader2 className="w-5 h-5 text-saffron animate-spin" /><span className="text-sm text-foreground/50">AI is searching...</span></div>
          ) : (
            <div className="p-4">
              {results?.interpretation && (
                <div className="flex items-start gap-2 mb-3 p-3 rounded-xl bg-saffron/5">
                  <Sparkles className="w-4 h-4 text-saffron flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground/70"><span className="font-bold text-saffron">AI: </span>{results.interpretation}</p>
                </div>
              )}
              {matchedStores.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-bold text-foreground/40 uppercase mb-2 flex items-center gap-1"><Store className="w-3 h-3" /> Stores</p>
                  <div className="space-y-2">
                    {matchedStores.slice(0, 5).map(s => (
                      <Link key={s.id} to={`/store/${s.id}`} onClick={() => setShowResults(false)} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted transition-colors">
                        <img src={s.image_url || s.logo_url || "https://images.unsplash.com/photo-1517248135467-4c7d9b8e1950?w=80&q=80"} alt={s.name} className="w-10 h-10 rounded-lg object-cover" />
                        <div><p className="text-sm font-bold text-foreground">{s.name}</p><p className="text-[10px] text-foreground/40 capitalize">{s.category} • {s.delivery_minutes || 30} min</p></div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {matchedProducts.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-foreground/40 uppercase mb-2 flex items-center gap-1"><Package className="w-3 h-3" /> Products</p>
                  <div className="space-y-2">
                    {matchedProducts.slice(0, 8).map(p => (
                      <Link key={p.id} to={`/store/${p.store_id}`} onClick={() => setShowResults(false)} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted transition-colors">
                        <img src={p.image_url || "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=80&q=80"} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                        <div className="flex-1"><p className="text-sm font-bold text-foreground">{p.name}</p><p className="text-[10px] text-foreground/40">{p.store_name}</p></div>
                        <p className="text-sm font-bold text-saffron">Rs {p.price}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {matchedProducts.length === 0 && matchedStores.length === 0 && (
                <p className="text-sm text-foreground/40 text-center py-4">No results found. Try a different query.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}