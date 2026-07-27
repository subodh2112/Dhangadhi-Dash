import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, LogOut, ShoppingCart, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import { useCart } from "@/context/CartContext";
import RoleSwitcher from "@/components/RoleSwitcher";

const getNavLinks = (role) => {
  const r = role === "user" ? "customer" : role || "customer";
  if (r === "admin") return [
    { label: "My Dashboard", to: "/staff" },
    { label: "Admin Panel", to: "/admin" },
    { label: "Home", to: "/" },
    { label: "Orders", to: "/orders" },
    { label: "Track", to: "/track" },
  ];
  if (r === "merchant") return [
    { label: "Dashboard", to: "/merchant" },
    { label: "Home", to: "/" },
    { label: "Orders", to: "/orders" },
  ];
  if (r === "rider") return [
    { label: "Dashboard", to: "/rider" },
    { label: "Home", to: "/" },
  ];
  return [
    { label: "Home", to: "/" },
    { label: "Categories", href: "/#categories" },
    { label: "Stores", href: "/#top-partners" },
    { label: "Profile", to: "/profile" },
    { label: "Track Order", to: "/track" },
    { label: "Orders", to: "/orders" },
    { label: "Help", to: "/help" },
    { label: "Partners", href: "/#partners" },
    { label: "FAQ", href: "/#faq" },
    { label: "Contact", href: "/#contact" },
  ];
};

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navLinks = getNavLinks(user?.role);
  const role = user?.role === "user" ? "customer" : user?.role || "customer";

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 px-3 sm:px-6 pt-3 sm:pt-4">
        <div className={`mx-auto max-w-7xl flex items-center justify-between rounded-2xl px-4 sm:px-6 py-2.5 transition-all duration-300 safe-area-pt ${scrolled ? "bg-background/80 backdrop-blur-xl shadow-lg shadow-black/5 border border-border" : "bg-background/40 backdrop-blur-md border border-border"}`}>
          <Link to="/" aria-label="Dhangadhi Dash home"><Logo /></Link>
          <nav className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => link.to ? (
              <Link key={link.to} to={link.to} className="px-3 py-2 text-sm font-medium text-foreground/70 hover:text-saffron transition-colors">{link.label}</Link>
            ) : (
              <a key={link.href} href={link.href} className="px-3 py-2 text-sm font-medium text-foreground/70 hover:text-saffron transition-colors">{link.label}</a>
            ))}
          </nav>
          <div className="hidden lg:flex items-center gap-3">
            {role === 'customer' && (
              <Link to="/cart" className="relative p-2 text-foreground/70 hover:text-saffron transition-colors">
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-saffron text-white text-[10px] font-bold rounded-full flex items-center justify-center">{itemCount}</span>
                )}
              </Link>
            )}
            <RoleSwitcher />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
              <div className="w-7 h-7 rounded-full bg-saffron/10 flex items-center justify-center">
                <User className="w-4 h-4 text-saffron" />
              </div>
              <span className="text-sm font-semibold text-foreground max-w-[120px] truncate">{user?.full_name || user?.email || 'User'}</span>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-foreground/60 hover:text-red-500 transition-colors">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
          <button className="lg:hidden p-2 text-foreground" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[60] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-carbon/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-background p-6 flex flex-col" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}>
              <div className="flex items-center justify-between mb-8">
                <Link to="/" onClick={() => setOpen(false)}><Logo /></Link>
                <button onClick={() => setOpen(false)} className="p-2" aria-label="Close menu"><X className="w-6 h-6" /></button>
              </div>
              <nav className="flex flex-col gap-1">
                {navLinks.map((link, i) => {
                  const motionProps = { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, transition: { delay: 0.1 + i * 0.05 } };
                  const className = "px-4 py-3 text-lg font-medium text-foreground hover:bg-saffron/5 hover:text-saffron rounded-xl transition-colors";
                  return link.to ? (
                    <motion.div key={link.to} {...motionProps}>
                      <Link to={link.to} onClick={() => setOpen(false)} className={className}>{link.label}</Link>
                    </motion.div>
                  ) : (
                    <motion.a key={link.href} href={link.href} onClick={() => setOpen(false)} className={className} {...motionProps}>{link.label}</motion.a>
                  );
                })}
              </nav>
              <div className="mt-auto flex flex-col gap-3 pt-6">
                <RoleSwitcher />
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted">
                  <div className="w-10 h-10 rounded-full bg-saffron/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-saffron" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{user?.full_name || user?.email || 'User'}</p>
                    <p className="text-xs text-foreground/40 capitalize">{role}</p>
                  </div>
                </div>
                {role === 'customer' && (
                  <Link to="/cart" onClick={() => setOpen(false)} className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-foreground/60 hover:text-saffron transition-colors">
                    <ShoppingCart className="w-4 h-4" /> Cart ({itemCount})
                  </Link>
                )}
                <button onClick={() => { setOpen(false); handleLogout(); }} className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-500 hover:text-red-600 transition-colors">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}