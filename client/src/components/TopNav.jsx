import React, { useState } from "react";
import TopMenu from "./TopMenu";

export default function TopNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <>
      <header className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-400/80 to-indigo-200/80 rounded-t-xl shadow-md">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-9 h-9 bg-white/80 rounded-full shadow">
            <span className="material-icons text-indigo-700 text-2xl">school</span>
          </span>
          <span className="font-bold text-lg text-indigo-900 tracking-tight align-middle" style={{fontFamily: 'Poppins, Arial, sans-serif'}}>Ms. Shawna's App</span>
        </div>
        <button
          className="p-2 rounded-full hover:bg-indigo-100 transition flex items-center justify-center"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <span className="material-icons text-indigo-700 text-2xl">menu</span>
        </button>
      </header>
      <TopMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      {/* Overlay for closing menu by tapping outside */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  );
}
