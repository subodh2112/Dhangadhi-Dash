import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Search, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp } from "lucide-react";
import { markFAQHelpful } from "@/lib/support";

export default function FAQSection({ search = "", userType = "customer" }) {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [feedbackGiven, setFeedbackGiven] = useState({});
  const [categoryFilter, setCategoryFilter] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await base44.entities.FAQ.list("order", 100);
      setFaqs(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-saffron animate-spin" /></div>;

  const filtered = faqs.filter(f => {
    if (f.user_type !== "all" && f.user_type !== userType) return false;
    if (categoryFilter && f.category !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return f.question?.toLowerCase().includes(q) || f.answer?.toLowerCase().includes(q);
    }
    return true;
  });

  const categories = [...new Set(faqs.filter(f => f.user_type === "all" || f.user_type === userType).map(f => f.category).filter(Boolean))];

  const handleFeedback = async (faqId, isHelpful) => {
    if (feedbackGiven[faqId]) return;
    setFeedbackGiven({ ...feedbackGiven, [faqId]: isHelpful ? "helpful" : "not_helpful" });
    await markFAQHelpful(faqId, isHelpful);
    setFaqs(prev => prev.map(f => f.id === faqId ? { ...f, [isHelpful ? "helpful_count" : "not_helpful_count"]: (f[isHelpful ? "helpful_count" : "not_helpful_count"] || 0) + 1 } : f));
  };

  if (filtered.length === 0) {
    return (
      <div className="text-center py-8">
        <Search className="w-10 h-10 text-foreground/20 mx-auto mb-2" />
        <p className="text-sm text-foreground/40">No FAQs found. Try a different search or create a support ticket.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          <button onClick={() => setCategoryFilter("")} className={"px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap " + (!categoryFilter ? "bg-saffron text-white" : "bg-muted text-foreground/50")}>All</button>
          {categories.map(c => (
            <button key={c} onClick={() => setCategoryFilter(c)} className={"px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap capitalize " + (categoryFilter === c ? "bg-saffron text-white" : "bg-muted text-foreground/50")}>{c?.replace(/_/g, " ")}</button>
          ))}
        </div>
      )}
      {filtered.map(faq => (
        <div key={faq.id} className="bg-card rounded-2xl border border-border overflow-hidden">
          <button onClick={() => setExpanded(expanded === faq.id ? null : faq.id)} className="w-full p-4 flex items-center justify-between text-left">
            <p className="font-bold text-sm text-foreground pr-2">{faq.question}</p>
            {expanded === faq.id ? <ChevronUp className="w-4 h-4 text-foreground/40 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-foreground/40 flex-shrink-0" />}
          </button>
          {expanded === faq.id && (
            <div className="px-4 pb-4">
              <p className="text-sm text-foreground/60 mb-3 whitespace-pre-wrap">{faq.answer}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-foreground/40 mr-1">Was this helpful?</span>
                <button onClick={() => handleFeedback(faq.id, true)} disabled={!!feedbackGiven[faq.id]} className={"flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold " + (feedbackGiven[faq.id] === "helpful" ? "bg-terai/10 text-terai" : "bg-muted text-foreground/50 hover:bg-terai/10 hover:text-terai")}>
                  <ThumbsUp className="w-3 h-3" /> {faq.helpful_count || 0}
                </button>
                <button onClick={() => handleFeedback(faq.id, false)} disabled={!!feedbackGiven[faq.id]} className={"flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold " + (feedbackGiven[faq.id] === "not_helpful" ? "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400" : "bg-muted text-foreground/50 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10")}>
                  <ThumbsDown className="w-3 h-3" /> {faq.not_helpful_count || 0}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}