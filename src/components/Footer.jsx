import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, MapPin } from "lucide-react";
import Logo from "@/components/Logo";

const footerLinks = {
  Company: [
    { label: "Home", to: "/" },
    { label: "About", href: "/#about" },
    { label: "Contact", href: "/#contact" },
    { label: "Reviews", to: "/reviews" },
  ],
  Services: [
    { label: "Store Catalog", to: "/stores" },
    { label: "Order Status", to: "/order-status" },
    { label: "Delivery Areas", to: "/delivery-zones" },
    { label: "Loyalty Rewards", to: "/loyalty-rewards" },
  ],
  Support: [
    { label: "Help Center", to: "/help" },
    { label: "FAQ", to: "/faq" },
    { label: "Safety Guidelines", to: "/safety-guidelines" },
    { label: "Feedback", to: "/feedback" },
  ],
  Business: [
    { label: "Become a Partner", to: "/become-a-partner" },
    { label: "Join as Rider", to: "/join-as-rider" },
    { label: "Privacy Policy", to: "/privacy-policy" },
    { label: "Terms of Service", to: "/terms-of-service" },
  ],
};

const socials = [
  { icon: Instagram, href: "https://www.instagram.com/dhangadhidash/?hl=en", label: "Instagram" },
  { icon: Facebook, href: "https://www.facebook.com/profile.php?id=61591693206863", label: "Facebook" },
];

export default function Footer() {
  return (
    <footer className="bg-carbon text-white pt-16 pb-28 lg:pb-12 px-4 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-12">
          <div className="col-span-2">
            <div className="bg-white rounded-2xl px-4 py-3 inline-block mb-4"><Logo compact={false} /></div>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs mb-5">Fast Delivery. Local Love. Dhangadhi's premier quick-commerce delivery platform connecting you to local stores, restaurants, and riders.</p>
            <div className="flex gap-3">
              {socials.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="w-10 h-10 rounded-full bg-white/10 hover:bg-saffron flex items-center justify-center transition-colors">
                  <s.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-display font-bold text-xs uppercase tracking-widest text-white/40 mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.to ? (
                      <Link to={link.to} className="text-white/65 hover:text-saffron text-sm transition-colors">{link.label}</Link>
                    ) : (
                      <a href={link.href} className="text-white/65 hover:text-saffron text-sm transition-colors">{link.label}</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/35 text-xs">© 2026 Dhangadhi Dash. All rights reserved.</p>
          <div className="flex items-center gap-1.5 text-xs text-white/35">
            <MapPin className="w-3 h-3" /> Dhangadhi, Kailali, Nepal
          </div>
        </div>
      </div>
    </footer>
  );
}