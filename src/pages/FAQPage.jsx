import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import { ChevronDown, HelpCircle, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const staticFaqs = [
  { category: "General", question: "What is Dhangadhi Dash?", answer: "Dhangadhi Dash is a hyper-local delivery platform connecting you to restaurants, grocery stores, pharmacies, and local shops across Dhangadhi with fast, reliable delivery." },
  { category: "General", question: "What areas do you cover?", answer: "We deliver across all 15 wards of Dhangadhi and nearby neighborhoods including Campus Road, Hasantpur, Pratap Chowk, and more. Check our Delivery Areas page for the full list." },
  { category: "Orders", question: "How long does delivery take?", answer: "Delivery typically takes 15-30 minutes for core city areas and 30-45 minutes for outskirts, depending on your location and the store's preparation time." },
  { category: "Orders", question: "How do I track my order?", answer: "Once your order is placed, you can track it in real-time from the Order Status page or the Track Order feature in the app. You'll see live status updates from preparation to delivery." },
  { category: "Orders", question: "Can I cancel my order?", answer: "Orders can be cancelled before the store starts preparing your food. Once preparation begins, cancellation may not be possible. Go to your Order History to cancel." },
  { category: "Orders", question: "Is there a minimum order value?", answer: "Some stores may have a minimum order value. This is displayed on the store page before you place your order." },
  { category: "Payments", question: "What payment methods do you accept?", answer: "We accept Cash on Delivery (COD), eSewa, Khalti, FonePay, and card payments. You can choose your preferred method at checkout." },
  { category: "Payments", question: "How do refunds work?", answer: "Refund requests must be submitted within 24 hours of delivery. Approved refunds are processed to the original payment method within 5-7 business days." },
  { category: "Delivery", question: "What are your delivery hours?", answer: "Most stores operate from 8 AM to 10 PM. Delivery hours may vary by store and location. You can see each store's hours on their store page." },
  { category: "Delivery", question: "Do you charge a delivery fee?", answer: "Delivery fees vary by store and distance. Many stores offer free delivery on orders above a certain amount. The delivery fee is shown at checkout before you confirm your order." },
  { category: "Account", question: "How do I reset my password?", answer: "Click 'Forgot Password' on the login page and enter your email. You'll receive a reset link to set a new password." },
  { category: "Account", question: "How do loyalty points work?", answer: "You earn points on every order. Points accumulate and determine your membership level (Bronze to Diamond). Higher levels unlock exclusive perks like free delivery and bonus points." },
];

export default function FAQPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    loadFaqs();
  }, []);

  async function loadFaqs() {
    try {
      const data = await base44.entities.FAQ.list("order", 100);
      if (data && data.length > 0) {
        setFaqs(data);
      } else {
        setFaqs(staticFaqs);
      }
    } catch {
      setFaqs(staticFaqs);
    } finally {
      setLoading(false);
    }
  }

  const categories = ["All", ...Array.from(new Set(faqs.map((f) => f.category).filter(Boolean)))];
  const filtered = activeCategory === "All" ? faqs : faqs.filter((f) => f.category === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PageHero title="Frequently Asked Questions" subtitle="Find answers to common questions about delivery, payments, and using Dhangadhi Dash." icon={HelpCircle} gradient="from-indigo-600 to-purple-700" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
          {categories.map((c) => (
            <button key={c} onClick={() => setActiveCategory(c)} className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${activeCategory === c ? "bg-saffron text-white" : "bg-card border border-border text-foreground/60 hover:border-saffron/30"}`}>
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>
        ) : (
          <div className="space-y-2">
            {filtered.map((faq, i) => {
              const isOpen = openIndex === i;
              return (
                <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
                  <button onClick={() => setOpenIndex(isOpen ? null : i)} className="w-full flex items-center justify-between p-4 text-left">
                    <span className="text-sm font-medium text-foreground pr-3">{faq.question}</span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-sm text-foreground/60 leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-saffron/5 border border-saffron/15 rounded-2xl p-6 mt-8 text-center">
          <h3 className="font-bold text-foreground mb-1">Still have questions?</h3>
          <p className="text-sm text-foreground/60 mb-3">Our support team is here to help you.</p>
          <a href="/help" className="inline-flex items-center text-sm font-medium text-saffron hover:underline">Contact Support →</a>
        </div>
      </div>
      <Footer />
    </div>
  );
}