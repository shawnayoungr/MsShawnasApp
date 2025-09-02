import React from "react";

// This page is deprecated. Please use the Career Exploration page instead.
export default function CareerSearch() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-100 to-blue-300 px-4">
      <h1 className="text-2xl font-bold text-blue-800 mb-4">Career Search Deprecated</h1>
      <p className="text-center text-base text-gray-700 mb-4">
        Please use the <b>Career Exploration</b> page for all career lookups and comparisons.<br />
        <a href="/career" className="text-blue-600 underline">Go to Career Exploration</a>
      </p>
    </div>
  );
}
