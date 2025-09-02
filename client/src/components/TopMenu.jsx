import React, { useState } from "react";
import { Link } from "react-router-dom";

const menuItems = [
  { label: "Home", to: "/", icon: "home" },
  { label: "Checklist", to: "/checklist", icon: "checklist" },
  { label: "Senior Stuff", to: "/senior-stuff", icon: "event" },
  { label: "College Search", to: "/college", icon: "school" },
  { label: "Career Exploration", to: "/career", icon: "work" },
  // ...existing code...
  { label: "Scholarships", to: "/scholarships", icon: "emoji_events" },
  { label: "FAFSA Guide", to: "/fafsa", icon: "account_balance" },
  { label: "Student Success", to: "/success", icon: "star" },
  { label: "STEM", to: "/stem", icon: "science" },
  { label: "ChatGpt Assistant", to: "/chatgpt", icon: "smart_toy" },
];

export default function TopMenu({ open, onClose }) {
  return (
    <div
      className={`fixed top-0 right-0 z-50 h-full w-64 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out rounded-l-2xl border-l border-indigo-100 ${open ? "translate-x-0" : "translate-x-full"}`}
      style={{ maxWidth: "80vw" }}
    >
      <div className="flex items-center justify-between px-4 py-4 border-b border-indigo-50">
        <span className="font-bold text-lg text-indigo-900">Menu</span>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-indigo-100 transition">
          <span className="material-icons text-indigo-700 text-2xl">close</span>
        </button>
      </div>
      <nav className="flex flex-col gap-1 p-4">
        {menuItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-indigo-50 text-indigo-800 font-medium text-base transition"
            onClick={onClose}
          >
            <span className="material-icons text-xl">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
