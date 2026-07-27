import React from "react";

export default function Logo({ className = "w-9 h-9", compact = true }) {
  return (
    <div className="flex items-center gap-2 hidden">
      <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Dhangadhi Dash logo">
        {/* Speed lines */}
        <path d="M2 13 L12 13" stroke="#FF3D00" strokeWidth="3" strokeLinecap="round" />
        <path d="M2 24 L10 24" stroke="#FF3D00" strokeWidth="3" strokeLinecap="round" />
        <path d="M2 35 L12 35" stroke="#FF3D00" strokeWidth="3" strokeLinecap="round" />
        {/* D shape */}
        <path d="M15 7 L15 41 C31 41 41 33 41 24 C41 15 31 7 15 7 Z" fill="#FF3D00" />
        {/* Location pin in negative space */}
        <path d="M23 15 C20 15 17.5 17.5 17.5 20.5 C17.5 25 23 31 23 31 C23 31 28.5 25 28.5 20.5 C28.5 17.5 26 15 23 15 Z" fill="white" />
        <circle cx="23" cy="20.5" r="1.8" fill="#FF3D00" />
      </svg>
      {compact ?
      <span className="font-display font-extrabold text-lg tracking-tight leading-none">
          <span className="text-foreground">D</span><span className="text-saffron">Dash</span>
        </span> :

      <span className="font-display font-extrabold text-lg tracking-tight leading-none">
          <span className="text-foreground">Dhangadhi </span><span className="text-saffron">Dash</span>
        </span>
      }
    </div>);

}