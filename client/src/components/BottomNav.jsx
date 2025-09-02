import React from "react";
import { Link } from "react-router-dom";

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full max-w-[430px] mx-auto bg-white/90 border-t border-gray-200 flex justify-around items-center py-2 z-50 rounded-b-xl shadow-lg">
      <Link to="/" className="flex flex-col items-center text-indigo-700">
        <span className="material-icons">home</span>
        <span className="text-xs">Home</span>
      </Link>
      <Link to="/checklist" className="flex flex-col items-center text-indigo-700">
        <span className="material-icons">checklist</span>
        <span className="text-xs">Checklist</span>
      </Link>
      <Link to="/college" className="flex flex-col items-center text-indigo-700">
        <span className="material-icons">school</span>
        <span className="text-xs">College</span>
      </Link>
      <Link to="/career" className="flex flex-col items-center text-indigo-700">
        <span className="material-icons">work</span>
        <span className="text-xs">Career</span>
      </Link>
      <Link to="/scholarships" className="flex flex-col items-center text-indigo-700">
        <span className="material-icons">emoji_events</span>
        <span className="text-xs">Scholarships</span>
      </Link>
    </nav>
  );
}
