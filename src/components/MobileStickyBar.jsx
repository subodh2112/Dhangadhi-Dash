import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Search, Package, Heart, User } from "lucide-react";

const tabs = [
  { to: "/", label: "Home", icon: Home, isHash: false },
  { to: "/#search", label: "Search", icon: Search, isHash: true },
  { to: "/orders", label: "Orders", icon: Package, isHash: false },
  { to: "/profile", label: "Favorites", icon: Heart, isHash: false, favTab: true },
  { to: "/profile", label: "Profile", icon: User, isHash: false },
];

export default function MobileStickyBar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const handleTabClick = (e, tab, isActive) => {
    if (isActive) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border safe-area-pb">
      <div className="flex items-center justify-around px-2 py-1">
        {tabs.map((tab) => {
          const isActive = tab.isHash
            ? currentPath === "/" && location.hash === "#search"
            : tab.favTab
              ? false
              : currentPath === tab.to || (tab.to !== "/" && currentPath.startsWith(tab.to));
          const Icon = tab.icon;
          return (
            <Link
              key={tab.label}
              to={tab.to}
              onClick={(e) => handleTabClick(e, tab, isActive)}
              className={"flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg min-w-[44px] min-h-[44px] justify-center transition-colors " + (isActive ? "text-saffron" : "text-foreground/40")}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-bold">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}