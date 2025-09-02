import React from "react";
import { Link } from "react-router-dom";
import collageImages from "../assets/collageImages";
import TopNav from "../components/TopNav";
import BottomNav from "../components/BottomNav";
import "../App.css";

export default function Splash() {
  return (
    <div className="max-w-[430px] mx-auto w-full min-h-screen bg-gradient-to-b from-[#e0e7ff] to-[#f8fafc] overflow-x-hidden flex flex-col relative shadow-lg rounded-xl border border-gray-100">
  {/* Top Navigation Bar */}
  <TopNav />


      {/* Collage Grid with Overlay Content Box */}
      <div className="relative w-full grid grid-cols-2 gap-0 opacity-95">
        {[
          collageImages[0],
          collageImages[1],
          collageImages[2],
          collageImages[3],
        ].map((img, i) => {
          const isLeft = i % 2 === 0;
          let marginLeft = isLeft ? '-50px' : '-50px';
          return (
            <img
              key={i}
              src={img}
              alt="student collage"
              className="object-cover w-full aspect-[2/1] sm:aspect-[2/1] rounded-none shadow-none"
              style={{
                animationDelay: `${i * 0.2}s`,
                marginLeft,
                objectPosition: isLeft ? 'left' : 'right',
              }}
            />
          );
        })}
        {/* Overlay Content Box */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] flex flex-col items-center justify-center bg-gradient-to-b from-white/95 to-white/80 rounded-xl p-5 shadow-lg z-10" style={{maxWidth: '370px'}}>
          <h1 className="text-2xl font-extrabold text-center text-gray-900 mb-2" style={{fontFamily: 'Poppins, Arial, sans-serif'}}>Ms. Shawna's App</h1>
          <p className="text-base text-center text-gray-800 mb-4 max-w-xs font-medium">Navigate college admissions, scholarships, and your future with confidence</p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Link to="/checklist" className="bg-white text-indigo-800 font-bold py-3 rounded-xl shadow-lg hover:bg-indigo-100 transition text-center text-base border border-indigo-200">Start Your Journey</Link>
            <Link to="/tools" className="bg-white text-indigo-800 font-semibold py-3 rounded-xl shadow-lg hover:bg-indigo-50 transition text-center text-base flex items-center justify-center gap-2 border border-indigo-100">Explore Tools <span className="material-icons">chevron_right</span></Link>
          </div>
        </div>
      </div>

  {/* Bottom Navigation Bar */}
  <BottomNav />
    </div>
  );
}
