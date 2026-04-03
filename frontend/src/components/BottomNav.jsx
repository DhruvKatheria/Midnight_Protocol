import React from "react";
import { NavLink } from "react-router-dom";

export default function BottomNav() {
  const linkClass = ({ isActive }) =>
    `flex flex-col items-center justify-center ${
      isActive
        ? "bg-primary/10 text-primary rounded-xl px-3 py-1"
        : "text-neutral-500 hover:text-primary/80"
    }`;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-2 bg-neutral-900/80 backdrop-blur-lg shadow-[0_-4px_24px_rgba(0,209,255,0.08)] rounded-t-2xl">
      <NavLink to="/" className={linkClass}>
        <span className="material-symbols-outlined">home</span>
        <span className="font-body text-[10px] font-medium">Home</span>
      </NavLink>
      <NavLink to="/contributor" className={linkClass}>
        <span className="material-symbols-outlined">dashboard</span>
        <span className="font-body text-[10px] font-medium">Dash</span>
      </NavLink>
      <NavLink to="/transactions/all" className={linkClass}>
        <span className="material-symbols-outlined">receipt_long</span>
        <span className="font-body text-[10px] font-medium">Log</span>
      </NavLink>
      <NavLink to="/validator" className={linkClass}>
        <span className="material-symbols-outlined">gavel</span>
        <span className="font-body text-[10px] font-medium">Admin</span>
      </NavLink>
    </nav>
  );
}
