import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Truck, CreditCard, PhoneCall, Clock, Calculator, RefreshCw } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";

const faqs = [
  {
    icon: Truck,
    question: "Which areas in Dhangadhi do you deliver to?",
    answer: "We currently deliver across all major neighborhoods in Dhangadhi including Tribhuwan Chowk, Campus Road, Attariya Road, Shantinagar, Hasantpur, Belapur, Ganesh Nagar, and Kailali Road. We're expanding our coverage regularly — if you're unsure whether your location is covered, check our Service Areas map above or contact our support team."
  },
  {
    icon: CreditCard,
    question: "What payment methods are accepted?",
    answer: "We accept cash on delivery (COD), eSewa, Khalti, IME Pay, and all major bank cards (Visa, Mastercard). You can choose your preferred payment method at checkout. For COD, please have the exact amount ready for a smooth delivery experience."
  },
  {
    icon: PhoneCall,
    question: "How can I reach customer support in Dhangadhi?",
    answer: "Our support team is available every day from 7:00 AM to 11:00 PM. Call us at +977 91-520100, email support@dhangadhidash.com, or use the live chat in our app. You can also visit our office at Tribhuwan Chowk, Dhangadhi for in-person assistance during business hours."
  },
  {
    icon: Clock,
    question: "What are your delivery hours?",
    answer: "We operate from 7:00 AM to 11:00 PM, seven days a week. Orders placed outside these hours are processed the next morning. Individual store hours may vary — the app shows each store's current availability when you browse."
  },
  {
    icon: Calculator,
    question: "How are delivery fees calculated?",
    answer: "Delivery fees are based on the distance from the store to your address. The base fee is Rs 30 for the first kilometer, plus Rs 12 per additional kilometer. Use our Delivery Fee Calculator above to estimate your shipping cost instantly."
  },
  {
    icon: RefreshCw,
    question: "What if my order is late or incorrect?",
    answer: "If your order is delayed beyond the estimated time or arrives incorrect, contact our support team immediately. We offer full refunds or replacements for incorrect items, and partial refunds for significantly delayed orders. Your satisfaction is our top priority."
  },
];

function FaqItem({ faq, index }) {
  const [open, setOpen] = useState(false);
  const Icon = faq.icon;
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 py-5 text-left group"
      >
        <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${open ? "bg-saffron text-white" : "bg-saffron/10 text-saffron group-hover:bg-saffron/20"}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="flex-1 font-heading font-semibold text-base sm:text-lg text-foreground">
          {faq.question}
        </span>
        <ChevronDown className={`w-5 h-5 text-foreground/40 flex-shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-5 pl-15 ml-[60px] text-sm sm:text-base text-foreground/60 leading-relaxed">
              {faq.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  return (
    <section id="faq" className="py-20 lg:py-28 px-4 sm:px-6 bg-white">
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          eyebrow="Help Center"
          title="Frequently Asked Questions"
          subtitle="Everything you need to know about delivery zones, payments, and getting support in Dhangadhi."
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-14 bg-card rounded-3xl shadow-sm shadow-carbon/5 p-2 sm:p-6"
        >
          {faqs.map((faq, i) => (
            <FaqItem key={i} faq={faq} index={i} />
          ))}
        </motion.div>
        <p className="text-center text-sm text-foreground/50 mt-8">
          Still have questions? <a href="#contact" className="text-saffron font-semibold hover:underline">Reach out to our team</a> — we're happy to help.
        </p>
      </div>
    </section>
  );
}